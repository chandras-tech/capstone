from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from services.categorizer import categorize_transactions
from services.keyword_categorizer import keyword_categorize_batch
import models
import schemas

router = APIRouter()


def _user_account_ids(db, user_id):
    return [a.id for a in db.query(models.Account).filter(models.Account.user_id == user_id)]


@router.get("", response_model=List[schemas.TransactionResponse])
def list_transactions(
    month:      Optional[int] = Query(None),
    year:       Optional[int] = Query(None),
    category:   Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
    limit:  int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = _user_account_ids(db, current_user.id)
    q = db.query(models.Transaction).filter(models.Transaction.account_id.in_(account_ids))

    if account_id:
        q = q.filter(models.Transaction.account_id == account_id)
    if month:
        q = q.filter(extract("month", models.Transaction.date) == month)
    if year:
        q = q.filter(extract("year", models.Transaction.date) == year)
    if category:
        q = q.filter(models.Transaction.category == category)

    return q.order_by(models.Transaction.date.desc()).offset(offset).limit(limit).all()


@router.post("/recategorize")
def recategorize(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Re-run Claude categorization on all Uncategorized transactions."""
    account_ids = _user_account_ids(db, current_user.id)

    txs = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.category == "Uncategorized",
        )
        .order_by(models.Transaction.date.desc())
        .limit(200)   # cap per call to avoid timeout
        .all()
    )

    if not txs:
        return {"updated": 0, "message": "All transactions are already categorized"}

    # Keywords first (from DB rules), Claude for unknowns
    keyword_cats = keyword_categorize_batch(
        [t.description for t in txs],
        [t.type for t in txs],
        db=db, user_id=current_user.id,
    )
    unknown_indices = [i for i, c in enumerate(keyword_cats) if c["category"] == "Uncategorized"]
    claude_cats = {}
    if unknown_indices:
        claude_results = categorize_transactions([txs[i].description for i in unknown_indices])
        claude_cats = dict(zip(unknown_indices, claude_results))

    categories = []
    for i, kw in enumerate(keyword_cats):
        categories.append(kw if kw["category"] != "Uncategorized" else claude_cats.get(i, kw))

    for i, tx in enumerate(txs):
        cat = categories[i] if i < len(categories) else {}
        tx.category    = cat.get("category", "Uncategorized")
        tx.merchant    = tx.merchant or cat.get("merchant")
        tx.is_recurring = bool(cat.get("is_recurring", False))

    db.commit()
    return {"updated": len(txs), "message": f"Categorized {len(txs)} transactions"}


@router.patch("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: str,
    body: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = _user_account_ids(db, current_user.id)
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.account_id.in_(account_ids),
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.category = body.category
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/watchlist", response_model=List[schemas.TransactionResponse])
def watchlist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all flagged transactions sorted by most recent."""
    account_ids = _user_account_ids(db, current_user.id)
    return (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.flagged == True,
        )
        .order_by(models.Transaction.date.desc())
        .all()
    )


@router.patch("/{transaction_id}/flag", response_model=schemas.TransactionResponse)
def flag_transaction(
    transaction_id: str,
    body: schemas.TransactionFlag,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = _user_account_ids(db, current_user.id)
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.account_id.in_(account_ids),
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.flagged = body.flagged
    db.commit()
    db.refresh(tx)
    return tx


@router.patch("/{transaction_id}/exclude", response_model=schemas.TransactionResponse)
def exclude_transaction(
    transaction_id: str,
    body: schemas.TransactionExclude,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = _user_account_ids(db, current_user.id)
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.account_id.in_(account_ids),
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.excluded = body.excluded
    db.commit()
    db.refresh(tx)
    return tx
