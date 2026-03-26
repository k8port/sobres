# py_backend/app/api/upload.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import os
import logging

from app.core.transaction_parser import get_statement_rows, get_transactions
from app.core.statement_extractor import extract_pdf_content, extract_statement_period
from app.db.session import get_db
from app.db.models import Upload
from app.api.auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Temp in-memory store for upload content (PDF bytes)
_UPLOAD_STORE: Dict[str, Dict[str, Any]] = {}

class UploadOut(BaseModel):
    id: str
    datetime: str

class ParseOut(BaseModel):
    rows: List[Dict[str, Any]]
    text: str

class StatementRangeOut(BaseModel):
    start: str
    end: str

class UploadRangesOut(BaseModel):
    ranges: List[StatementRangeOut]

@router.post("/api/upload", response_model=UploadOut, status_code=201)
async def upload_statement(
    statement: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> UploadOut:
    """
    Store uploaded PDF (as bytes) and return id + timestamp.
    Persists upload record to database.
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

    upload_id = str(uuid.uuid4())
    received_at = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")

    # Extract statement period from PDF text at upload time
    stmt_begin = None
    stmt_end = None
    extracted = extract_pdf_content(contents)
    if extracted:
        stmt_period = extract_statement_period(extracted.get("text", ""))
        if stmt_period:
            stmt_begin, stmt_end = stmt_period

    # Persist to database only for authenticated users
    if current_user:
        db_upload = Upload(
            id=upload_id,
            filename=upload.filename,
            received_at=received_at,
            statement_begin=stmt_begin,
            statement_end=stmt_end,
            user_id=current_user.id,
        )
        db.add(db_upload)
        db.commit()

    # Keep in-memory store for PDF content (used during parsing)
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

    tmp_path = None
    try:
        pdf_bytes = doc["content"]
        extracted = extract_pdf_content(pdf_bytes)
        if not extracted:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

        raw_rows = get_statement_rows(extracted["text"])
        tx_items = get_transactions(raw_rows)

        # Extract statement period directly from PDF text (decoupled from transactions)
        stmt_period = extract_statement_period(extracted.get("text", ""))
        if stmt_period:
            db_upload = db.query(Upload).filter(Upload.id == uploadId).first()
            if db_upload:
                db_upload.statement_begin = stmt_period[0]
                db_upload.statement_end = stmt_period[1]
                db.commit()

        return ParseOut(rows=tx_items, text=extracted.get("text", ""))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"parsing error: %s", e)
        raise HTTPException(status_code=500, detail=f"Error parsing upload: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/api/uploads/ranges", response_model=UploadRangesOut)
def get_upload_ranges(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> UploadRangesOut:
    """Return statement date ranges for all saved uploads that have ranges set."""
    query = db.query(Upload).filter(
        Upload.statement_begin.isnot(None),
        Upload.statement_end.isnot(None),
    )
    if current_user:
        query = query.filter(Upload.user_id == current_user.id)
    uploads = query.order_by(Upload.statement_begin).all()

    ranges = [
        StatementRangeOut(
            start=u.statement_begin.isoformat(),
            end=u.statement_end.isoformat(),
        )
        for u in uploads
    ]

    return UploadRangesOut(ranges=ranges)