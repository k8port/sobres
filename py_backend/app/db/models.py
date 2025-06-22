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
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    description = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    allocation_percentage = Column(Float, default=0.0)
    kind = Column(SQLEnum(CategoryEnum), nullable=False)
    envelopes = relationship("Envelope", back_populates="category")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    payee = Column(String, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    frequency = Column(String, nullable=False)

class Envelope(Base):
    __tablename__ = "envelopes"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    balance = Column(Float, default=0.0)

    category = relationship("Category", back_populates="envelopes")