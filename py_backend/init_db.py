# py_backend/init_db.py

import os
from app.db.session import Base, engine
from app.db.models import Transaction, Category, Bill, Envelope, CategoryEnum

def init_db():
    Base.metadata.drop_all(bind=engine)

    # Create all tables
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    db_path = "budget.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    init_db()