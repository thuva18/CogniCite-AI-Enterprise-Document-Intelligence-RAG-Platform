"""
CogniCite AI — FastAPI Application
Exposes REST endpoints for PDF ingestion, RAG chat, context management, and health.
"""

import os
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

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
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*",
    ).split(",")
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
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    mongo_ok = await run_in_threadpool(ping_mongodb)
    return HealthResponse(
        status="healthy" if mongo_ok else "degraded",
        mongodb="connected" if mongo_ok else "unreachable",
        active_documents=await run_in_threadpool(count_documents),
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
    Returns partial results — successful files are ingested even if others fail.
    """
    ingested: List[DocumentMeta] = []
    errors: List[str] = []

    for file in files:
        # Validate MIME type (allow application/octet-stream for some browsers)
        content_type = file.content_type or ""
        if content_type not in ("application/pdf", "application/octet-stream", "") and not file.filename.lower().endswith(".pdf"):
            errors.append(f"'{file.filename}' is not a PDF.")
            continue

        content = await file.read()

        if len(content) > MAX_FILE_SIZE_BYTES:
            errors.append(f"'{file.filename}' exceeds the {MAX_FILE_SIZE_MB} MB limit.")
            continue

        try:
            meta = await run_in_threadpool(ingest_pdf, content, file.filename)
            ingested.append(DocumentMeta(**meta))
        except Exception as exc:
            errors.append(f"Failed to process '{file.filename}': {str(exc)}")

    if not ingested and errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="; ".join(errors),
        )

    return UploadResponse(
        message=f"Ingested {len(ingested)} document(s) successfully." + (f" Errors: {'; '.join(errors)}" if errors else ""),
        documents=ingested,
    )


@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Accept a natural-language question and conversation history,
    return an AI-generated answer with structured source citations.
    """
    if await run_in_threadpool(count_documents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents are loaded. Please upload at least one PDF first.",
        )

    try:
        answer, citations = await run_in_threadpool(
            chat_with_rag, request.message, request.history
        )
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
        deleted = await run_in_threadpool(clear_collection)
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
