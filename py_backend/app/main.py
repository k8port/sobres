from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import tempfile
import os

from app.db.session import engine, Base
from app.core.statement_extractor import extract_pdf_content
from app.api.transactions import router as tx_router


#  Minimal FastAPI app configuration for MVP
app = FastAPI()
# Create budget.db with tables
Base.metadata.create_all(bind=engine) 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={"error": "Only PDF files are allowed"})

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        df_data = extract_pdf_content(tmp_path)

        os.unlink(tmp_path)

        return {
            "text": df_data["text"],
            "tables": df_data["tables"].to_dict(orient="records"),
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
app.include_router(tx_router)