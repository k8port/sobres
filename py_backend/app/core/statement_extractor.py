#!/usr/bin/env python3
"""
Simple PDF bank statement → text and tables extractor.

Usage: python statement_extractor.py --input statement.pdf

Objective: Turn raw parse into formatted rows of text.
"""

import pdfplumber
import pandas as pd
import numpy as np


def extract_pdf_content(pdf_path: str) -> pd.DataFrame:
    all_tables = []
    all_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            # get raw text
            text = page.extract_text()
            if text:
                all_text.append(text)
            
            # extract all tables on this page
            for table in page.extract_tables():
                if not table:
                    continue

                # first row as header, rest as data
                header, *rows = table
                df = pd.DataFrame(rows, columns=header)
                all_tables.append(df)

    combined_text = "\n\n".join(all_text)

    result_df = pd.concat(all_tables, ignore_index=True)
    result_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    result_df.fillna("", inplace=True)

    return {
        "text": combined_text,
        "tables": result_df,
    }