from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(title="Vinea ERP Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://172.18.0.4:3000",  # Frontend container IP
        "http://frontend:3000"      # Frontend container name
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Vinea ERP Backend is running"}
