import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
import bcrypt
from jose import jwt
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter()


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ALGORITHM  = "HS256"


def _create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=schemas.Token)
def register(body: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        id=str(uuid.uuid4()),
        email=body.email,
        name=body.name,
        password_hash=_hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": _create_token(user.id), "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not _verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": _create_token(user.id), "token_type": "bearer", "user": user}
