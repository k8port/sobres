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


def test_save_duplicate_transactions_skips_existing(client):
    """Posting the same transactions twice should not create duplicates.
    Second POST returns count of only newly inserted rows."""
    payload = [
        {
            "date": "2024-03-01",
            "description": "Duplicate Coffee",
            "amount": -4.50,
            "payee": "Starbucks",
        },
        {
            "date": "2024-03-02",
            "description": "Duplicate Grocery",
            "amount": -32.10,
            "payee": "Trader Joes",
        },
    ]

    # First save — both are new
    resp1 = client.post("/api/transactions", json=payload)
    assert resp1.status_code == 200
    assert resp1.json()["count"] == 2

    # Second save — exact same payload — should skip duplicates
    resp2 = client.post("/api/transactions", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["count"] == 0

    # DB should still only have 2 rows
    all_resp = client.get("/api/transactions")
    assert len(all_resp.json()) == 2


def test_save_mixed_new_and_duplicate_transactions(client):
    """When payload has some new and some existing transactions,
    only new ones are saved. Count reflects only new insertions."""
    original = [
        {
            "date": "2024-04-01",
            "description": "Electric Bill",
            "amount": -120.00,
            "payee": "ConEd",
        },
    ]
    client.post("/api/transactions", json=original)

    mixed = [
        # duplicate of above
        {
            "date": "2024-04-01",
            "description": "Electric Bill",
            "amount": -120.00,
            "payee": "ConEd",
        },
        # new
        {
            "date": "2024-04-05",
            "description": "Gas Station",
            "amount": -52.18,
            "payee": "Shell",
        },
    ]

    resp = client.post("/api/transactions", json=mixed)
    assert resp.status_code == 200
    assert resp.json()["count"] == 1

    all_resp = client.get("/api/transactions")
    assert len(all_resp.json()) == 2