#!/usr/bin/env python3
"""Quick diagnostic: test extract_statement_period against real PDFs."""
import glob
import re
from app.core.statement_extractor import extract_pdf_content, extract_statement_period

pdfs = glob.glob('../statements/tdbank_2026/*.pdf') + glob.glob('../statements/tdbank_2025/*.pdf')
print(f'Found {len(pdfs)} PDFs')

for pdf_path in pdfs[:3]:
    print(f'\n=== {pdf_path} ===')
    with open(pdf_path, 'rb') as f:
        content = f.read()
    result = extract_pdf_content(content)
    if not result:
        print('  extract_pdf_content returned None')
        continue
    text = result.get('text', '')
    # Search for anything resembling "Statement Period"
    for pattern in [r'StatementPeriod', r'Statement\s*Period', r'STATEMENT\s*PERIOD', r'statement.*period']:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            ctx = text[max(0, m.start()-10):m.end()+80]
            print(f'  Pattern "{pattern}" found: ...{ctx}...')
            break
    else:
        # Show first 300 chars to find what format the header is in
        print(f'  No "Statement Period" found. First 300 chars:')
        print(f'  {text[:300]}')
    
    period = extract_statement_period(text)
    print(f'  extract_statement_period result: {period}')
