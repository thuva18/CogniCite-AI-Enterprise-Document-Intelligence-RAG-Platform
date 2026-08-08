"""
CogniCite AI — FastAPI Application
Exposes REST endpoints for PDF ingestion, RAG chat, context management, and health.
"""

import os
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import clear_collection, count_documents, ping_mongodb
from models import (
    ChatRequest,
    ChatResponse,
    ClearResponse,
    DocumentMeta,
    HealthResponse,
    UploadResponse,
)
from rag_pipeline import chat_with_rag, ingest_pdf

load_dotenv()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS: List[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")
]
MAX_FILE_SIZE_MB = 20
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 CogniCite AI backend starting…")
    yield
    print("🛑 CogniCite AI backend shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="CogniCite AI",
    description="Enterprise Document Intelligence & RAG Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Return service health and MongoDB connection status."""
    mongo_ok = ping_mongodb()
    return HealthResponse(
        status="healthy" if mongo_ok else "degraded",
        mongodb="connected" if mongo_ok else "unreachable",
        active_documents=count_documents(),
    )


@app.post(
    "/api/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Documents"],
)
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Accept one or more PDF files, embed them, and store vectors in MongoDB Atlas.
    Max file size: 20 MB per file.
    """
    ingested: List[DocumentMeta] = []

    for file in files:
        # Validate MIME type
        if file.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{file.filename}' is not a PDF. Only PDF files are accepted.",
            )

        content = await file.read()

        # Validate file size
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"'{file.filename}' exceeds the {MAX_FILE_SIZE_MB} MB limit.",
            )

        try:
            meta = await run_in_threadpool(ingest_pdf, content, file.filename)
            ingested.append(DocumentMeta(**meta))
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process '{file.filename}': {str(exc)}",
            ) from exc

    return UploadResponse(documents=ingested)


@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Accept a natural-language question and return an AI-generated answer
    with structured source citations.
    """
    if count_documents() == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents are loaded. Please upload at least one PDF first.",
        )

    try:
        answer, citations = await run_in_threadpool(chat_with_rag, request.message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG pipeline error: {str(exc)}",
        ) from exc

    return ChatResponse(answer=answer, citations=citations)


@app.delete("/api/clear", response_model=ClearResponse, tags=["Documents"])
async def clear_context():
    """Delete all ingested document vectors from MongoDB, resetting the context."""
    try:
        deleted = clear_collection()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear context: {str(exc)}",
        ) from exc

    return ClearResponse(
        message="Knowledge base cleared successfully.",
        deleted_count=deleted,
    )


# ---------------------------------------------------------------------------
# Entry point (dev)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
