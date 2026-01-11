import uvicorn
from app.main import app

# To run app, pass application name, host, port, and reload flag to uvicorn
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        reload=True, 
        host="0.0.0.0", 
        port=8000
    )