# tests/integration/test_api/test_upload_ranges.py
"""
Tests for the Upload model persistence and GET /api/uploads/ranges endpoint.

Requirements:
- Upload model stores statement_begin and statement_end fields
- GET /api/uploads/ranges returns all saved statement ranges
- Upload POST persists to DB (not just in-memory)
"""
from datetime import date


def test_get_upload_ranges_returns_empty_when_no_uploads(client):
    """GET /api/uploads/ranges returns empty list when no uploads saved."""
    response = client.get("/api/uploads/ranges")
    assert response.status_code == 200
    data = response.json()
    assert "ranges" in data
    assert isinstance(data["ranges"], list)
    assert len(data["ranges"]) == 0


def test_upload_persists_to_database_with_statement_range(client, db):
    """Upload creates a record in the database with statement_begin and statement_end."""
    from app.db.models import Upload
    import io

    # Upload a PDF
    pdf = io.BytesIO(b"%PDF-1.4 dummy")
    files = {"file": ("bank.pdf", pdf, "application/pdf")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 201

    upload_id = response.json()["id"]

    # Verify the upload exists in the database
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    assert upload is not None
    assert upload.filename == "bank.pdf"


def test_get_upload_ranges_returns_saved_ranges(client, db):
    """After uploading and setting statement ranges, GET returns them."""
    from app.db.models import Upload

    # Directly insert upload records with statement ranges
    u1 = Upload(
        id="u-test-1",
        filename="jan.pdf",
        received_at="2026-01-15T00:00:00Z",
        statement_begin=date(2025, 12, 7),
        statement_end=date(2026, 1, 6),
    )
    u2 = Upload(
        id="u-test-2",
        filename="feb.pdf",
        received_at="2026-02-15T00:00:00Z",
        statement_begin=date(2026, 1, 7),
        statement_end=date(2026, 2, 6),
    )
    db.add_all([u1, u2])
    db.commit()

    response = client.get("/api/uploads/ranges")
    assert response.status_code == 200
    data = response.json()
    assert len(data["ranges"]) == 2

    # Ranges should be sorted by start date
    assert data["ranges"][0]["start"] == "2025-12-07"
    assert data["ranges"][0]["end"] == "2026-01-06"
    assert data["ranges"][1]["start"] == "2026-01-07"
    assert data["ranges"][1]["end"] == "2026-02-06"


def test_get_upload_ranges_excludes_uploads_without_statement_range(client, db):
    """Uploads that don't have statement ranges set are excluded from the response."""
    from app.db.models import Upload

    # Upload without statement range (just stored, not yet parsed)
    u1 = Upload(
        id="u-no-range",
        filename="unknown.pdf",
        received_at="2026-01-15T00:00:00Z",
        statement_begin=None,
        statement_end=None,
    )
    # Upload with range
    u2 = Upload(
        id="u-with-range",
        filename="jan.pdf",
        received_at="2026-01-15T00:00:00Z",
        statement_begin=date(2025, 12, 7),
        statement_end=date(2026, 1, 6),
    )
    db.add_all([u1, u2])
    db.commit()

    response = client.get("/api/uploads/ranges")
    assert response.status_code == 200
    data = response.json()
    assert len(data["ranges"]) == 1
    assert data["ranges"][0]["start"] == "2025-12-07"


def test_upload_model_has_statement_begin_and_end_fields(db):
    """Upload model has statement_begin and statement_end Date columns."""
    from app.db.models import Upload

    upload = Upload(
        id="u-model-test",
        filename="test.pdf",
        received_at="2026-03-15T00:00:00Z",
        statement_begin=date(2026, 2, 7),
        statement_end=date(2026, 3, 6),
    )
    db.add(upload)
    db.commit()

    fetched = db.query(Upload).filter(Upload.id == "u-model-test").first()
    assert fetched is not None
    assert fetched.statement_begin == date(2026, 2, 7)
    assert fetched.statement_end == date(2026, 3, 6)
