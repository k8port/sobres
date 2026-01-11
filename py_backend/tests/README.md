# Python Test-Driven Development Implementation

## TDD Best Practices

Remember the following to adhere to TDD best practices in test implementations

- write small, isolated tests for single-responsibility components (unit)
- mock external calls (e.g., PDF parsing, uploads)
- use `tmp_path` for any file I/O
- Red -> Green -> Refactor for each feature and/or bug
- keep tests small, running under 1 sec

## Testing Dependencies

Configure and install testing dependencies for backend Python with fastapi

### PyPl Packages

Install the following package dependencies from PyPl:

```plain
# requirements-dev.txt
pytest>=7.0
pytest-cov>=4.0
httpx
```

### `pytest.ini`

Add `pytest.ini` to root of backend directory:

```plain
[pytest]
# point pytest at your application package
python_paths = app
testpaths = tests
addopts = 
    --maxfail=1 
    --disable-warnings 
    --cov=app 
    --cov-report=term-missing
```

## Test Directory Configuration

Separation of unit and integration tests as follows:

```plain
├── app/……                # your FastAPI code
├── tests/
│   ├── unit/            # pure‑unit tests (no DB, no HTTP)
│   │   └── test_core/
│   │       └── test_parser.py
│   ├── integration/     # multi‑component tests (DB, HTTP, file I/O)
│   │   └── test_api/
│   │       └── test_transactions.py
│   └── conftest.py      # shared fixtures
└── requirements-dev.txt
```

Mirror structure of `/app` directory in `/tests` like so:

```plain
tests/
├── api/
│   ├── test_bills.py
│   ├── test_categories.py
│   └── test_transactions.py
├── core/
│   ├── test_pdf_extractor.py
│   └── test_transaction_parser.py
├── db/
│   └── test_models.py
└── conftest.py
```

## Red -> Green -> Refactor

Follow the **Red -> Green -> Refactor** flow for each piece of functionality, loosely following this example:

### Red

Write tests for requirements or desired functionality.

```python
# tests/core/test_statement_extractor.py
import pytest
from app.core.statement_extractor import extract_lines

def test_extract_lines_from_simple_text(tmp_path):
    # Arrange: write a tiny “PDF” as plain text
    pdf = tmp_path / "dummy.pdf"
    pdf.write_bytes(b"Line one\nLine two\n")
    
   plain # Act
    lines = extract_lines(str(pdf))
    
   plain # Assert — you haven’t written extract_lines yet, so pytest will error!
    assert isinstance(lines, list)
    assert lines == ["Line one", "Line two"]
```

Run: `pytest tests/core/test_statement_extractor.py`
Tests fail because `extract_lines` is not yet implemented.

### Green

Implement `app/core/statement_extractor.py`:

```python
def extract_lines(path: str) -> list[str]:
    with open(path, "rb") as f:
        text = f.read().decode(errors="ignore")
    return [line for line in text.splitlines() if line.strip()]
```

Only implement minimum required for tests to pass.
Run `pytest tests/core/test_statement_extractor.py` again. This time, tests pass.

### Refactor

Look for code smells, comments, linting errors, etc. in implementation.
Refactor to eliminate. Push code and deploy.

## Testing FastAPI and SQLite DB

Use `pytest fixtures` to mock FastAPI routes and SQLite tables:

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi.testclient import TestClient
from app.main import app
import app.db.session as session_mod
from app.db.session import Base, get_db

@pytest.fixture(scope="session", autouse=True)
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(bind=eng)
    session_mod.engine = eng
    session_mod.SessionLocal = sessionmaker(bind=eng, future=True)
    return eng

@pytest.fixture(scope="function", autouse=True)
def reset_and_override_db(engine):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
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

# And now define a plain `db` fixture for direct use in model tests:
@pytest.fixture
def db(engine):
    """Give direct access to a SQLAlchemy Session bound to the test engine."""
    Session = sessionmaker(bind=engine, future=True)
    s = Session()
    yield s
    s.rollback()
    s.close()
```

Put `conftest.py` at `/tests` root level for accessibility to fixtures from any test in suite.

## Integration Tests

To test interaction between two or more python components, like an API call that brings back data, you can use `pytest TestClient` to mock client in client/server Request/Response testing.

`TestClient` is not mocking the client; instead it uses a built-in feature from *FastAPI* (`TestClient`) because it is lightweight, and acts as an in-process HTTP client. This allows testing of routers by using them exactly as a real HTTP client does, but without spinning up a real server.

Here’s why and how this pattern works for *integration* tests:

**TestClient runs ASGI (Asynchronous Server Gateway Instance) app in-process**
The code below retrieves a `client` object containing `get()` and `post()` methods to send HTTP requests directly to `app` without using a network or separate process:

```python
    from fastapi.testclient import TestClient
    client = TestClient(app)
```

**Overrides dependencies so that endpoints hit test DB**
`TestClient` mocks transport layer and nothing else -- routers, dependency injection, SQLAlchemy sessions run for real against an in-memory SQLite engine (previously configured in `conftest.py` via `get_db` override).

*Why not call the router functions directly?*
Calling router as a normal Python function and passing fake `Request` or `Depends` objects would work, but it would also make the tests dependent on the implementation. By using `TestClient`, tight coupling is avoided and the router is tested exactly as an external client would use it, covering the following:

- Body parsing (JSON → Pydantic model)
- Dependency injection (`Depends(get_db)`)
- Error handling, status codes, response serialization
- Route matching (URL + method + path parameters)

## Automated Testing with Coverage and CI/CD

Ensure local coverage by calling `pytest --cov=src --cov-report=term-missing`.

Implement Continuous Integration with GitHub Actions:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.x"
      - run: pip install -r requirements-dev.txt
      - run: pytest --cov=src --cov-fail-under=90
```

Pushes to repository will result in failed builds when coverage is below 90%.

## Unit Tests Vs. Integration Tests: Fast, Isolated, Pure Logic vs. Realistic Implementations

Unit test scope includes functions and classes in `/app/core`, `/app/db/models.py`, and pure Python utilities. They never use networks, databases or file I/O, and depend only on in-memory input. They run very fast.

Integration test scope is multi-layered -- for example, FastAPI routes, SQLite engine, ORM models and PDF extraction are all examples of multi-layered implementations. They usually run a bit slower than unit tests, will hit actual endpoints and databases, and are designed to catch problems not seen in unit tests, like incorrect router wiring and SQL schema mismatches.

## Running Tests

To run all tests, including unit and integration: `pytest`

To run unit tests only: `pytest tests/unit`

To run integration tests only: `pytest -m tests/integration`

To run all tests with coverage reporting that fails under 90%:
`pytest --cov=app --cov-fail-under=90`

For test discovery run `pytest -q tests/integration/test_api/test_upload.py --collect-only`
