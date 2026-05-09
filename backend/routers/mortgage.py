import os
import uuid
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models

router = APIRouter()

AGENT_TOKEN = os.getenv("FINSIGHT_AGENT_TOKEN", "")


class RateAlertPayload(BaseModel):
    current_rate: float
    found_rate: float
    lender: str
    source_url: str
    monthly_savings: float
    annual_savings: float
    recommendation: str
    search_date: str


class RateAlertResponse(BaseModel):
    id: str
    current_rate: float
    found_rate: float
    lender: str
    source_url: str
    monthly_savings: float
    annual_savings: float
    recommendation: str
    search_date: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/rate-alert", response_model=RateAlertResponse)
def receive_rate_alert(
    payload: RateAlertPayload,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Endpoint for OpenClaw agent to POST mortgage rate alerts."""
    if not AGENT_TOKEN or authorization != f"Bearer {AGENT_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized agent token")

    alert = models.MortgageAlert(
        id=str(uuid.uuid4()),
        current_rate=payload.current_rate,
        found_rate=payload.found_rate,
        lender=payload.lender,
        source_url=payload.source_url,
        monthly_savings=payload.monthly_savings,
        annual_savings=payload.annual_savings,
        recommendation=payload.recommendation,
        search_date=payload.search_date,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/rate-alerts", response_model=List[RateAlertResponse])
def list_rate_alerts(db: Session = Depends(get_db)):
    """Public endpoint — returns all mortgage rate alerts found by the agent."""
    return (
        db.query(models.MortgageAlert)
        .order_by(models.MortgageAlert.created_at.desc())
        .limit(10)
        .all()
    )
