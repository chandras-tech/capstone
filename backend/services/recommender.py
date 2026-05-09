import json
import os
from typing import Dict, List

from services.claude_client import call_claude

_FALLBACK = [{
    "type": "general",
    "title": "Upload more statements for personalized tips",
    "body": "Add at least 2–3 months of transactions so FinSight can identify patterns and surface savings opportunities.",
    "potential_saving": 0.0,
}]


def generate_recommendations(
    category_totals: Dict[str, float],
    total_income: float,
    transaction_count: int,
) -> List[Dict]:
    spend_lines = "\n".join(
        f"  - {cat}: ${amt:.2f}"
        for cat, amt in sorted(category_totals.items(), key=lambda x: -x[1])
        if amt > 0
    )

    prompt = f"""You are a personal finance advisor. Generate 4–6 concise, dollar-quantified recommendations.

Total Income:       ${total_income:.2f}
Transactions:       {transaction_count}
Spending by Category:
{spend_lines}

Return ONLY a JSON array:
[
  {{
    "type": "subscription|cashback|spending_alert|savings|general",
    "title": "Max 60 chars",
    "body": "2-3 sentences with specific dollar amounts.",
    "potential_saving": 0.00
  }}
]

Focus on: unused subscriptions, high-spend categories, cashback opportunities, savings rate."""

    try:
        text = call_claude(prompt, max_tokens=1500, model="claude-sonnet-4-6").strip()
        start, end = text.find("["), text.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except Exception as e:
        print(f"[recommender] error: {e}")

    return _FALLBACK
