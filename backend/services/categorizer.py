import json
import os
from typing import Dict, List

from services.claude_client import call_claude

CATEGORIES = [
    "Food/Groceries", "Dining/Restaurants", "Shopping", "Transport/Gas",
    "Housing/Rent", "Utilities", "Entertainment", "Healthcare",
    "Income/Salary", "Transfer", "Subscription", "Travel",
    "Education", "Personal Care", "Insurance", "Loan Payment", "Other",
]

_FALLBACK = {"category": "Uncategorized", "merchant": None, "is_recurring": False}


def categorize_transactions(descriptions: List[str]) -> List[Dict]:
    """Categorize descriptions in batches of 20 using Claude Haiku."""
    results: List[Dict] = []
    for i in range(0, len(descriptions), 20):
        results.extend(_categorize_batch(descriptions[i : i + 20]))
    return results


def _categorize_batch(descriptions: List[str]) -> List[Dict]:
    numbered = "\n".join(f"{i+1}. {d}" for i, d in enumerate(descriptions))
    prompt = f"""Categorize each bank transaction. Return ONLY a JSON array — one object per line.

Valid categories: {", ".join(CATEGORIES)}

Transactions:
{numbered}

Return exactly {len(descriptions)} objects:
[
  {{"category": "Food/Groceries", "merchant": "Whole Foods", "is_recurring": false}},
  ...
]

Rules:
- merchant: clean business name or null
- is_recurring: true for subscriptions, rent, utilities, insurance"""

    try:
        text = call_claude(prompt, max_tokens=1024).strip()
        start, end = text.find("["), text.rfind("]") + 1
        if start >= 0 and end > start:
            parsed = json.loads(text[start:end])
            # Pad if Claude returned fewer items than expected
            while len(parsed) < len(descriptions):
                parsed.append(_FALLBACK)
            return parsed[:len(descriptions)]
    except Exception as e:
        print(f"[categorizer] error: {e}")

    return [_FALLBACK] * len(descriptions)
