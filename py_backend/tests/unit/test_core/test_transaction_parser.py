# tests/unit/test_core/test_transaction_parser.py

import pytest
from datetime import date, datetime
from app.core.transaction_parser import get_statement_rows, get_transactions
import logging


def infer_mmdd_year(mmdd: str, today: date) -> date:
    candidate = datetime.strptime(f"{mmdd}/{today.year}", "%m/%d/%Y").date()
    if candidate > today:
        candidate = candidate.replace(year=candidate.year - 1)
    return candidate

@pytest.fixture
def sample_text():
    return "\n".join([
        "ElectronicDeposits",
        "07/01   PAYROLL    $1,000.00",
        "",
        "OtherCredits",
        "07/02   ADJ CREDIT   $50.00",
        "",
        "ElectronicPayments",
        "POSTINGDATE Description Amount",     # header line to skip
        "07/03   GROCERY     ($200.00)",       # payment with parentheses
        "Supermarket, Inc.",                   # payee on next line
        "07/04   RENTDEPOSIT        $800.00",  # deposit disguised as payment
        "",
    ])

def test_get_statement_rows_empty():
    assert get_statement_rows("") == []

def test_get_statement_rows_parses_deposits_and_credits_and_payments(sample_text):
    rows = get_statement_rows(sample_text)
    # We should get 4 rows: payroll(deposit), adj credit, grocery(payment), rent(deposit)
    assert len(rows) == 4

    # Check first row is a deposit
    r1 = rows[0]
    assert r1["Date"] == "07/01"
    assert "PAYROLL" in r1["Description"].upper()
    assert r1["Amount"] == "$1,000.00"
    assert r1["Category"] == "Deposit"

    # Check second row is a credit
    r2 = rows[1]
    assert r2["Date"] == "07/02"
    assert "ADJ CREDIT" in r2["Description"]
    assert r2["Category"] == "Credit"

    # Check grocery payment picked up next‐line payee
    r3 = rows[2]
    assert r3["Date"] == "07/03"
    assert r3["Description"].startswith("GROCERY")
    assert r3["Payee"] == "Supermarket, Inc."
    assert r3["Category"] == "Payment"

    # Check rent “DEPOSIT” in description counts as deposit
    r4 = rows[3]
    assert r4["Date"] == "07/04"
    assert r4["Category"] == "Deposit"
    assert r4["Amount"] == "$800.00"

@pytest.mark.parametrize("raw_rows, expected", [
    # simple, full YYYY date, positive amount
    (
        [{"Date":"07/01/2024","Description":"X","Amount":"$100.00","Payee":"A","Category":"C"}],
        {"date": date(2024,7,1),"description":"X","amount":100.0,"payee":"A","category":"C"}
    ),
    # mm/dd without year -> infer year relative to today
    (
        [{"Date":"12/31","Description":"YearEnd","Amount":"$5.00"}],
        {
            "date": infer_mmdd_year("12/31", datetime.now().date()),
            "description":"YearEnd",
            "amount":5.0,
        }
    ),
    # parentheses → negative
    (
        [{"Date":"01/01/2024","Description":"Refund","Amount":"($20.00)"}],
        {"date": date(2024,1,1),"description":"Refund","amount":-20.0}
    ),
])
def test_get_transactions_converts_type(raw_rows, expected):
    txs = get_transactions(raw_rows)
    assert len(txs) == 1
    tx = txs[0]
    # compare known keys
    assert tx["date"] == expected["date"]
    assert tx["description"] == expected["description"]
    assert tx["amount"] == pytest.approx(expected["amount"])


def test_get_transactions_infers_year_for_mmdd_using_future_rollover_rule():
    today = datetime.now().date()

    past_candidate = today.replace(day=1)
    if past_candidate > today:
        past_candidate = past_candidate.replace(month=max(1, today.month - 1))

    future_month = 12 if today.month < 12 else 1
    future_candidate = datetime.strptime(f"{future_month:02d}/28/{today.year}", "%m/%d/%Y").date()
    if future_candidate <= today:
        future_month = 1 if today.month == 12 else today.month + 1
        future_candidate = datetime.strptime(f"{future_month:02d}/28/{today.year}", "%m/%d/%Y").date()

    raw_rows = [
        {"Date": f"{past_candidate.month:02d}/{past_candidate.day:02d}", "Description": "Past", "Amount": "$1.00"},
        {"Date": f"{future_candidate.month:02d}/{future_candidate.day:02d}", "Description": "Future", "Amount": "$2.00"},
    ]

    txs = get_transactions(raw_rows)
    by_desc = {tx["description"]: tx for tx in txs}

    assert by_desc["Past"]["date"].year == today.year
    assert by_desc["Future"]["date"].year == today.year - 1
