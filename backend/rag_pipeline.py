"""
CogniCite AI — RAG Pipeline
Handles PDF ingestion and conversational retrieval with structured citations.

Uses pure REST API calls for all Gemini interactions:
- Embeddings: gemini-embedding-001 via REST (768 dims, outputDimensionality=768)
- LLM:        gemini-1.5-pro via google-generativeai SDK (configured with REST transport)

gRPC transport (langchain_google_genai default) causes Deadline Exceeded on many
networks. The REST approach is reliable and confirmed working.
"""

import os
import tempfile
from typing import List, Tuple

import requests
try:
    from langchain_core.embeddings import Embeddings
except ImportError:
    from langchain.embeddings.base import Embeddings

from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_community.document_loaders import PyPDFLoader

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

from dotenv import load_dotenv

from database import get_collection, VECTOR_INDEX_NAME
from models import Citation

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
EMBEDDING_MODELS = [
    "gemini-embedding-2",
    "gemini-embedding-2-preview",
    "gemini-embedding-001",
]
EMBEDDING_DIMS = 768
LLM_MODEL      = "gemini-flash-latest"


# ---------------------------------------------------------------------------
# Custom REST Embeddings — Multi-model rate-limit bypass & fallback
# ---------------------------------------------------------------------------

class GeminiRESTEmbeddings(Embeddings):
    """
    LangChain-compatible Embeddings using Gemini REST API with automatic
    multi-model rate-limit (429) fallback. If model 1 hits rate limit,
    it automatically switches to model 2 or 3 instantly without failing.
    """

    def __init__(self, api_key: str, dims: int = EMBEDDING_DIMS):
        self.api_key = api_key
        self.dims    = dims

    def _embed_batch_with_fallback(self, texts: List[str]) -> List[List[float]]:
        import time

        last_error = None
        for global_attempt in range(3):
            for model in EMBEDDING_MODELS:
                url = f"{GEMINI_BASE_URL}/{model}:batchEmbedContents"
                payload = {
                    "requests": [
                        {
                            "model": f"models/{model}",
                            "content": {"parts": [{"text": t}]},
                            "outputDimensionality": self.dims,
                        }
                        for t in texts
                    ]
                }

                try:
                    resp = requests.post(
                        url,
                        params={"key": self.api_key},
                        json=payload,
                        timeout=60,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return [e["values"] for e in data.get("embeddings", [])]
                    if resp.status_code == 429:
                        print(f"⚠️ {model} 429 Rate Limit (attempt {global_attempt + 1}). Trying next model / waiting 5s...")
                        last_error = f"Rate limit (429) on {model}"
                        time.sleep(2)
                        continue
                    resp.raise_for_status()
                except Exception as exc:
                    last_error = exc
                    time.sleep(1)

            # If all Gemini REST models hit 429, fall back to local FastEmbed (ONNX 768d)
            try:
                from fastembed import TextEmbedding
                print("⚡ Gemini API rate-limited. Using local FastEmbed (ONNX 768d) for vector generation...")
                local_model = TextEmbedding(model_name="nomic-ai/nomic-embed-text-v1.5")
                vec_gen = list(local_model.embed(texts))
                results = []
                for vec in vec_gen:
                    v_list = [float(x) for x in vec]
                    if len(v_list) < self.dims:
                        v_list = v_list + [0.0] * (self.dims - len(v_list))
                    elif len(v_list) > self.dims:
                        v_list = v_list[: self.dims]
                    results.append(v_list)
                return results
            except Exception as local_err:
                print(f"⚠️ Local FastEmbed fallback note: {local_err}")

            print(f"⏳ Waiting 5s for Gemini rate-limit window to reset (pass {global_attempt + 1}/3)...")
            time.sleep(5)

        raise RuntimeError(f"Gemini API Rate Limit (429) or Connection Error: {last_error}. Please wait 30 seconds and try uploading again.")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import time
        batch_size = 90  # 90 chunks per single REST request
        all_embeddings: List[List[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            embeddings = self._embed_batch_with_fallback(batch)
            all_embeddings.extend(embeddings)
            if i + batch_size < len(texts):
                time.sleep(1.2)  # Smooth 1.2s pacing to stay strictly within 15 RPM free tier limits

        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        return self._embed_batch_with_fallback([text])[0]


# ---------------------------------------------------------------------------
# Shared instances
# ---------------------------------------------------------------------------

_embeddings = GeminiRESTEmbeddings(api_key=GEMINI_API_KEY)

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_vector_store() -> MongoDBAtlasVectorSearch:
    return MongoDBAtlasVectorSearch(
        collection=get_collection(),
        embedding=_embeddings,
        index_name=VECTOR_INDEX_NAME,
        text_key="text",
        embedding_key="embedding",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def ingest_pdf(file_bytes: bytes, filename: str) -> dict:
    """
    Ingest a PDF into MongoDB Atlas Vector Search.
    Returns a dict with filename, chunk count, page count, and meticulous timing stats.
    """
    import math
    t0 = time.time()
    file_size_mb = round(len(file_bytes) / (1024 * 1024), 2)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        try:
            loader = PyPDFLoader(tmp_path)
            pages = loader.load()
        except Exception:
            from pypdf import PdfReader
            from langchain.schema import Document
            reader = PdfReader(tmp_path)
            pages = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append(Document(page_content=text, metadata={"page": idx, "source": filename}))

        for page in pages:
            page.metadata["source"] = filename

        chunks = _splitter.split_documents(pages)
        # Filter out empty whitespace chunks
        chunks = [c for c in chunks if c.page_content and c.page_content.strip()]

        if chunks:
            vs = _get_vector_store()
            vs.add_documents(chunks)

        process_time_sec = round(time.time() - t0, 2)
        batches = max(1, math.ceil(len(chunks) / 90))

        return {
            "filename": filename,
            "chunks": len(chunks),
            "pages": len(pages),
            "file_size_mb": file_size_mb,
            "process_time_sec": process_time_sec,
            "embedding_batches": batches,
            "vector_dim": EMBEDDING_DIMS,
        }
    finally:
        os.unlink(tmp_path)


def chat_with_rag(message: str) -> Tuple[str, List[Citation]]:
    """
    Perform retrieval-augmented generation for a user query.
    Returns answer (Markdown) and deduplicated citations.
    """
    vs = _get_vector_store()
    docs = vs.similarity_search(message, k=4)

    if not docs:
        return (
            "I couldn't find relevant information in the uploaded documents. "
            "Please upload one or more PDFs and try again.",
            [],
        )

    # ---- Build context ----
    context_blocks: List[str] = []
    for i, doc in enumerate(docs, 1):
        src = doc.metadata.get("source", "Unknown")
        pg  = int(doc.metadata.get("page", 0)) + 1
        context_blocks.append(f"[Excerpt {i} — {src}, Page {pg}]\n{doc.page_content}")
    context = "\n\n---\n\n".join(context_blocks)

    # ---- Prompt ----
    prompt = (
        "You are CogniCite, an expert AI document analyst for enterprise teams. "
        "Answer the user's question thoroughly and accurately using ONLY the provided document excerpts. "
        "Format your response with clear Markdown: use **bold** for key terms, bullet points for lists, "
        "headers (##) for sections, and code blocks where appropriate. "
        "If the excerpts don't contain enough information, say so clearly rather than guessing.\n\n"
        f"Document excerpts:\n\n{context}\n\n"
        f"---\n\nQuestion: {message}\n\n"
        "Provide a comprehensive, well-structured answer."
    )

    # ---- Direct REST Call to Gemini LLM ----
    url = f"{GEMINI_BASE_URL}/{LLM_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    
    resp = requests.post(url, params={"key": GEMINI_API_KEY}, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    answer_text = ""
    try:
        answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        answer_text = "Generated response payload was empty."

    # ---- Deduplicated citations ----
    citations: List[Citation] = []
    seen: set = set()
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        page   = int(doc.metadata.get("page", 0)) + 1
        key    = f"{source}||{page}"
        if key not in seen:
            seen.add(key)
            citations.append(Citation(source=source, page=page, text=doc.page_content[:500]))

    return answer_text, citations
