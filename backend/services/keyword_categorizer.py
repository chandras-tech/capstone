"""
Keyword-based transaction categorizer backed by the categorization_rules DB table.
Falls back to hardcoded defaults if DB is unavailable.
"""
from typing import List, Optional


def _load_rules_from_db(db, user_id: str) -> list:
    """Load rules from DB: user-specific + global (user_id=NULL), sorted by priority desc."""
    from sqlalchemy import or_
    import models
    return (
        db.query(models.CategorizationRule)
        .filter(
            or_(
                models.CategorizationRule.user_id == user_id,
                models.CategorizationRule.user_id == None,
            )
        )
        .order_by(models.CategorizationRule.priority.desc())
        .all()
    )


def keyword_categorize(description: str, tx_type: str = "debit",
                        rules: list = None) -> dict:
    """
    Categorize a single transaction using keyword rules.
    Pass `rules` from a DB query for efficiency in batch calls.
    """
    desc = description.lower()

    if rules:
        for rule in rules:
            if rule.keyword in desc:
                if rule.category == "Transfer" and tx_type == "debit":
                    continue
                return {
                    "category": rule.category,
                    "merchant": rule.merchant,
                    "is_recurring": rule.category in ("Subscription", "Utilities", "Insurance", "Housing/Rent"),
                }

    return {"category": "Uncategorized", "merchant": None, "is_recurring": False}


def keyword_categorize_batch(descriptions: List[str], types: List[str],
                              db=None, user_id: str = None) -> list:
    """
    Categorize a batch of transactions.
    If db + user_id provided, loads rules from DB.
    Otherwise falls back to empty (all Uncategorized — Claude will fill in).
    """
    rules = []
    if db and user_id:
        rules = _load_rules_from_db(db, user_id)

    return [
        keyword_categorize(desc, tx_type, rules)
        for desc, tx_type in zip(descriptions, types)
    ]
