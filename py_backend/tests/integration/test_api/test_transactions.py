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
            "date": "2025-01-01",
            "description": "Test Transaction 1",
            "amount": 100.0,
            "payee": "Alice",
            "category": "TEST",
            "subcategory": "SUB",
            "notes": "Test notes",
            "category_id": 1,
        },
        {
            "date": "2025-01-02",
            "description": "Test Transaction 2",
            "amount": -50.0,
            "payee": "",
            "category": "",
            "subcategory": "",
            "notes": "Test notes",
            "category_id": None,
        },
    ]

    # call endpoint POST /api/transactions
    response = client.post("/api/transactions", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(payload)

    # verify each item contains auto-generated id
    for idx, tx in enumerate(data):
        assert "id" in tx
        assert tx["description"] == payload[idx]["description"]
        assert tx["amount"] == payload[idx]["amount"]

    # verify items are in database
    from app.db.session import SessionLocal
    db = SessionLocal()
    db_items = db.query(Transaction).order_by(Transaction.id).all()
    db.close()

    assert len(db_items) == 2
