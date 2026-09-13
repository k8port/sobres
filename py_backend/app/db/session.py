# py_backend/app/db/session.py
"""
Create a database session.

Usage: python session.py

Objective: Provide database session / migration stub.
"""
import os
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
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


def ensure_legacy_schema_compatibility() -> None:
    """Add missing transaction columns for pre-migration SQLite databases.

    This keeps existing local/dev data usable when model fields are added
    and avoids hard failures like "no such column" on startup.
    """
    inspector = inspect(engine)
    if "transaction" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("transaction")}
    stmts: list[str] = []

    if "statement_id" not in columns:
        stmts.append('ALTER TABLE "transaction" ADD COLUMN statement_id VARCHAR')
    if "transaction_id" not in columns:
        stmts.append('ALTER TABLE "transaction" ADD COLUMN transaction_id VARCHAR')

    if not stmts:
        return

    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))

        # Keep lookups fast for new composite-key paths.
        conn.execute(
            text('CREATE INDEX IF NOT EXISTS ix_transaction_statement_id ON "transaction" (statement_id)')
        )
        conn.execute(
            text('CREATE INDEX IF NOT EXISTS ix_transaction_transaction_id ON "transaction" (transaction_id)')
        )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()