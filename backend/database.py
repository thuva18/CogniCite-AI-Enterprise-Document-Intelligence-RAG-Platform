"""
CogniCite AI — MongoDB Atlas Vector Search Client
Provides a singleton pymongo collection used by the RAG pipeline.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure

load_dotenv()

MONGODB_URI: str = os.getenv("MONGODB_URI", "")
DB_NAME = "rag_db"
COLLECTION_NAME = "documents"
VECTOR_INDEX_NAME = "vector_index"


@lru_cache(maxsize=1)
def _get_client() -> MongoClient:
    """Return a cached MongoClient instance."""
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in the environment.")
    return MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)


def get_collection() -> Collection:
    """Return the `rag_db.documents` collection."""
    client = _get_client()
    return client[DB_NAME][COLLECTION_NAME]


def ping_mongodb() -> bool:
    """Return True if MongoDB responds to a ping, False otherwise."""
    try:
        _get_client().admin.command("ping")
        return True
    except (ConnectionFailure, Exception):
        return False


def count_documents() -> int:
    """Return total number of document chunks currently stored."""
    try:
        return get_collection().count_documents({})
    except Exception:
        return 0


def clear_collection() -> int:
    """Delete all documents from the collection and return deleted count."""
    col = get_collection()
    result = col.delete_many({})
    return result.deleted_count
