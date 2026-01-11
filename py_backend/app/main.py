from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, Base
from app.api.upload import router as upload_router
from app.api.transactions import router as transactions_router

#  Minimal FastAPI app configuration for MVP
# to implement middleware (connection between backend and frontend)
# to initialize FASTAPI
app = FastAPI()
# to Create budget.db with tables
Base.metadata.create_all(bind=engine)

# to configure middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# to define route as test
@app.get("/")
async def read_root():
    return {"message": "Hello World"}

# to define route for uploads
app.include_router(upload_router, tags=["upload"])
# to define route for transactions
app.include_router(transactions_router, tags=["transactions"])