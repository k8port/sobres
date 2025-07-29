#!/usr/bin/env python3
"""
Simple PDF bank statement → text and tables extractor.

Usage: python statement_extractor.py --input statement.pdf

Objective: Turn raw parse into formatted rows of text.
"""

import io
import pdfplumber
import pandas as pd
import numpy as np
import logging
from typing import Dict, Any 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_pdf_content(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Extract text and tables from a PDF file.
    
    Args:
        pdf_bytes: The raw bytes of the PDF file
        
    Returns:
        A dictionary with 'text' and 'tables' keys
    """
    # logger.info(f"Starting PDF extraction, received {len(pdf_bytes)} bytes")
    all_tables = []
    all_text = []

    try:
        # logger.info("Opening PDF with pdfplumber")
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            # logger.info(f"PDF opened successfully, contains {len(pdf.pages)} pages")
            
            for i, page in enumerate(pdf.pages, start=1):
                # logger.info(f"Processing page {i}/{len(pdf.pages)}")
                
                # Extract text
                text = page.extract_text()
                if text:
                    # logger.info(f"Extracted {len(text)} characters of text from page {i}")
                    all_text.append(text)
                else:
                    logger.warning(f"No text extracted from page {i}")
                
                # Extract tables
                tables = page.extract_tables()
                # logger.info(f"Found {len(tables)} tables on page {i}")
                
                for table_idx, table in enumerate(tables):
                    # First row as header, rest as data
                    if len(table) < 2:
                        logger.warning(f"Table on page {i}, table #{table_idx+1} has insufficient rows (needs header + data)")
                        continue
                        
                    header, *rows = table
                    if not header:
                        logger.warning(f"Table on page {i}, table #{table_idx+1} has no header")
                        continue
                        
                    # Make sure all rows have the same number of columns as the header
                    
                    # Fix rows that don't match header length
                    fixed_rows = []
                    for row_idx, row in enumerate(rows):
                        if len(row) < len(header):
                            logger.warning(f"Row {row_idx} has {len(row)} columns, padding to match header ({len(header)} columns)")
                            fixed_rows.append(row + [''] * (len(header) - len(row)))
                        else:
                            fixed_rows.append(row)
                    
                    try:
                        df = pd.DataFrame(fixed_rows, columns=header)
                        all_tables.append(df)
                        # logger.info(f"Successfully converted table to DataFrame: {df.shape}")
                    except Exception as e:
                        logger.error(f"Error creating DataFrame from table: {e}")

        combined_text = "\n\n".join(all_text)
        # logger.info(f"Combined text length: {len(combined_text)} characters")

        if all_tables:
            try:
                result_df = pd.concat(all_tables, ignore_index=True)
                result_df.replace([np.inf, -np.inf], np.nan, inplace=True)
                result_df.fillna("", inplace=True)
                # logger.info(f"Combined tables into DataFrame with shape: {result_df.shape}")
            except Exception as e:
                logger.error(f"Error combining tables: {e}")
                result_df = pd.DataFrame()
        else:
            logger.warning("No valid tables found in PDF")
            result_df = pd.DataFrame()

        return {
            "text": combined_text,
            "tables": result_df,
        }
    except Exception as e:
        logger.exception(f"Error extracting PDF content: {e}")
        return {
            "text": "",
            "tables": pd.DataFrame(),
        } 