import pytest
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Transaction


# tests/integration/test_api/test_transactions.py
def test_list_routes(client):
    print("\n--- registered routes ---")
    for route in app.routes:
        print(f"{route.name:30} {route.path:30} {route.methods}")
    print("--- end routes ---\n")
    assert True


def test_transactions_lifecycle(client):
    # prepare test transactions
    payload = [
        {
            "date": "2024-01-01",
            "description": "Test Transaction 1",
            "amount": 100.0,
            "payee": "Alice",
            "category": "TEST",
            "subcategory": "SUB",
            "notes": "Test notes",
            "category_id": 1,
        },
        {
            "date": "2024-01-02",
            "description": "Test Transaction 2",
            "amount": -50.0,
            "payee": "",
            "category": "",
            "subcategory": "",
            "notes": "Test notes",
            "category_id": None,
        },
    ]

    response = client.post("/api/transactions", json=payload)
    assert response.status_code == 200
    assert response.json() == {'count': 2}
    
    response = client.get("/api/transactions")
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[1]["date"] == "2024-01-01"
    assert data[0]["date"] == "2024-01-02"

    assert data[1]["amount"] == 100.0
    assert data[0]["amount"] == -50.0

def test_save_transactions_empty_returns_zero(client):
    response = client.post("/api/transactions", json=[])
    assert response.status_code == 200
    assert response.json() == {'count': 0}

def test_save_transactions_bad_payload_returns_422(client):
    response = client.post("/api/transactions", json={"not": "a list"})
    assert response.status_code in (422, 400)