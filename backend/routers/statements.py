import hashlib
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas
from services.parser import parse_statement
from services.categorizer import categorize_transactions
from services.keyword_categorizer import keyword_categorize_batch

router = APIRouter()


@router.post("/upload", response_model=schemas.StatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    account_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    statement = models.Statement(
        id=str(uuid.uuid4()),
        account_id=account_id,
        filename=file.filename,
        status="processing",
    )
    db.add(statement)
    db.commit()

    try:
        content = await file.read()
        raw = parse_statement(content, file.filename or "")

        if not raw:
            statement.status = "failed"
            statement.error_message = "No transactions found in this file. Try exporting as CSV from your bank instead."
            db.commit()
            db.refresh(statement)
            return statement

        dates = [t["date"] for t in raw]
        statement.period_start = min(dates)
        statement.period_end   = max(dates)

        # Step 1: keyword categorize from DB rules instantly (no API)
        keyword_cats = keyword_categorize_batch(
            [t["description"] for t in raw],
            [t["type"] for t in raw],
            db=db, user_id=current_user.id,
        )

        # Step 2: send only still-Uncategorized to Claude
        unknown_indices = [i for i, c in enumerate(keyword_cats) if c["category"] == "Uncategorized"]
        claude_cats = {}
        if unknown_indices:
            unknown_descs = [raw[i]["description"] for i in unknown_indices]
            claude_results = categorize_transactions(unknown_descs)
            claude_cats = dict(zip(unknown_indices, claude_results))

        # Merge: keyword wins, Claude fills gaps
        categories = []
        for i, kw in enumerate(keyword_cats):
            if kw["category"] != "Uncategorized":
                categories.append(kw)
            else:
                categories.append(claude_cats.get(i, kw))

        # Deduplicate within this batch first (Claude Vision can extract same row twice)
        seen_in_batch: set = set()
        saved = 0
        for i, tx_raw in enumerate(raw):
            cat = categories[i] if i < len(categories) else {}
            tx_hash = hashlib.md5(
                f"{tx_raw['date'].date()}-{tx_raw['description']}-{tx_raw['amount']}-{account_id}".encode()
            ).hexdigest()

            if tx_hash in seen_in_batch:
                continue
            seen_in_batch.add(tx_hash)

            db.add(models.Transaction(
                id=str(uuid.uuid4()),
                account_id=account_id,
                statement_id=statement.id,
                date=tx_raw["date"],
                description=tx_raw["description"],
                amount=tx_raw["amount"],
                type=tx_raw["type"],
                category=cat.get("category", "Uncategorized"),
                merchant=cat.get("merchant"),
                is_recurring=cat.get("is_recurring", False),
                hash=tx_hash,
            ))

            # Flush one at a time — skip gracefully if hash already exists in DB
            try:
                db.flush()
                saved += 1
            except IntegrityError:
                db.rollback()

        if saved == 0:
            statement.status = "failed"
            statement.error_message = f"All {len(raw)} transactions already exist — duplicate upload."
        else:
            statement.status = "completed"
        db.commit()

    except Exception as e:
        statement.status = "failed"
        statement.error_message = str(e)
        try:
            db.commit()
        except Exception:
            db.rollback()
            statement.status = "failed"
            statement.error_message = str(e)
            db.commit()

    db.refresh(statement)
    count = db.query(models.Transaction).filter(models.Transaction.statement_id == statement.id).count()
    result = schemas.StatementResponse.model_validate(statement).model_dump()
    result["transaction_count"] = count
    return result


@router.get("", response_model=List[schemas.StatementResponse])
def list_statements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == current_user.id)]
    statements  = (
        db.query(models.Statement)
        .filter(models.Statement.account_id.in_(account_ids))
        .order_by(models.Statement.created_at.desc())
        .all()
    )
    result = []
    for s in statements:
        count = db.query(models.Transaction).filter(models.Transaction.statement_id == s.id).count()
        row = schemas.StatementResponse.model_validate(s).model_dump()
        row["transaction_count"] = count
        result.append(row)
    return result


@router.get("/{statement_id}/status")
def statement_status(
    statement_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    statement = db.query(models.Statement).filter(models.Statement.id == statement_id).first()
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    count = db.query(models.Transaction).filter(models.Transaction.statement_id == statement_id).count()
    return {"id": statement.id, "status": statement.status, "transaction_count": count, "error": statement.error_message}
