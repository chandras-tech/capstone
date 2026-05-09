import io
import json
import os
from datetime import datetime
from typing import Any, Dict, List

import fitz  # PyMuPDF
import pandas as pd
import pdfplumber
from services.claude_client import call_claude, call_claude_vision


DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d-%m-%Y", "%b %d, %Y", "%B %d, %Y"]


def parse_statement(content: bytes, filename: str) -> List[Dict[str, Any]]:
    """Auto-detect PDF or CSV and parse accordingly."""
    if filename.lower().endswith(".pdf"):
        return parse_pdf(content)
    return parse_csv(content)


def parse_pdf(content: bytes) -> List[Dict[str, Any]]:
    """Extract transactions from a bank PDF using Claude Vision.
    Renders each page as an image — works for Chase, Amex, Wells Fargo,
    and any bank regardless of font encoding.
    """
    return _parse_pdf_vision(content)


def _parse_pdf_vision(content: bytes) -> List[Dict[str, Any]]:
    """Render each PDF page as PNG and process page-by-page for higher accuracy."""
    doc = fitz.open(stream=content, filetype="pdf")

    PROMPT = """This is one page from a bank or credit card statement.

Extract only INDIVIDUAL merchant/vendor transaction line items — rows that show a specific store, service, or payment made on a specific date.

Return ONLY a JSON array (no explanation):
[
  {"date": "2026-03-20", "description": "AMAZON MKTPLACE PMTS", "amount": 160.49, "type": "debit"},
  {"date": "2026-04-05", "description": "AUTOMATIC PAYMENT - THANK YOU", "amount": 302.08, "type": "credit"}
]

INCLUDE:
- Individual purchases at specific merchants (Amazon, Walmart, Starbucks, etc.)
- Individual payments made (automatic payment, online payment)
- Individual fees or interest charges

STRICTLY SKIP these summary/aggregate rows — they are NOT real transactions:
- "Previous Balance" — this is a carry-over total, NOT a transaction
- "Payment, Credits" — this is a category subtotal, NOT a transaction
- "Purchases" — this is a category subtotal, NOT a transaction
- "New Balance", "Credit Limit", "Available Credit", "Minimum Payment Due"
- Any row that is a sum or total of other rows
- Column headers, page headers, page footers, statement period dates

Rules:
- date: YYYY-MM-DD (infer year from page header if not shown per row)
- amount: positive float, never negative
- type: "debit" for purchases/charges/fees, "credit" for payments/refunds/deposits
- If no individual transactions on this page, return []"""

    all_transactions = []

    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8))
        img = pix.tobytes("png")
        print(f"[vision] processing page {i+1}/{len(doc)}...")
        try:
            text = call_claude_vision([img], PROMPT, max_tokens=4096)
            start, end = text.find("["), text.rfind("]") + 1
            if start < 0 or end <= start:
                continue
            rows = json.loads(text[start:end])
            for r in rows:
                try:
                    desc = str(r["description"]).strip()
                    if _is_summary_row(desc):
                        print(f"[parser] skipped summary row: {desc}")
                        continue
                    all_transactions.append({
                        "date":        datetime.strptime(r["date"], "%Y-%m-%d"),
                        "description": desc,
                        "amount":      abs(float(r["amount"])),
                        "type":        r["type"],
                    })
                except Exception:
                    continue
        except Exception as e:
            print(f"[vision] page {i+1} error: {e}")
            continue

    return all_transactions


# Summary/aggregate row descriptions that are NOT real transactions
_SUMMARY_PATTERNS = [
    "previous balance",
    "new balance",
    "payment, credits",
    "payments and credits",
    "purchases",
    "credit limit",
    "available credit",
    "minimum payment",
    "payment due",
    "closing balance",
    "opening balance",
    "balance forward",
    "statement balance",
    "total purchases",
    "total payments",
    "total fees",
    "total interest",
    "cash advances",
    "balance transfers",
    "automatic payment - thank you",
    "automatic payment thank you",
    "payment thank you",
]


def _is_summary_row(description: str) -> bool:
    desc = description.lower().strip()
    return any(desc == pattern or desc.startswith(pattern) for pattern in _SUMMARY_PATTERNS)


def _claude_parse(raw_text: str) -> List[Dict[str, Any]]:
    """Send raw PDF text to Claude and get structured transactions back."""
    prompt = f"""This is raw text extracted from a bank or credit card statement PDF (possibly Chase, Amex, Wells Fargo, or similar).

Your job: find every individual transaction and return them as a JSON array.

Raw text:
{raw_text}

Return ONLY a valid JSON array with no explanation:
[
  {{"date": "2026-03-01", "description": "AMAZON.COM PURCHASE", "amount": 45.23, "type": "debit"}},
  {{"date": "2026-03-01", "description": "PAYMENT THANK YOU", "amount": 500.00, "type": "credit"}}
]

Rules:
- date: YYYY-MM-DD (infer year from statement if not shown per row)
- amount: positive float, never negative
- type: "debit" for purchases/charges/fees, "credit" for payments/refunds/deposits
- description: clean merchant name, strip trailing numbers/codes
- INCLUDE: all purchases, payments, credits, fees, interest charges
- SKIP: opening balance, closing balance, credit limit, minimum payment rows, calendar, contact info
- Chase statements: transactions look like "03/15 MERCHANT NAME 12.34" — parse these carefully
- If text looks garbled (doubled letters like "MMeerrcchhaanntt"), try to deduplicate the characters"""

    try:
        text = call_claude(prompt, max_tokens=4096).strip()
        start, end = text.find("["), text.rfind("]") + 1
        if start >= 0 and end > start:
            rows = json.loads(text[start:end])
            result = []
            for r in rows:
                try:
                    result.append({
                        "date":        datetime.strptime(r["date"], "%Y-%m-%d"),
                        "description": str(r["description"]).strip(),
                        "amount":      abs(float(r["amount"])),
                        "type":        r["type"],
                    })
                except Exception:
                    continue
            return result
    except Exception as e:
        raise ValueError(f"Claude PDF parsing failed: {e}")

    return []


def parse_csv(content: bytes) -> List[Dict[str, Any]]:
    """Parse bank CSV bytes into normalized transaction dicts."""
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Cannot read CSV: {e}")

    df.columns = [c.strip().lower() for c in df.columns]

    if _has_col(df, ["amount", "transaction amount"]):
        rows = _parse_single_amount(df)
    elif _has_col(df, ["debit", "withdrawal", "debit amount"]) or _has_col(df, ["credit", "deposit", "credit amount"]):
        rows = _parse_debit_credit(df)
    else:
        raise ValueError(f"Unrecognized CSV format. Columns: {list(df.columns)}")

    return [r for r in rows if r is not None]


# ── helpers ───────────────────────────────────────────────────────────────────

def _has_col(df, candidates):
    return any(c in df.columns for c in candidates)


def _find_col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def _parse_date(val: str) -> datetime:
    s = str(val).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    raise ValueError(f"Cannot parse date: {val!r}")


def _clean_amount(val) -> float:
    return float(str(val).replace("$", "").replace(",", "").strip())


def _parse_single_amount(df) -> List[Dict]:
    date_col = _find_col(df, ["date", "transaction date", "posted date", "trans date"])
    desc_col = _find_col(df, ["description", "memo", "payee", "merchant", "details"])
    amt_col  = _find_col(df, ["amount", "transaction amount"])

    if not all([date_col, desc_col, amt_col]):
        raise ValueError(f"Missing columns. Found: {list(df.columns)}")

    result = []
    for _, row in df.iterrows():
        try:
            if pd.isna(row[desc_col]):
                continue
            amount = _clean_amount(row[amt_col])
            result.append({
                "date":        _parse_date(row[date_col]),
                "description": str(row[desc_col]).strip(),
                "amount":      abs(amount),
                "type":        "credit" if amount > 0 else "debit",
            })
        except Exception:
            continue
    return result


def _parse_debit_credit(df) -> List[Dict]:
    date_col   = _find_col(df, ["date", "transaction date", "posted date"])
    desc_col   = _find_col(df, ["description", "memo", "payee", "details"])
    debit_col  = _find_col(df, ["debit", "withdrawal", "debit amount"])
    credit_col = _find_col(df, ["credit", "deposit", "credit amount"])

    if not date_col or not desc_col:
        raise ValueError(f"Missing date/description. Columns: {list(df.columns)}")

    result = []
    for _, row in df.iterrows():
        try:
            if pd.isna(row[desc_col]):
                continue

            debit  = _clean_amount(row[debit_col])  if debit_col  and not pd.isna(row.get(debit_col,  float("nan"))) else 0.0
            credit = _clean_amount(row[credit_col]) if credit_col and not pd.isna(row.get(credit_col, float("nan"))) else 0.0

            if debit > 0:
                result.append({"date": _parse_date(row[date_col]), "description": str(row[desc_col]).strip(), "amount": debit,  "type": "debit"})
            elif credit > 0:
                result.append({"date": _parse_date(row[date_col]), "description": str(row[desc_col]).strip(), "amount": credit, "type": "credit"})
        except Exception:
            continue
    return result
