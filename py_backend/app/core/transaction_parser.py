# py_backend/app/core/transaction_parser.py

from typing import List, Dict, Any
from datetime import datetime
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

"""
Extracts transactions as rows from statement text
"""
def get_statement_rows(text: str) -> List[Dict[str, str]]:
    """
    Extracts row data from statement text
    """
    
    # extract rows for deposits, credits, and transactions
    lines = text.splitlines()
    rows = []
    skip_next = False
    in_deposit = False
    in_credit = False
    in_payment = False

    for idx, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
        
        stripped = line.strip()
        if stripped == 'ElectronicDeposits':
            in_deposit, in_credit, in_payment = True, False, False
            continue
        if stripped == 'OtherCredits':
            in_deposit, in_credit, in_payment = False, True, False
            continue
        if stripped.startswith('ElectronicPayments'):
            in_deposit, in_credit, in_payment = False, False, True
            continue
        if in_payment and (stripped.startswith('POSTINGDATE') 
                        or stripped.startswith('ElectronicPayments')
                        or not stripped
                        or stripped.startswith('Call')):
            continue
        if in_deposit or in_credit:
            m = re.match(r'(\d{2}/\d{2})\s+(.+?)\s+([$\d,().-]+)$', stripped)
            if m:
                date, desc, amount = m.groups()
                if in_deposit:
                    rows.append({'Date': date, 'Description': desc, 'Amount': amount, 'Payee': 'self', 'Category': 'Deposit'})
                elif in_credit:
                    payee = 'self'
                    rows.append({'Date': date, 'Description': desc, 'Amount': amount, 'Payee': payee, 'Category': 'Credit'})

            continue
        if in_payment:
            m = re.match(r'(\d{2}/\d{2})\s+(.+?)\s+([$\d,().-]+)$', stripped)
            if m:
                date, desc, amount = m.groups()
                if desc.endswith('DEPOSIT'):
                    rows.append({'Date': date, 'Description': desc, 'Amount': amount, 'Payee': 'self', 'Category': 'Deposit'})
                elif idx + 1 < len(lines):
                    payee = lines[idx + 1].strip()
                    rows.append({'Date': date, 'Description': desc, 'Amount': amount, 'Payee': payee, 'Category': 'Payment'})
                    skip_next = True
            continue
    return rows

def get_transactions(rows_raw: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """ Turn rows_raw (dicts of strings )into structured transactions:
        - `date`: datetime.date
        - `description`: str
        - `amount`: float (debits negative, credits positive)
    """
    transactions = []
    for row in rows_raw:
        # adjust keys to match bank statement format
        date_str = row.get("Date") or row.get("date") or row.get("POSTINGDATE")
        desc = row.get("Description") or row.get("description") or row.get("DESCRIPTION")
        amt_str = row.get("Amount") or row.get("amount") or row.get("AMOUNT")
        payee_str = row.get("Payee") or row.get("payee") or row.get("PAYEE")
        category_str = row.get("Category") or row.get("category") or row.get("CATEGORY") or ''

        transaction = {
            'date': date_str,
            'description': desc,
            'amount': amt_str,
            'payee': payee_str,
            'category': category_str,
        } 
        try:
            # Try different date formats
            try:
                date_mod = datetime.strptime(date_str.strip(), "%m/%d/%Y").date()
                transaction['date'] = date_mod
            except ValueError:
                try:
                    date_mod = datetime.strptime(date_str.strip(), "%m/%d").date().replace(year=datetime.now().year)
                    transaction['date'] = date_mod
                except ValueError:
                    logger.error('Invalid date', date_str)
                    continue
        except Exception as e:
            logger.error('Invalid date', date_str, e)
            continue
            
        transaction['amount'] = amt_str.replace("$", "").replace(",", "").strip()
        if "(" in transaction['amount'] and ")" in transaction['amount']:
            transaction['amount'] = "-" + transaction['amount'].replace("(", "").replace(")", "")
        try:
            transaction['amount'] = float(transaction['amount'])
        except ValueError:
            logger.error('Invalid amount', transaction['amount'])
            continue

        if transaction['category'] == None:
            transaction['category'] = ''
        if transaction['payee'] == None:
            transaction['payee'] = ''
    transactions.append(transaction)
    return transactions
    
def get_transactions(rows_raw: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """ Turn rows_raw (dicts of strings )into structured transactions:
        - `date`: datetime.date
        - `description`: str
        - `amount`: float (debits negative, credits positive)
    """
    transactions = []
    for row in rows_raw:
        # adjust keys to match bank statement format
        date_str = row.get("Date") or row.get("date") or row.get("POSTINGDATE")
        desc = row.get("Description") or row.get("description") or row.get("DESCRIPTION")
        amt_str = row.get("Amount") or row.get("amount") or row.get("AMOUNT")
        payee_str = row.get("Payee") or row.get("payee") or row.get("PAYEE")
        category_str = row.get("Category") or row.get("category") or row.get("CATEGORY") or ''

        transaction = {
            'date': date_str,
            'description': desc,
            'amount': amt_str,
            'payee': payee_str,
            'category': category_str,
        } 
        try:
            # Try different date formats
            try:
                date_mod = datetime.strptime(date_str.strip(), "%m/%d/%Y").date()
                transaction['date'] = date_mod
            except ValueError:
                try:
                    date_mod = datetime.strptime(date_str.strip(), "%m/%d").date().replace(year=datetime.now().year)
                    transaction['date'] = date_mod
                except ValueError:
                    logger.error('Invalid date', date_str)
                    continue
        except Exception as e:
            logger.error('Invalid date', date_str, e)
            continue
            
        transaction['amount'] = amt_str.replace("$", "").replace(",", "").strip()
        if "(" in transaction['amount'] and ")" in transaction['amount']:
            transaction['amount'] = "-" + transaction['amount'].replace("(", "").replace(")", "")
        try:
            transaction['amount'] = float(transaction['amount'])
        except ValueError:
            logger.error('Invalid amount', transaction['amount'])
            continue

        if transaction['category'] == None:
            transaction['category'] = ''
        if transaction['payee'] == None:
            transaction['payee'] = ''
    transactions.append(transaction)
    return transactions