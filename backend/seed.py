"""
Run this to seed demo data for testing.
Usage: python seed.py
"""
import os, uuid, random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Clean slate ───────────────────────────────────────────────────────────────
db.query(models.Recommendation).delete()
db.query(models.Transaction).delete()
db.query(models.Statement).delete()
db.query(models.Account).delete()
db.query(models.User).delete()
db.commit()

# ── User ──────────────────────────────────────────────────────────────────────
import bcrypt

user = models.User(
    id=str(uuid.uuid4()),
    email="demo@finsight.com",
    name="Demo User",
    password_hash=bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode(),
)
db.add(user)
db.commit()
print(f"Created user: {user.email} / password123")

# ── Account ───────────────────────────────────────────────────────────────────
account = models.Account(
    id=str(uuid.uuid4()),
    user_id=user.id,
    name="Chase Checking",
    type="checking",
    bank_name="Chase",
)
db.add(account)
db.commit()

# ── Statement ─────────────────────────────────────────────────────────────────
statement = models.Statement(
    id=str(uuid.uuid4()),
    account_id=account.id,
    filename="demo_seed.csv",
    status="completed",
    period_start=datetime.now() - timedelta(days=90),
    period_end=datetime.now(),
)
db.add(statement)
db.commit()

# ── Transactions ──────────────────────────────────────────────────────────────
import hashlib

SEED_TRANSACTIONS = [
    # Income
    ("Payroll Direct Deposit ADP",   5200.00, "credit", "Income/Salary",      False),
    ("Payroll Direct Deposit ADP",   5200.00, "credit", "Income/Salary",      False),
    ("Payroll Direct Deposit ADP",   5200.00, "credit", "Income/Salary",      False),
    # Housing
    ("Zelle Transfer - Landlord",    1850.00, "debit",  "Housing/Rent",       True),
    ("Zelle Transfer - Landlord",    1850.00, "debit",  "Housing/Rent",       True),
    ("Zelle Transfer - Landlord",    1850.00, "debit",  "Housing/Rent",       True),
    # Groceries
    ("WHOLEFDS MKT #1847",            127.43, "debit",  "Food/Groceries",     False),
    ("KROGER #0512",                   98.21, "debit",  "Food/Groceries",     False),
    ("TRADER JOE S #142",              74.55, "debit",  "Food/Groceries",     False),
    ("WHOLEFDS MKT #1847",            143.12, "debit",  "Food/Groceries",     False),
    ("HEB #227",                       88.90, "debit",  "Food/Groceries",     False),
    # Dining
    ("CHIPOTLE MEXICAN GRILL",         18.45, "debit",  "Dining/Restaurants", False),
    ("DOORDASH*DELIVERY",              34.20, "debit",  "Dining/Restaurants", False),
    ("STARBUCKS STORE #1234",          12.80, "debit",  "Dining/Restaurants", False),
    ("UBER EATS",                      28.50, "debit",  "Dining/Restaurants", False),
    ("DOORDASH*DELIVERY",              41.30, "debit",  "Dining/Restaurants", False),
    ("CHIPOTLE MEXICAN GRILL",         16.90, "debit",  "Dining/Restaurants", False),
    # Subscriptions
    ("NETFLIX.COM",                    15.99, "debit",  "Subscription",       True),
    ("SPOTIFY USA",                     9.99, "debit",  "Subscription",       True),
    ("HULU",                           17.99, "debit",  "Subscription",       True),
    ("AMAZON PRIME",                   14.99, "debit",  "Subscription",       True),
    ("NETFLIX.COM",                    15.99, "debit",  "Subscription",       True),
    ("SPOTIFY USA",                     9.99, "debit",  "Subscription",       True),
    # Transport
    ("SHELL OIL 12345",                62.40, "debit",  "Transport/Gas",      False),
    ("EXXONMOBIL 87654",               55.80, "debit",  "Transport/Gas",      False),
    ("UBER *TRIP",                     14.20, "debit",  "Transport/Gas",      False),
    # Utilities
    ("CITY WATER BILL",                48.00, "debit",  "Utilities",          True),
    ("AT&T UVERSE",                    89.00, "debit",  "Utilities",          True),
    ("TXUENERGY",                     120.45, "debit",  "Utilities",          True),
    # Shopping
    ("AMAZON.COM*PURCHASE",            67.32, "debit",  "Shopping",           False),
    ("TARGET 0123",                    54.10, "debit",  "Shopping",           False),
    ("AMAZON.COM*PURCHASE",            89.99, "debit",  "Shopping",           False),
    # Healthcare
    ("CVS PHARMACY #4521",             23.14, "debit",  "Healthcare",         False),
    ("BLUE CROSS SHIELD",             245.00, "debit",  "Insurance",          True),
]

now = datetime.now()
for i, (desc, amount, tx_type, category, recurring) in enumerate(SEED_TRANSACTIONS):
    days_ago = random.randint(0, 89)
    tx_date  = now - timedelta(days=days_ago)
    tx_hash  = hashlib.md5(f"{tx_date.date()}-{desc}-{amount}-{account.id}-{i}".encode()).hexdigest()

    db.add(models.Transaction(
        id=str(uuid.uuid4()),
        account_id=account.id,
        statement_id=statement.id,
        date=tx_date,
        description=desc,
        amount=amount,
        type=tx_type,
        category=category,
        merchant=desc.split("*")[0].strip().title(),
        is_recurring=recurring,
        hash=tx_hash,
    ))

db.commit()
print(f"Seeded {len(SEED_TRANSACTIONS)} transactions")
print("\nReady to test:")
print("  POST /auth/login  →  email: demo@finsight.com  password: password123")
print(f"  account_id: {account.id}")
