import csv
from functools import lru_cache
from pathlib import Path

import numpy as np

# this loads saved product data and returns products related to an ingredient name.

BACKEND_DIR = Path(__file__).resolve().parents[5] / "backend"
RECIPE_RAG_MODEL_DIR = BACKEND_DIR / "models" / "recipe_rag"

CLEANED_PRODUCTS_PATH = RECIPE_RAG_MODEL_DIR / "cleaned_products.csv"  #slighlty simplified prod names dataset
PRODUCT_EMBEDDINGS_PATH = RECIPE_RAG_MODEL_DIR / "product_embeddings.npy"
FAISS_INDEX_PATH = RECIPE_RAG_MODEL_DIR / "products.index"

MODEL_NAME = "all-MiniLM-L6-v2"

# cache loaded product data in memory so CSV is not reread on every request thts wht lr cache is doing
@lru_cache(maxsize=1)
def _load_products():
    """Load cleaned products once so every request does not read the CSV again."""

    with open(CLEANED_PRODUCTS_PATH, "r", encoding="utf-8") as file:
        return list(csv.DictReader(file))


@lru_cache(maxsize=1)
def _load_rag_objects():
    #this is for loading products csv, faiss index and the model once so tht with every request we dont hv load these things 

    import faiss
    from sentence_transformers import SentenceTransformer

    df = _load_products()
    model = SentenceTransformer(MODEL_NAME)
    index = faiss.read_index(str(FAISS_INDEX_PATH))
    return df, model, index 


def retrieve_products(search_text, k=5):
    """Return grocery products that are most relevant to one ingredient/search text."""

    search_text = search_text.strip()

    if not search_text:
        return []

    df, model, index = _load_rag_objects()

    #below are the basic steps followed in rag that logic only
    query_embedding = model.encode([search_text]) #converting ingredient name to embedding
    query_embedding = np.array(query_embedding).astype("float32")

    # Normalize so FAISS inner product works like cosine similarity.
    norm = np.linalg.norm(query_embedding, axis=1, keepdims=True)
    norm[norm == 0] = 1
    query_embedding = query_embedding / norm

    scores, indices = index.search(query_embedding, k)

    results = []

    for score, idx in zip(scores[0], indices[0]):
        product = df[idx]

        results.append(
            {
                "product_name": str(product["product_name"]),
                "product_id": int(product["product_id"]),
                "cleaned_name": str(product["cleaned_name"]),
                "score": float(score),
            }
        )

    return results

