# py_backend/app/api/upload.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import tempfile
import os
import logging

from app.core.transaction_parser import get_statement_rows, get_transactions
from app.core.statement_extractor import extract_pdf_content
from app.db.session import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Temp in-memory store for upload IDs
_UPLOAD_STORE: Dict[str, Dict[str, Any]] = {}

class UploadOut(BaseModel):
    id: str
    datetime: str

class ParseOut(BaseModel):
    rows: List[Dict[str, Any]]
    text: str

@router.post("/api/upload", response_model=UploadOut, status_code=201)
async def upload_statement(
    statement: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
) -> UploadOut:
    """
    Store uploaded PDF (as bytes) and return id + timestamp.
    """
    upload = statement or file

    if upload is None:
        raise HTTPException(status_code=400, detail="Missing file")
    if not upload.content_type or "pdf" not in upload.content_type.lower():
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        contents = await upload.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # TODO: store in database
    upload_id = str(uuid.uuid4())
    received_at = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")
    _UPLOAD_STORE[upload_id] = {
        "filename": upload.filename,
        "received_at": received_at,
        "content": contents,
        "raw_text": None,
    }

    return UploadOut(id=upload_id, datetime=received_at)

@router.post("/api/upload/parse", response_model=ParseOut)
def parse_upload(uploadId: str, db: Session = Depends(get_db)) -> ParseOut:
    """Parse previously uploaded PDF by id and return transaction rows."""
    doc = _UPLOAD_STORE.get(uploadId)
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid upload ID")

    #  write to tmp if extractor needs file, otherwise use bytes
    tmp_path = None
    try:
        pdf_bytes = doc["content"]
        extracted = extract_pdf_content(pdf_bytes)
        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

        raw_rows = get_statement_rows(extracted["text"])
        tx_items = get_transactions(raw_rows)

        return ParseOut(rows=tx_items, text=extracted.get("text", ""))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"parsing error: %s", e)
        raise HTTPException(status_code=500, detail=f"Error parsing upload: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)