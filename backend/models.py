import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from database import Base


def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # checking, savings, credit_card
    bank_name = Column(String)
    currency = Column(String, default="USD")

    user = relationship("User", back_populates="accounts")
    statements = relationship("Statement", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


class Statement(Base):
    __tablename__ = "statements"

    id = Column(String, primary_key=True, default=new_id)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    filename = Column(String)
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="statements")
    transactions = relationship("Transaction", back_populates="statement")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=new_id)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    statement_id = Column(String, ForeignKey("statements.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # credit, debit
    category = Column(String, default="Uncategorized")
    subcategory = Column(String)
    merchant = Column(String)
    is_recurring = Column(Boolean, default=False)
    excluded = Column(Boolean, default=False)
    flagged  = Column(Boolean, default=False)
    hash = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="transactions")
    statement = relationship("Statement", back_populates="transactions")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, default="general")  # subscription, cashback, spending_alert, savings, general
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    potential_saving = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")


class CategorizationRule(Base):
    __tablename__ = "categorization_rules"

    id         = Column(String, primary_key=True, default=new_id)
    user_id    = Column(String, ForeignKey("users.id"), nullable=True)  # NULL = global
    keyword    = Column(String, nullable=False)
    category   = Column(String, nullable=False)
    merchant   = Column(String, nullable=True)
    priority   = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class MortgageAlert(Base):
    __tablename__ = "mortgage_alerts"

    id             = Column(String, primary_key=True, default=new_id)
    current_rate   = Column(Float, nullable=False)
    found_rate     = Column(Float, nullable=False)
    lender         = Column(String, nullable=False)
    source_url     = Column(String)
    monthly_savings = Column(Float, default=0.0)
    annual_savings  = Column(Float, default=0.0)
    recommendation = Column(Text)
    search_date    = Column(String)
    created_at     = Column(DateTime, default=datetime.utcnow)


class MonthlySummary(Base):
    __tablename__ = "monthly_summaries"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_income = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    savings = Column(Float, default=0.0)
    debt_to_income_ratio = Column(Float, default=0.0)
