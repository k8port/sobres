"""
CRUD for transactions.

Usage: python transactions.py

Objective: Provide CRUD for transactions.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import schemas, models
from app.db.session import get_db
from app.db.schemas import TransactionCreate, TransactionUpdate

router = APIRouter()

@router.get(
    "/transactions",
    response_model=List[schemas.Transaction],   # <--- Use Pydantic model here
)
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
    return transactions

@router.post(
    "/transactions",
    response_model=schemas.Transaction,
)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get(
    "/transactions/{transaction_id}",
    response_model=schemas.Transaction,
)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    return db_transaction

@router.put(
    "/transactions/{transaction_id}",
    response_model=schemas.Transaction,
)
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    db_transaction.update(transaction.model_dump())
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete(
    "/transactions/{transaction_id}",
    response_model=schemas.Transaction,
)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    db.delete(db_transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}