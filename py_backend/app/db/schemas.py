"""
This file contains the Pydantic models for the database.

Pydantic models are used to validate the data that is sent to the API.

Pydantic models are also used to generate the OpenAPI schema for the API.

Pydantic models are also used to generate the SQLAlchemy models for the database.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class TransactionBase(BaseModel):
    date: date
    description: str
    amount: float
    payee: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    name: str
    percentage: float
    balance: float

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class BillBase(BaseModel):
    payee: str
    amount: float
    due_date: date
    category_id: int

class BillCreate(BillBase):
    pass

class Bill(BillBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class EnvelopeBase(BaseModel):
    name: str
    allocated: float
    spent: float
    remaining: float

class EnvelopeCreate(EnvelopeBase):
    pass

class Envelope(EnvelopeBase):
    id: int

    class Config:
        orm_mode = True
