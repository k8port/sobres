# py_backend/app/db/session.py
"""
Create a database session.

Usage: python session.py

Objective: Provide database session / migration stub.
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite URL - creates budget.db file in current directory
BASE_DIR = Path(__file__).resolve().parents[2]

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR}/budget.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

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