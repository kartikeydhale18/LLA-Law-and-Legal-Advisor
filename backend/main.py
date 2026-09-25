from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import chat, upload
from services.firebase import initialize_firebase
from services.pinecone_service import initialize_pinecone
from services.llm import initialize_llms
import contextlib
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import os
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    logger.info("Initializing services...")
    initialize_firebase()
    initialize_pinecone()
    initialize_llms()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="LLA Backend",
    description="Backend API for Law and Legal Advisor",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to LLA Backend"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

