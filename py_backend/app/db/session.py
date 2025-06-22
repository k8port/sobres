"""
Create a database session.

Usage: python session.py

Objective: Provide database session / migration stub.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite URL - creates budget.db file in current directory
SQLALCHEMY_DATABASE_URL = "sqlite:///./dev.db"

# Create engine for SQL database (flag required for SQLite)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create session (sessionmaker = factory for creating sessions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()