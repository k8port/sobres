# py_backend/app/db/session.py
"""
Create a database session.

Usage: python session.py

Objective: Provide database session / migration stub.
"""
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite URL - creates budget.db file in current directory
BASE_DIR = Path(__file__).resolve().parents[2]
DB_PATH = BASE_DIR / "budget.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

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