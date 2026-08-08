# CogniCite AI — Enterprise Document Intelligence & RAG Platform

> **Production-grade AI knowledge engine** combining FastAPI, LangChain, MongoDB Atlas Vector Search, Gemini 1.5 Pro, and React (Vite) + Tailwind CSS.

---

## Architecture

```
enterprise-rag-platform/
├── backend/          # FastAPI + LangChain RAG engine
│   ├── main.py       # REST API (upload / chat / clear / health)
│   ├── database.py   # MongoDB Atlas client
│   ├── rag_pipeline.py  # PDF ingestion + Gemini-powered RAG
│   ├── models.py     # Pydantic schemas
│   ├── requirements.txt
│   └── .env
└── frontend/         # React (Vite) + Tailwind CSS
    └── src/
        ├── App.jsx
        └── components/
            ├── Header.jsx       # Status bar + health indicator
            ├── Sidebar.jsx      # Drag-and-drop PDF upload
            ├── ChatWindow.jsx   # Main chat interface
            ├── MessageBubble.jsx  # Markdown + citations
            └── CitationCard.jsx   # Expandable source excerpt
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| MongoDB Atlas | Free tier or above |
| Google AI Studio | Gemini API key |

---

## ⚡ Local Setup

### 1 — MongoDB Atlas Vector Index

Before starting, create the vector search index in Atlas:

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Atlas Search** tab.
2. Click **Create Search Index** → **Atlas Vector Search** → **JSON Editor**.
3. Select database `rag_db`, collection `documents`.
4. Paste this JSON:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "source"
    }
  ]
}
```
5. Name the index **`vector_index`** → **Create**.

> **Note:** `text-embedding-004` produces **768-dimensional** vectors.

---

### 2 — Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and replace <db_password> with your Atlas password
nano .env

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify at **http://localhost:8000/api/health**

Swagger docs at **http://localhost:8000/docs**

---

### 3 — Frontend

```bash
cd frontend

# Install npm packages
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health + MongoDB ping |
| `POST` | `/api/upload` | Ingest one or more PDFs (multipart/form-data, key: `files`) |
| `POST` | `/api/chat` | RAG Q&A — body: `{"message": "..."}` |
| `DELETE` | `/api/clear` | Flush all vectors from Atlas |

### Example: Chat

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the key financial highlights?"}'
```

Response:
```json
{
  "answer": "## Key Financial Highlights\n\n...",
  "citations": [
    {
      "source": "annual_report_2024.pdf",
      "page": 12,
      "text": "Revenue grew 23% year-over-year to $4.2B..."
    }
  ]
}
```

---

## Environment Variables

```env
GEMINI_API_KEY=AIzaSy...
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Deployment (Render)

### Backend (Web Service)

1. Push to GitHub.
2. In Render → **New Web Service** → connect repo.
3. Set **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add **Environment Variables** (GEMINI_API_KEY, MONGODB_URI, ALLOWED_ORIGINS).

### Frontend (Static Site)

1. In Render → **New Static Site** → connect repo.
2. Set **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

> Update `vite.config.js` proxy target to use `VITE_API_URL` when deployed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MongoServerSelectionError` | Check Atlas IP whitelist (add `0.0.0.0/0` for dev) |
| `No documents found` | Ensure `vector_index` exists with correct 768 dimensions |
| `Gemini quota error` | Check API key and quota at [aistudio.google.com](https://aistudio.google.com) |
| Upload fails silently | Verify file is a valid PDF and under 20 MB |
| CORS errors | Add your frontend URL to `ALLOWED_ORIGINS` in `.env` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Gemini 1.5 Pro (Google AI) |
| Embeddings | text-embedding-004 (768d) |
| Vector DB | MongoDB Atlas Vector Search |
| Orchestration | LangChain + LangChain-MongoDB |
| API | FastAPI + Uvicorn |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |

---

*Built with ❤️ by CogniCite AI — Enterprise Document Intelligence Platform*
