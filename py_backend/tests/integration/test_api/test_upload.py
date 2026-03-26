# tests/integration/test_api/test_upload.py

import io


def test_upload_returns_id_and_datetime(client):
    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}

    response = client.post('/api/upload', files=files)
    assert response.status_code in (200, 201)
    data = response.json()
    assert 'id' in data and isinstance(data['id'], str) and data['id']
    assert 'datetime' in data and isinstance(data['datetime'], str) and data['datetime'].endswith('Z')

def test_upload_parse_requires_valid_upload_id(client):
    response = client.post('/api/upload/parse', params={'uploadId': 'does-not-exist'})
    assert response.status_code == 400
    assert response.json()['detail']

def test_upload_parse_with_valid_upload_id_returns_rows(client):
    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}
    uploaded = client.post('/api/upload', files=files)
    uid = uploaded.json()['id']

    response = client.post('/api/upload/parse', params={'uploadId': uid})
    assert response.status_code == 200
    data = response.json()
    assert 'rows' in data and isinstance(data['rows'], list)

def test_missing_file_returns_400(client):
    response = client.post('/api/upload', files={})
    assert response.status_code == 400
    assert 'Missing file' in response.json()['detail']

def test_upload_of_non_pdf_returns_400(client):
    fake = io.BytesIO(b'hello')
    files = {'statement': ('note.txt', fake, 'text/plain')}
    response = client.post('/api/upload', files=files)
    assert response.status_code == 400
    assert 'File must be a PDF' in response.json()['detail']

def test_parse_invalid_upload_id_returns_400(client):
    response = client.post('/api/upload/parse', params={'uploadId': 'bogus'})
    assert response.status_code == 400


def test_upload_extracts_statement_period_at_upload_time(client, db):
    """POST /api/upload should extract and save the statement period from the PDF
    immediately — not deferred to the parse step.
    """
    from unittest.mock import patch
    from datetime import date as dtdate
    from app.db.models import Upload

    mock_text = "KATECPORTALATIN StatementPeriod: Jan082026-Feb072026\nother content"

    with patch('app.api.upload.extract_pdf_content', return_value={'text': mock_text}):
        import io
        pdf = io.BytesIO(b'%PDF-1.4 dummy')
        files = {'file': ("jan_2026.pdf", pdf, "application/pdf")}
        response = client.post('/api/upload', files=files, headers={"X-User-Id": "dev-user-1"})

    assert response.status_code == 201
    uid = response.json()['id']

    upload = db.query(Upload).filter(Upload.id == uid).first()
    assert upload is not None
    assert upload.statement_begin == dtdate(2026, 1, 8), f"Expected 2026-01-08 but got {upload.statement_begin}"
    assert upload.statement_end == dtdate(2026, 2, 7), f"Expected 2026-02-07 but got {upload.statement_end}"


def test_parse_saves_statement_range_from_statement_period(client, db):
    """After parsing, the Upload record should have statement_begin and statement_end set
    based on the StatementPeriod extracted from the PDF text header — not from transactions.
    """
    from unittest.mock import patch
    from datetime import date as dtdate
    from app.db.models import Upload

    import io
    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("jan_2026.pdf", pdf, "application/pdf")}
    uploaded = client.post('/api/upload', files=files, headers={"X-User-Id": "dev-user-1"})
    assert uploaded.status_code == 201
    uid = uploaded.json()['id']

    # Mock PDF extraction to return text with StatementPeriod header
    mock_text = "KATECPORTALATIN StatementPeriod: Jan082026-Feb072026\nother content"

    with patch('app.api.upload.extract_pdf_content', return_value={'text': mock_text}), \
         patch('app.api.upload.get_statement_rows', return_value=[]), \
         patch('app.api.upload.get_transactions', return_value=[]):
        response = client.post('/api/upload/parse', params={'uploadId': uid})

    assert response.status_code == 200


# --- Phase 1D: draft vs saved persistence ---

def test_upload_without_auth_does_not_create_db_row(client, db):
    """POST /api/upload without auth header does NOT create Upload row in DB."""
    from app.db.models import Upload

    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}
    response = client.post('/api/upload', files=files)
    assert response.status_code == 201

    uid = response.json()['id']
    row = db.query(Upload).filter(Upload.id == uid).first()
    assert row is None, "Anonymous upload should NOT persist an Upload row"


def test_upload_with_auth_creates_db_row(client, db):
    """POST /api/upload with X-User-Id header DOES create Upload row in DB."""
    from app.db.models import Upload

    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}
    response = client.post('/api/upload', files=files, headers={"X-User-Id": "dev-user-1"})
    assert response.status_code == 201

    uid = response.json()['id']
    row = db.query(Upload).filter(Upload.id == uid).first()
    assert row is not None, "Authenticated upload MUST persist an Upload row"