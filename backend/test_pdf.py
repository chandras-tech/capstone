"""
Test PDF parser directly.
Usage: python3 test_pdf.py path/to/statement.pdf
"""
from dotenv import load_dotenv
load_dotenv()

import os, sys
sys.path.insert(0, '.')

print(f"API key prefix : {os.getenv('ANTHROPIC_API_KEY', 'NOT SET')[:15]}...")
print(f"Base URL       : {os.getenv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')}")

if len(sys.argv) < 2:
    print("Usage: python3 test_pdf.py path/to/statement.pdf")
    sys.exit(1)

pdf_path = sys.argv[1]
print(f"\nParsing: {pdf_path}\n")

from services.parser import parse_pdf

with open(pdf_path, "rb") as f:
    content = f.read()

try:
    transactions = parse_pdf(content)
    print(f"\n✓ Parsed {len(transactions)} transactions\n")
    for t in transactions[:10]:
        print(f"  {t['date'].date()}  {t['type']:6}  ${t['amount']:>8.2f}  {t['description'][:50]}")
    if len(transactions) > 10:
        print(f"  ... and {len(transactions) - 10} more")
except Exception as e:
    import traceback
    print(f"\n✗ Error: {e}")
    traceback.print_exc()
