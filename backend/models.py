"""
CogniCite AI — Pydantic v2 Request/Response Models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User query")
    history: Optional[List[Dict[str, Any]]] = Field(
        default=None, 
        description="Optional conversation history for multi-turn context. Format: [{'role': 'user'|'assistant', 'content': '...'}]"
    )


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class Citation(BaseModel):
    source: str = Field(..., description="Source PDF filename")
    page: int = Field(..., description="1-indexed page number within the source document")
    text: str = Field(..., description="Raw excerpt from the retrieved chunk")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="LLM-generated answer in Markdown format")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")


class DocumentMeta(BaseModel):
    filename: str
    chunks: int
    pages: int
    file_size_mb: Optional[float] = 0.0
    process_time_sec: Optional[float] = 0.0
    embedding_batches: Optional[int] = 1
    vector_dim: Optional[int] = 768


class UploadResponse(BaseModel):
    message: str = "Documents ingested successfully"
    documents: List[DocumentMeta]


class HealthResponse(BaseModel):
    status: str
    mongodb: str
    active_documents: int


class ClearResponse(BaseModel):
    message: str
    deleted_count: int
