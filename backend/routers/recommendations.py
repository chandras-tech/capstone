import uuid
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas
from services.recommender import generate_recommendations

router = APIRouter()


@router.get("", response_model=List[schemas.RecommendationResponse])
def list_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(models.Recommendation.created_at.desc())
        .limit(20)
        .all()
    )


@router.post("/refresh", response_model=List[schemas.RecommendationResponse])
def refresh_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = [a.id for a in db.query(models.Account).filter(models.Account.user_id == current_user.id)]

    txs = (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id.in_(account_ids))
        .order_by(models.Transaction.date.desc())
        .limit(500)
        .all()
    )

    if not txs:
        return []

    cat_totals: dict = defaultdict(float)
    for t in txs:
        if t.type == "debit":
            cat_totals[t.category] += t.amount

    income = sum(t.amount for t in txs if t.type == "credit")

    recs = generate_recommendations(
        category_totals=dict(cat_totals),
        total_income=income,
        transaction_count=len(txs),
    )

    db.query(models.Recommendation).filter(models.Recommendation.user_id == current_user.id).delete()

    saved = []
    for r in recs:
        rec = models.Recommendation(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            type=r.get("type", "general"),
            title=r.get("title", ""),
            body=r.get("body", ""),
            potential_saving=float(r.get("potential_saving", 0)),
        )
        db.add(rec)
        saved.append(rec)

    db.commit()
    for r in saved:
        db.refresh(r)
    return saved
