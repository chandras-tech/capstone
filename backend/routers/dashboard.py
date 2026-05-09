from collections import defaultdict
from datetime import datetime, date
from typing import List, Optional
import statistics

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas

router = APIRouter()

DEBT_CATEGORIES = {"Housing/Rent", "Mortgage", "Loan Payment", "Insurance"}
MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def _account_ids(db, user_id):
    return [a.id for a in db.query(models.Account).filter(models.Account.user_id == user_id)]


@router.get("/summary", response_model=schemas.DashboardSummary)
def summary(
    month:      int           = Query(default=datetime.now().month),
    year:       int           = Query(default=datetime.now().year),
    from_month: Optional[int] = Query(default=None),
    from_year:  Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(_account_ids(db, current_user.id)),
        models.Transaction.excluded == False,
    )

    if from_month and from_year:
        # Date range: from_month/year → month/year inclusive
        start = datetime(from_year, from_month, 1)
        # End = last day of 'month/year'
        if month == 12:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 1, 1)
        q = q.filter(models.Transaction.date >= start, models.Transaction.date < end)
    else:
        q = q.filter(
            extract("month", models.Transaction.date) == month,
            extract("year",  models.Transaction.date) == year,
        )

    txs = q.all()

    income   = sum(t.amount for t in txs if t.type == "credit")
    expenses = sum(t.amount for t in txs if t.type == "debit")
    savings  = income - expenses
    DEBT_LOWER = {c.lower() for c in DEBT_CATEGORIES}
    debt     = sum(t.amount for t in txs if t.type == "debit" and t.category.lower() in DEBT_LOWER)

    return {
        "total_income":      round(income, 2),
        "total_expenses":    round(expenses, 2),
        "savings":           round(savings, 2),
        "savings_rate":      round(savings / income * 100, 1) if income else 0,
        "dti_ratio":         round(debt / income * 100, 1) if income else 0,
        "transaction_count": len(txs),
        "month": month,
        "year":  year,
    }


@router.get("/categories", response_model=List[schemas.CategoryBreakdown])
def categories(
    month: int = Query(default=datetime.now().month),
    year:  int = Query(default=datetime.now().year),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txs = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(_account_ids(db, current_user.id)),
        models.Transaction.type == "debit",
        models.Transaction.excluded == False,
        extract("month", models.Transaction.date) == month,
        extract("year",  models.Transaction.date) == year,
    ).all()

    total = sum(t.amount for t in txs)
    cat_map: dict = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for t in txs:
        cat_map[t.category]["amount"] += t.amount
        cat_map[t.category]["count"]  += 1

    return [
        {
            "category":   cat,
            "amount":     round(data["amount"], 2),
            "percentage": round(data["amount"] / total * 100, 1) if total else 0,
            "count":      data["count"],
        }
        for cat, data in sorted(cat_map.items(), key=lambda x: -x[1]["amount"])
    ]


@router.get("/trends", response_model=List[schemas.TrendPoint])
def trends(
    months: int = Query(default=6, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txs = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(_account_ids(db, current_user.id)),
        models.Transaction.excluded == False,
    ).all()

    now = datetime.now()
    result = []
    for i in range(months - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        m_txs   = [t for t in txs if t.date.month == m and t.date.year == y]
        income  = sum(t.amount for t in m_txs if t.type == "credit")
        expense = sum(t.amount for t in m_txs if t.type == "debit")
        result.append({
            "month":    m,
            "year":     y,
            "label":    f"{MONTH_NAMES[m-1]} {y}",
            "income":   round(income, 2),
            "expenses": round(expense, 2),
            "savings":  round(income - expense, 2),
        })
    return result


RECURRING_CATEGORIES = {"Housing/Rent", "Mortgage", "HOA", "Utilities", "Subscription", "Insurance", "Loan Payment", "Kid Learning", "Kid Spending"}


@router.get("/recurring")
def recurring(
    months: int = Query(default=12, le=24),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Monthly breakdown: recurring bill categories vs adhoc/miscellaneous spending."""
    txs = db.query(models.Transaction).filter(
        models.Transaction.account_id.in_(_account_ids(db, current_user.id)),
        models.Transaction.type == "debit",
        models.Transaction.excluded == False,
    ).all()

    now = datetime.now()
    result = []

    for i in range(months - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1

        m_txs = [t for t in txs if t.date.month == m and t.date.year == y]

        # Split into recurring categories and adhoc
        recurring_by_cat: dict = defaultdict(float)
        adhoc = 0.0

        RECURRING_LOWER = {c.lower() for c in RECURRING_CATEGORIES}
        for t in m_txs:
            if t.category.lower() in RECURRING_LOWER or t.is_recurring:
                # Normalize category to title case for consistent chart display
                normalized = t.category.title()
                recurring_by_cat[normalized] += t.amount
            else:
                adhoc += t.amount

        result.append({
            "month":   m,
            "year":    y,
            "label":   f"{MONTH_NAMES[m-1]} {y}",
            "adhoc":   round(adhoc, 2),
            **{cat: round(amt, 2) for cat, amt in recurring_by_cat.items()},
        })

    return result


# ── AI Insights ───────────────────────────────────────────────────────────────

@router.get("/insights")
def insights(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account_ids = _account_ids(db, current_user.id)
    txs = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.excluded == False,
        )
        .order_by(models.Transaction.date.desc())
        .limit(1500)
        .all()
    )
    return {
        "cash_flow":          _cashflow_prediction(txs),
        "subscription_audit": _subscription_audit(txs),
        "wealth_leaks":       _wealth_leaks(txs),
    }


def _cashflow_prediction(txs):
    import calendar
    now = datetime.now()
    RECURRING_LOWER = {c.lower() for c in RECURRING_CATEGORIES}
    recurring = [t for t in txs if t.type == "debit" and (
        t.category.lower() in RECURRING_LOWER or t.is_recurring)]

    merchant_days:    dict = defaultdict(list)
    merchant_amounts: dict = defaultdict(list)
    for t in recurring:
        key = t.merchant or t.description[:35]
        merchant_days[key].append(t.date.day)
        merchant_amounts[key].append(t.amount)

    upcoming = []
    for merchant, days in merchant_days.items():
        typical_day = round(statistics.mean(days))
        avg_amount  = round(statistics.mean(merchant_amounts[merchant]), 2)
        if typical_day >= now.day:
            days_until = typical_day - now.day
        else:
            days_in_month = calendar.monthrange(now.year, now.month)[1]
            days_until    = (days_in_month - now.day) + typical_day
        upcoming.append({"merchant": merchant, "amount": avg_amount,
                         "typical_day": typical_day, "days_until": days_until})

    upcoming.sort(key=lambda x: x["days_until"])
    next_30       = [b for b in upcoming if b["days_until"] <= 30]
    total_next_30 = round(sum(b["amount"] for b in next_30), 2)

    income_txs      = [t for t in txs if t.type == "credit" and t.category.lower() == "income/salary"]
    avg_income      = round(statistics.mean([t.amount for t in income_txs]), 2) if income_txs else 0
    typical_payday  = round(statistics.mean([t.date.day for t in income_txs])) if income_txs else None
    buffer          = round(avg_income - total_next_30, 2) if avg_income else None

    return {
        "upcoming_bills":     upcoming[:8],
        "total_next_30_days": total_next_30,
        "avg_monthly_income": avg_income,
        "typical_payday":     typical_payday,
        "buffer":             buffer,
        "buffer_pct":         round(buffer / avg_income * 100, 1) if avg_income and buffer else None,
    }


def _subscription_audit(txs):
    sub_txs = [t for t in txs if t.category.lower() == "subscription"]
    merchant_months:  dict = defaultdict(set)
    merchant_amounts: dict = defaultdict(list)
    for t in sub_txs:
        key = t.merchant or t.description[:35]
        merchant_months[key].add((t.date.year, t.date.month))
        merchant_amounts[key].append(t.amount)

    subs = []
    for merchant, months in merchant_months.items():
        avg = round(statistics.mean(merchant_amounts[merchant]), 2)
        subs.append({"merchant": merchant, "monthly": avg,
                     "annual": round(avg * 12, 2), "months_seen": len(months)})
    subs.sort(key=lambda x: -x["monthly"])
    total_monthly = round(sum(s["monthly"] for s in subs), 2)

    TRADING_KW   = ["tradingview", "riseguide", "smarttrader", "jawtrades", "wisey", "dataexpert"]
    STREAMING_KW = ["netflix", "hulu", "disney", "prime video", "youtube", "apple"]

    trading   = [s for s in subs if any(k in s["merchant"].lower() for k in TRADING_KW)]
    streaming = [s for s in subs if any(k in s["merchant"].lower() for k in STREAMING_KW)]

    overlaps = {}
    if len(trading) > 1:
        overlaps["trading_tools"] = {
            "items": trading,
            "total_monthly": round(sum(t["monthly"] for t in trading), 2),
            "tip": f"{len(trading)} trading tools — keep the best one, save ${round(sum(t['monthly'] for t in trading[1:]), 2)}/mo",
        }
    if len(streaming) > 1:
        overlaps["streaming"] = {
            "items": streaming,
            "total_monthly": round(sum(s["monthly"] for s in streaming), 2),
            "tip": f"{len(streaming)} streaming services totalling ${round(sum(s['monthly'] for s in streaming), 2)}/mo — are you watching all of them?",
        }

    potential = round(sum(
        g["total_monthly"] - min(i["monthly"] for i in g["items"])
        for g in overlaps.values()
    ) * 12, 2)

    return {"subscriptions": subs, "total_monthly": total_monthly,
            "total_annual": round(total_monthly * 12, 2),
            "overlapping": overlaps, "potential_saving": potential}


def _wealth_leaks(txs):
    small = [t for t in txs if t.type == "debit" and t.amount < 30]
    merchant_months:  dict = defaultdict(set)
    merchant_amounts: dict = defaultdict(list)
    for t in small:
        key = t.merchant or t.description[:35]
        merchant_months[key].add((t.date.year, t.date.month))
        merchant_amounts[key].append(t.amount)

    leaks = []
    for merchant, months in merchant_months.items():
        if len(months) >= 2:
            avg = round(statistics.mean(merchant_amounts[merchant]), 2)
            leaks.append({"merchant": merchant, "monthly": avg,
                          "annual": round(avg * 12, 2), "months_seen": len(months)})

    leaks.sort(key=lambda x: -x["annual"])
    total_annual = round(sum(l["annual"] for l in leaks), 2)
    return {"leaks": leaks[:12], "total_annual": total_annual,
            "total_monthly": round(total_annual / 12, 2)}
