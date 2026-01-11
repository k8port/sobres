# tests/integration/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi.testclient import TestClient
from app.main import app
import app.db.session as session_mod     # <— import the module itself
from app.db.session import Base, get_db

@pytest.fixture(scope="session", autouse=True)
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    # 1) Create the schema on *the* connection this engine will use
    Base.metadata.create_all(bind=eng)

    # 2) Patch the globals in your session module
    session_mod.engine = eng
    session_mod.SessionLocal = sessionmaker(bind=eng, future=True)

    return eng

@pytest.fixture(scope="function", autouse=True)
def reset_and_override_db(engine):
    # Reset schema before each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Override get_db so FastAPI endpoints use this engine
    TestingSessionLocal = session_mod.SessionLocal

    def _get_test_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db(engine):
    """
    Give direct access to SQLAlchemy Session bound to test engine
    """
    Session = sessionmaker(bind=engine, future=True)
    s = Session()
    yield s
    s.rollback()
    s.close()