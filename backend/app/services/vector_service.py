"""
Simple in-memory text search (fallback for Python 3.7 where ChromaDB is unavailable).
Uses basic keyword overlap scoring to find relevant chunks.
"""
import re

# In-memory store: { doc_id: [chunk1, chunk2, ...] }
_store = {}


def add_document(doc_id: str, chunks, metadata=None):
    """Store text chunks for a document."""
    _store[doc_id] = chunks


def search_similar(query: str, doc_ids=None, n_results: int = 5) -> str:
    """Return the most relevant chunks for a query using keyword matching."""
    query_words = set(re.findall(r'\w+', query.lower()))
    scored = []

    for doc_id, chunks in _store.items():
        if doc_ids and doc_id not in doc_ids:
            continue
        for chunk in chunks:
            chunk_words = set(re.findall(r'\w+', chunk.lower()))
            score = len(query_words & chunk_words)
            if score > 0:
                scored.append((score, chunk))

    # Sort by relevance, return top n
    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [c for _, c in scored[:n_results]]
    return "\n\n".join(top_chunks)


def delete_document(doc_id: str):
    """Remove a document from the store."""
    _store.pop(doc_id, None)
