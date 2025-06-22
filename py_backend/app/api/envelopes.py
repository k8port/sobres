"""
CRUD for envelopes.

Usage: python envelopes.py

Objective: Provide CRUD for envelopes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session


# @app.get("/envelopes")
# async def get_envelopes() -> dict:
#     return {"categories": [
#         {"id": 1, "name": "Groceries", "percentage": 20, "balance": 100},
#         {"id": 2, "name": "Entertainment", "percentage": 10, "balance": 50},
#         {"id": 3, "name": "Utilities", "percentage": 15, "balance": 75},
#     ]}