#!/usr/bin/env python3
"""Backfill statement_begin/end for existing uploads by re-reading PDFs from disk.

Matches Upload records (by filename) to PDF files in the statements directory,
extracts the StatementPeriod header, and updates the database.

Usage:
    source ~/venvs/sobres/bin/activate
    cd py_backend
    PYTHONPATH=. python3 backfill_statement_periods.py
"""
import glob
import os
from app.db.session import SessionLocal
from app.db.models import Upload
from app.core.statement_extractor import extract_pdf_content, extract_statement_period

STATEMENT_DIRS = [
    '../statements/tdbank_2025/',
    '../statements/tdbank_2026/',
]

def main():
    db = SessionLocal()
    
    # Build map of filename -> PDF path
    pdf_map: dict[str, str] = {}
    for d in STATEMENT_DIRS:
        for path in glob.glob(os.path.join(d, '*.pdf')):
            fname = os.path.basename(path)
            pdf_map[fname] = path
    
    print(f'Found {len(pdf_map)} PDFs on disk')
    
    # Find uploads with no statement range
    uploads = db.query(Upload).filter(
        Upload.statement_begin.is_(None),
        Upload.statement_end.is_(None),
    ).all()
    
    print(f'Found {len(uploads)} uploads needing backfill')
    
    updated = 0
    skipped = 0
    for u in uploads:
        pdf_path = pdf_map.get(u.filename)
        if not pdf_path:
            print(f'  SKIP {u.id[:8]}... {u.filename} — no matching PDF on disk')
            skipped += 1
            continue
        
        with open(pdf_path, 'rb') as f:
            content = f.read()
        
        extracted = extract_pdf_content(content)
        if not extracted:
            print(f'  SKIP {u.id[:8]}... {u.filename} — failed to extract text')
            skipped += 1
            continue
        
        period = extract_statement_period(extracted.get('text', ''))
        if not period:
            print(f'  SKIP {u.id[:8]}... {u.filename} — no StatementPeriod in text')
            skipped += 1
            continue
        
        u.statement_begin = period[0]
        u.statement_end = period[1]
        print(f'  OK   {u.id[:8]}... {u.filename} -> {period[0]} to {period[1]}')
        updated += 1
    
    db.commit()
    db.close()
    print(f'\nDone: {updated} updated, {skipped} skipped')

if __name__ == '__main__':
    main()
