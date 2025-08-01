# py_backend/app/api/upload.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
import tempfile
import os
import logging

from app.core.transaction_parser import get_statement_rows, get_transactions
from app.core.statement_extractor import extract_pdf_content
from app.db.session import get_db
from app.db.models import Transaction

"""
Upload PDF bank statement to database and persist transactions.

Usage: python upload.py --input statement.pdf

Objective: Store transactions in database.
"""

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/api/upload")
async def upload_statement(
    statement: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload a bank statement PDF file and parse it into transactions.
    """
    # logger.info(f"Upload endpoint called with file: {statement.filename}, content_type: {statement.content_type}")

    if not statement.content_type or "pdf" not in statement.content_type.lower():
        logger.error(f"Invalid content type: {statement.content_type}")
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Read the file content
        # logger.info("Reading file content")
        contents = await statement.read()
        # logger.info(f"Read {len(contents)} bytes")
        
        # Save to a temporary file to ensure proper handling
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
            # logger.info(f"Saved to temporary file: {tmp_path}")
        
        try:
            # Extract content using statement_extractor
            # logger.info("Extracting content from PDF")
            with open(tmp_path, "rb") as f:
                pdf_bytes = f.read()
                extracted_data = extract_pdf_content(pdf_bytes)
            
            # Parse the extracted text to get transaction rows
            if not extracted_data or not extracted_data.get("text"):
                logger.error("Could not extract text from PDF")
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
                
            # logger.info(f"Extracted {len(extracted_data['text'])} characters of text")
            raw_rows = get_statement_rows(extracted_data["text"])
            logger.info(f"Found {len(raw_rows)} raw transaction rows")
            logger.info(f"printing raw rows: {raw_rows[10]}")
            
            tx_items = get_transactions(raw_rows)
            logger.info(f"Parsed {len(tx_items)} transaction items")
            logger.info(f"printing tx_items: {tx_items[10]}")

            if not tx_items:
                logger.error("No transactions found in statement")
                raise HTTPException(status_code=400, detail="No transactions found in statement")

            # Return the extracted text and parsed rows directly, without database operations
            return {
                "text": extracted_data.get("text", ""),
                "rows": tx_items,
            }
        finally:
            # Clean up the temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                # logger.info(f"Deleted temporary file: {tmp_path}")
    except Exception as e:
        logger.exception(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")