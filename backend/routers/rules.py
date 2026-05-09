import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.RuleResponse])
def list_rules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return global rules + user's own rules, sorted by priority desc."""
    return (
        db.query(models.CategorizationRule)
        .filter(
            (models.CategorizationRule.user_id == current_user.id) |
            (models.CategorizationRule.user_id == None)
        )
        .order_by(models.CategorizationRule.priority.desc(),
                  models.CategorizationRule.keyword)
        .all()
    )


@router.post("", response_model=schemas.RuleResponse)
def create_rule(
    body: schemas.RuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rule = models.CategorizationRule(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        keyword=body.keyword.lower().strip(),
        category=body.category,
        merchant=body.merchant,
        priority=body.priority,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rule = db.query(models.CategorizationRule).filter(
        models.CategorizationRule.id == rule_id,
        models.CategorizationRule.user_id == current_user.id,  # can only delete own rules
    ).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"deleted": rule_id}
