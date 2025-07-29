"""
CRUD for transactions.

Usage: python transactions.py

Objective: Provide CRUD for transactions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.db.session import get_db
from app.db.models import Transaction
from app.db.schemas import TransactionCreate, Transaction as TransactionSchema

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# to get features of fastapi class structure for API routes
router = APIRouter()

# to get transactions saved to database
@router.get("/api/transactions", response_model=List[TransactionSchema])
def get_transactions(db: Session = Depends(get_db)):
    """
    Get all transactions, ordered by date (most recent first)
    """
    logger.info("Fetching all transactions")
    try:
        transactions = db.query(Transaction).order_by(Transaction.date.desc()).all()
        logger.info(f"Retrieved {len(transactions)} transactions")
        return transactions
    except Exception as e:
        logger.exception(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# to get a single transaction from the database using its id
@router.get("/api/transactions/{transaction_id}", response_model=TransactionSchema)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Get a specific transaction by ID
    """
    logger.info(f"Fetching transaction with ID: {transaction_id}")
    try:
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
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

# to create new transactions via bulk save (multiple transactions saved at once) 
@router.post("/api/transactions", response_model=List[TransactionSchema])
def create_transactions(
    transactions: List[TransactionCreate],
    db: Session = Depends(get_db)
):
    """
    Create transactions from bulk upload
    """
    logger.info(f"Creating {len(transactions)} transactions")
    try:
        db_objects = [
            Transaction(
                date=tx.date,
                description=tx.description,
                amount=tx.amount,
                payee=tx.payee,
                category=tx.category,
                subcategory=tx.subcategory,
                notes=tx.notes,
                category_id=tx.category_id,
            )
            for tx in transactions
        ]
        db.add_all(db_objects)
        db.commit()
        logger.info("Transactions saved successfully")
        return db_objects
    except Exception as e:
        logger.exception(f"Error saving transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))