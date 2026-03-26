import pytest
from app.main import app as fastapi_app
from app.db.session import SessionLocal
from app.db.models import Transaction

AUTH = {"X-User-Id": "dev-user-1"}

# tests/integration/test_api/test_transactions.py
def test_list_routes(client):
    print("\n--- registered routes ---")
    for route in fastapi_app.routes:
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

    response = client.post("/api/transactions", json=payload, headers=AUTH)
    assert response.status_code == 200
    assert response.json() == {'count': 2}
    
    response = client.get("/api/transactions", headers=AUTH)
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[1]["date"] == "2024-01-01"
    assert data[0]["date"] == "2024-01-02"

    assert data[1]["amount"] == 100.0
    assert data[0]["amount"] == -50.0

def test_save_transactions_empty_returns_zero(client):
    response = client.post("/api/transactions", json=[], headers=AUTH)
    assert response.status_code == 200
    assert response.json() == {'count': 0}

def test_save_transactions_bad_payload_returns_422(client):
    response = client.post("/api/transactions", json={"not": "a list"}, headers=AUTH)
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
    resp1 = client.post("/api/transactions", json=payload, headers=AUTH)
    assert resp1.status_code == 200
    assert resp1.json()["count"] == 2

    # Second save — exact same payload — should skip duplicates
    resp2 = client.post("/api/transactions", json=payload, headers=AUTH)
    assert resp2.status_code == 200
    assert resp2.json()["count"] == 0

    # DB should still only have 2 rows
    all_resp = client.get("/api/transactions", headers=AUTH)
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
    client.post("/api/transactions", json=original, headers=AUTH)

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

    resp = client.post("/api/transactions", json=mixed, headers=AUTH)
    assert resp.status_code == 200
    assert resp.json()["count"] == 1

    all_resp = client.get("/api/transactions", headers=AUTH)
    assert len(all_resp.json()) == 2


# --- Phase 1D: draft vs saved persistence ---

def test_create_transactions_without_auth_returns_401(client):
    """POST /api/transactions without auth returns 401."""
    payload = [
        {
            "date": "2024-06-01",
            "description": "Unauthenticated Coffee",
            "amount": -5.00,
        },
    ]
    response = client.post("/api/transactions", json=payload)
    assert response.status_code == 401


def test_create_transactions_with_auth_saves_rows(client, db):
    """POST /api/transactions with X-User-Id saves rows scoped to that user."""
    from app.db.models import Transaction as TxModel

    payload = [
        {
            "date": "2024-06-01",
            "description": "Auth Coffee",
            "amount": -5.00,
            "payee": "Starbucks",
        },
    ]
    headers = {"X-User-Id": "dev-user-1"}
    response = client.post("/api/transactions", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["count"] == 1

    row = db.query(TxModel).filter(TxModel.description == "Auth Coffee").first()
    assert row is not None
    assert row.user_id == "dev-user-1"


def test_get_transactions_returns_only_current_user_rows(client, db):
    """GET /api/transactions returns only rows for current user."""
    from app.db.models import Transaction as TxModel, User
    from datetime import date as dtdate

    # Seed two users with transactions directly
    u1 = User(id="user-a", name="User A")
    u2 = User(id="user-b", name="User B")
    db.add_all([u1, u2])
    db.commit()

    db.add(TxModel(date=dtdate(2024, 1, 1), description="User A tx", amount=-10.0, user_id="user-a"))
    db.add(TxModel(date=dtdate(2024, 1, 2), description="User B tx", amount=-20.0, user_id="user-b"))
    db.commit()

    resp_a = client.get("/api/transactions", headers={"X-User-Id": "user-a"})
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert len(data_a) == 1
    assert data_a[0]["description"] == "User A tx"


def test_patch_transaction_sets_envelope_id(client, db):
    """PATCH /api/transactions/:id sets envelopeId; 409 for deposit rows."""
    from app.db.models import Transaction as TxModel, User
    from datetime import date as dtdate

    u = User(id="patch-user", name="Patch User")
    db.add(u)
    db.commit()

    payment = TxModel(date=dtdate(2024, 1, 1), description="Payment", amount=-50.0, category="payments", user_id="patch-user")
    deposit = TxModel(date=dtdate(2024, 1, 2), description="Deposit", amount=500.0, category="deposits", user_id="patch-user")
    db.add_all([payment, deposit])
    db.commit()
    db.refresh(payment)
    db.refresh(deposit)

    headers = {"X-User-Id": "patch-user"}

    # Assign envelope to payment — should succeed
    resp = client.patch(f"/api/transactions/{payment.id}", json={"envelope_id": "env-1"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["envelope_id"] == "env-1"

    # Assign envelope to deposit — should 409
    resp_dep = client.patch(f"/api/transactions/{deposit.id}", json={"envelope_id": "env-1"}, headers=headers)
    assert resp_dep.status_code == 409


def test_delete_transaction_returns_204(client, db):
    """DELETE /api/transactions/:id returns 204 and removes row."""
    from app.db.models import Transaction as TxModel, User
    from datetime import date as dtdate

    u = User(id="del-user", name="Del User")
    db.add(u)
    db.commit()

    tx = TxModel(date=dtdate(2024, 1, 1), description="To Delete", amount=-10.0, user_id="del-user")
    db.add(tx)
    db.commit()
    db.refresh(tx)
    tx_id = tx.id

    headers = {"X-User-Id": "del-user"}
    resp = client.delete(f"/api/transactions/{tx_id}", headers=headers)
    assert resp.status_code == 204

    # Verify row is gone
    row = db.query(TxModel).filter(TxModel.id == tx_id).first()
    assert row is None