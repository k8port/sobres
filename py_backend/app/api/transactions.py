"""
CRUD for transactions.

Usage: python transactions.py

Objective: Provide CRUD for transactions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, cast
import logging

from app.db.session import get_db
from app.db.models import Transaction
from app.db.schemas import TransactionCreate, TransactionUpdate, Transaction as TransactionSchema
from app.api.auth import get_current_user, require_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# to get features of fastapi class structure for API routes
router = APIRouter()

# to get transactions saved to database
@router.get("/api/transactions", response_model=List[TransactionSchema])
def get_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """
    Get all transactions for the current user, ordered by date (most recent first)
    """
    logger.info("Fetching transactions for user %s", current_user.id)
    try:
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == current_user.id)
            .order_by(Transaction.date.desc())
            .all()
        )
        logger.info(f"Retrieved {len(transactions)} transactions")
        return transactions
    except Exception as e:
        logger.exception(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# to get a single transaction from the database using its id
@router.get("/api/transactions/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """
    Get a specific transaction by ID
    """
    logger.info(f"Fetching transaction with ID: {transaction_id}")
    try:
        transaction = (
            db.query(Transaction)
            .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
            .first()
        )
        if transaction is None:
            logger.warning(f"Transaction with ID {transaction_id} not found")
            raise HTTPException(status_code=404, detail="Transaction not found")
        logger.info(f"Retrieved transaction: {transaction.id}")
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching transaction {transaction_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/api/transactions/{statement_id}/{transaction_id}", response_model=TransactionSchema)
def get_transaction_by_composite_id(
    statement_id: str,
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """Get a specific transaction by canonical composite identifier."""
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.statement_id == statement_id,
            Transaction.transaction_id == transaction_id,
            Transaction.user_id == current_user.id,
        )
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
    
class SaveOut(BaseModel):
    count: int

# to create new transactions via bulk save (multiple transactions saved at once) 
@router.post("/api/transactions", response_model=SaveOut)
def create_transactions(
    transactions: List[TransactionCreate],
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """
    Create transactions from bulk upload (requires auth)
    """
    logger.info(f"Creating {len(transactions)} transactions for user {current_user.id}")
    try:
        if not transactions:
            return SaveOut(count=0)

        # Deduplicate by canonical composite key when provided; fallback to legacy tuple.
        existing_composite = (
            db.query(Transaction.statement_id, Transaction.transaction_id)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.statement_id.isnot(None),
                Transaction.transaction_id.isnot(None),
            )
            .all()
        )
        existing_composite_keys = {(row.statement_id, row.transaction_id) for row in existing_composite}

        existing = (
            db.query(Transaction.date, Transaction.description, Transaction.amount)
            .filter(Transaction.user_id == current_user.id)
            .all()
        )
        existing_keys = {(row.date, row.description, row.amount) for row in existing}

        new_txs: list[TransactionCreate] = []
        for tx in transactions:
            if tx.statement_id and tx.transaction_id:
                composite_key = (tx.statement_id, tx.transaction_id)
                if composite_key in existing_composite_keys:
                    continue
                existing_composite_keys.add(composite_key)
                new_txs.append(tx)
                continue

            legacy_key = (tx.date, tx.description, tx.amount)
            if legacy_key in existing_keys:
                continue
            existing_keys.add(legacy_key)
            new_txs.append(tx)

        if not new_txs:
            return SaveOut(count=0)

        db_objects = [
            Transaction(
                statement_id=tx.statement_id,
                transaction_id=tx.transaction_id,
                date=tx.date,
                description=tx.description,
                amount=tx.amount,
                payee=tx.payee,
                category=tx.category,
                subcategory=tx.subcategory,
                notes=tx.notes,
                category_id=tx.category_id,
                upload_id=tx.upload_id,
                envelope_id=tx.envelope_id,
                user_id=current_user.id,
            )
            for tx in new_txs
        ]
        db.add_all(db_objects)
        db.commit()
        logger.info(f"Saved {len(db_objects)} new transactions (skipped {len(transactions) - len(db_objects)} duplicates)")
        return SaveOut(count=len(db_objects))
    except Exception as e:
        db.rollback()
        logger.exception(f"Error saving transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/transactions/{transaction_id}", response_model=TransactionSchema)
def patch_transaction(
    transaction_id: int,
    update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """Assign envelope to a transaction. 409 if transaction is a deposit."""
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if cast(str | None, tx.category) == "deposits":
        raise HTTPException(status_code=409, detail="Cannot assign envelope to a deposit")
    setattr(tx, "envelope_id", update.envelope_id)
    db.commit()
    db.refresh(tx)
    return tx


@router.patch("/api/transactions/{statement_id}/{transaction_id}", response_model=TransactionSchema)
def patch_transaction_by_composite_id(
    statement_id: str,
    transaction_id: str,
    update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """Assign envelope by canonical composite transaction identifier."""
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.statement_id == statement_id,
            Transaction.transaction_id == transaction_id,
            Transaction.user_id == current_user.id,
        )
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if cast(str | None, tx.category) == "deposits":
        raise HTTPException(status_code=409, detail="Cannot assign envelope to a deposit")
    setattr(tx, "envelope_id", update.envelope_id)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/api/transactions/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """Delete a transaction."""
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()


@router.delete("/api/transactions/{statement_id}/{transaction_id}", status_code=204)
def delete_transaction_by_composite_id(
    statement_id: str,
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_user),
):
    """Delete a transaction by canonical composite identifier."""
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.statement_id == statement_id,
            Transaction.transaction_id == transaction_id,
            Transaction.user_id == current_user.id,
        )
        .first()
    )
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()

