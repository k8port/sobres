# py_backend/tests/conftest.py

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
import app.db.models  # registers all models

@pytest.fixture(scope="session")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        future=True,  # recommended for SQLAlchemy 2.x
    )
    Base.metadata.create_all(bind=eng)
    return eng

@pytest.fixture
def db(engine):
    Session = sessionmaker(bind=engine, future=True)
    session = Session()
    yield session
    session.rollback()
    session.close()
