"""
Define SQLAlchemy models for the database (or Pydantic + Tortoise)

Model Entities: Transaction, Category, Envelope, Bill
"""
from enum import Enum

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .session import Base

class CategoryEnum(Enum):
    FOOD = 1
    HOUSING = 2
    UTILITIES = 3
    TRANSPORTATION = 4
    HEALTHCARE = 5
    INSURANCE = 6
    ENTERTAINMENT = 7

def get_category_id(category_name):
    return CategoryEnum[category_name].value

def get_category_name(category_id):
    return CategoryEnum(category_id).name

class Transaction(Base):
    __tablename__ = "transaction"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, index=True, nullable=False)
    description = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    payee = Column(String, nullable=True)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("category.id"), nullable=True)

class Category(Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    allocation_percentage = Column(Float, default=0.0)
    kind = Column(SQLEnum(CategoryEnum), nullable=False)
    envelope = relationship("Envelope", back_populates="category")


class Bill(Base):
    __tablename__ = "bill"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payee = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    frequency = Column(String, nullable=False)

class Envelope(Base):
    __tablename__ = "envelope"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("category.id"), nullable=False)
    balance = Column(Float, default=0.0)

    category = relationship("Category", back_populates="envelope")