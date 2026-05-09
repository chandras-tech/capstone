from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Accounts ──────────────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    name: str
    type: str          # checking | savings | credit_card
    bank_name: Optional[str] = None
    currency: str = "USD"


class AccountResponse(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    bank_name: Optional[str]
    currency: str

    model_config = {"from_attributes": True}


# ── Statements ────────────────────────────────────────────────────────────────

class StatementResponse(BaseModel):
    id: str
    account_id: str
    filename: Optional[str]
    period_start: Optional[datetime]
    period_end: Optional[datetime]
    status: str
    error_message: Optional[str]
    created_at: datetime
    transaction_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# ── Transactions ──────────────────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    id: str
    account_id: str
    statement_id: str
    date: datetime
    description: str
    amount: float
    type: str
    category: str
    subcategory: Optional[str]
    merchant: Optional[str]
    is_recurring: bool
    excluded: bool
    flagged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionUpdate(BaseModel):
    category: str


class TransactionExclude(BaseModel):
    excluded: bool

class TransactionFlag(BaseModel):
    flagged: bool


# ── Categorization Rules ──────────────────────────────────────────────────────

class RuleCreate(BaseModel):
    keyword: str
    category: str
    merchant: Optional[str] = None
    priority: int = 0


class RuleResponse(BaseModel):
    id: str
    user_id: Optional[str]
    keyword: str
    category: str
    merchant: Optional[str]
    priority: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    savings: float
    savings_rate: float
    dti_ratio: float
    transaction_count: int
    month: int
    year: int


class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int


class TrendPoint(BaseModel):
    month: int
    year: int
    label: str
    income: float
    expenses: float
    savings: float


# ── Recommendations ───────────────────────────────────────────────────────────

class RecommendationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    potential_saving: float
    created_at: datetime

    model_config = {"from_attributes": True}
