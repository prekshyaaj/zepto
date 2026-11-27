import os
import joblib
from pathlib import Path
import pandas as pd

from functools import lru_cache

from backend.app.db.supabase_client import supabase

# This file is only for product-product recommendations.
# It loads the saved KNN model and finds products similar to one product.
BASE_DIR = Path(__file__).resolve().parents[2]  # backend/

MODEL_PATH = BASE_DIR / "models" / "product_recomm.joblib"
PRODUCTS_TABLE = os.getenv(
    "PRODUCTS_TABLE",
    "products"
)
@lru_cache(maxsize=1)
def _load_model_assets():
    """Load trained KNN model once and cache it."""

    model = joblib.load(MODEL_PATH)

    # list of all product ids used during training
    product_id_list = model["product_id_list"]

    # mapping: product_id -> embedding index

    product_id_to_index = {
        int(pid): index
        for index, pid in enumerate(
            product_id_list
        )
    }

    return {

        "knn": model["knn"],
        "X_emb": model["X_emb"],
        "product_id_list": product_id_list,

        # fast lookup dictionary
        "product_id_to_index":
            product_id_to_index,
    }

def _get_product_details(product_ids): #to display the prod details for the recommended prods
    """Fetch product details from Supabase."""

    response = (
        supabase
        .table(PRODUCTS_TABLE)

        # fetch only required columns
        .select(
            "product_id,"
            "product_name,"
            "aisle_id,"
            "department_id,"
            "image_url,"
            "price,"
            "rating"
        )

        # get only recommended products
        .in_("product_id", product_ids)

        .execute()
    )

    return response.data


# main recomm logic

def get_similar_products(
    product_id: int,
    k: int = 5
):
    """Return top k similar products."""

    assets = _load_model_assets()

    knn = assets["knn"]
    X_emb = assets["X_emb"]
    product_id_list = assets["product_id_list"]
    product_id_to_index = assets["product_id_to_index"]

    product_id = int(product_id)

    # product not found

    if product_id not in product_id_to_index:
        return []

    # get embedding index of product

    query_index = (product_id_to_index[product_id])

    # KNN expects 2D input

    query_vector = X_emb[query_index].reshape(1, -1)

    n_neighbors = k + 1

    distances, indices = knn.kneighbors(
        query_vector,
        n_neighbors=n_neighbors
    )

    recommended_product_ids = []

    for index, distance in zip(
        indices[0],
        distances[0]
    ):

        # skip same product

        if index == query_index:
            continue

        recommended_product_id = int(
            product_id_list[index]
        )

        recommended_product_ids.append(
            recommended_product_id
        )

        if len(recommended_product_ids) == k:
            break

    # get product details from supabase

    products = _get_product_details(
        recommended_product_ids
    )

    return products
