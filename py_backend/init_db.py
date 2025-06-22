# py_backend/init_db.py

from sqlalchemy import inspect
from app.db.session import Base, engine
# Import your models so they get registered on Base.metadata
import app.db.models  

def main():
    # Create or Update SQLite file (dev.db) and tables defined in models
    Base.metadata.create_all(bind=engine)

    # Inspect db to list actual tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print(f"✅ dev.db created/validated with tables: {tables}")

if __name__ == "__main__":
    main()
