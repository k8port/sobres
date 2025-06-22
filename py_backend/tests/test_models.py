# py_backend/tests/test_models.py

from datetime import datetime, timedelta
import pytest
from app.db.models import Envelope, Transaction, Bill, Category, CategoryEnum, get_category_name

def test_create_envelope(db):
    # First insert a Category row for FOOD
    cat = Category(
        name=get_category_name(CategoryEnum.FOOD),
        description="Groceries category",
        allocation_percentage=0.15,
        kind=CategoryEnum.FOOD,
    )
    db.add(cat)
    db.commit()
    # now cat.id is set
    env = Envelope(
        category_id=cat.id,
        balance=0.0,
    )
    db.add(env)
    db.commit()

    saved = db.query(Envelope).filter_by(category_id=cat.id).one()
    assert saved.category_id == cat.id

def test_create_transaction(db):
    tx = Transaction(
        date=datetime.now().date(),
        description="Test TX",
        amount=100.0,
        category_id=None,
    )
    db.add(tx)
    db.commit()

    saved = db.query(Transaction).filter_by(description="Test TX").one()
    assert saved.amount == 100.0

def test_create_bill(db):
    due = datetime.now().date() + timedelta(days=15)
    bill = Bill(
        payee="Utility Co",
        amount=75.0,
        due_date=due,
        frequency="monthly",
    )
    db.add(bill)
    db.commit()

    saved = db.query(Bill).filter_by(payee="Utility Co").one()
    assert saved.due_date == due

def test_create_category(db):
    cat = Category(
        name="Travel",
        description="Trips",
        allocation_percentage=0.0,
        kind=CategoryEnum.ENTERTAINMENT,
    )
    db.add(cat)
    db.commit()

    saved = db.query(Category).filter_by(name="Travel").one()
    assert saved.kind == CategoryEnum.ENTERTAINMENT
