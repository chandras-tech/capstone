import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas

router = APIRouter()


@router.post("", response_model=schemas.AccountResponse)
def create_account(
    body: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = models.Account(id=str(uuid.uuid4()), user_id=current_user.id, **body.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("", response_model=List[schemas.AccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
