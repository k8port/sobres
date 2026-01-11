# tests/integration/test_api/test_upload.py

import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_returns_id_and_datetime():
    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}

    response = client.post('/api/upload', files=files)
    assert response.status_code in (200, 201)
    data = response.json()
    assert 'id' in data and isinstance(data['id'], str) and data['id']
    assert 'datetime' in data and isinstance(data['datetime'], str) and data['datetime'].endswith('Z')

def test_upload_parse_requires_valid_upload_id():
    response = client.post('/api/upload/parse', params={'uploadId': 'does-not-exist'})
    assert response.status_code == 400
    assert response.json()['detail']

def test_upload_parse_with_valid_upload_id_returns_rows():
    pdf = io.BytesIO(b'%PDF-1.4 dummy')
    files = {'file': ("bank.pdf", pdf, "application/pdf")}
    uploaded = client.post('/api/upload', files=files)
    uid = uploaded.json()['id']

    response = client.post('/api/upload/parse', params={'uploadId': uid})
    assert response.status_code == 200
    data = response.json()
    assert 'rows' in data and isinstance(data['rows'], list)

def test_missing_file_returns_400():
    response = client.post('/api/upload', files={})
    assert response.status_code == 400
    assert 'Missing file' in response.json()['detail']

def test_upload_of_non_pdf_returns_400():
    fake = io.BytesIO(b'hello')
    files = {'statement': ('note.txt', fake, 'text/plain')}
    response = client.post('/api/upload', files=files)
    assert response.status_code == 400
    assert 'File must be a PDF' in response.json()['detail']

def test_parse_invalid_upload_id_returns_400():
    response = client.post('/api/upload/parse', params={'uploadId': 'bogus'})
    assert response.status_code == 400