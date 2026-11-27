import csv
from collections import Counter
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from backend.app.recommender_model.product_recommender import get_similar_products
from backend.app.recommender_model.user_recommender import get_similar_users
from backend.app.schemas.product import UserRecommendationResponse
from backend.app.db.supabase_client import supabase

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[2]
ORDERS_PATH = BASE_DIR / "data" / "orders_final.csv"
ORDER_PRODUCTS_PATH = BASE_DIR / "data" / "order_products_prior_final.csv"
PRODUCT_COLUMNS = "product_id,product_name,aisle_id,department_id,image_url,price,rating"


@router.get("/recommend/{product_id}")  #api end point for recommending products
def recommend_products(product_id: int, k: int = Query(default=5, ge=1, le=20)):

    similar_products = get_similar_products(product_id, k)  #extract the top similar products

    if not similar_products:
        raise HTTPException(
            status_code=404,
            detail=f"Product {product_id} not found or no recommendations available"
        )

    return {
        "product_id": product_id,
        "recommendations": similar_products
    }


@router.get("/recommend/user/{user_id}")  # api end point for recommending similar users
def recommend_users(user_id: int):

    similar_users = get_similar_users(user_id)  # extract the top 5 similar users

    if not similar_users:
        raise HTTPException(
            status_code=404,
            detail=f"User {user_id} not found or no recommendations available"
        )
    # get response acc to the predefined pydantic model format

    return UserRecommendationResponse(
    user_id=user_id,
    similar_users=similar_users
    )


@lru_cache(maxsize=1)
def _load_user_orders():
    orders_by_user: dict[int, list[int]] = {}
    products_by_order: dict[int, list[int]] = {}

    with ORDERS_PATH.open(newline="") as file:
        for row in csv.DictReader(file):
            orders_by_user.setdefault(int(row["user_id"]), []).append(int(row["order_id"]))

    with ORDER_PRODUCTS_PATH.open(newline="") as file:
        for row in csv.DictReader(file):
            products_by_order.setdefault(int(row["order_id"]), []).append(int(row["product_id"]))

    return orders_by_user, products_by_order


def _products_for_users(user_ids: list[int], limit: int):
    orders_by_user, products_by_order = _load_user_orders()
    counts: Counter[int] = Counter()

    for user_id in user_ids:
        for order_id in orders_by_user.get(user_id, []):
            counts.update(products_by_order.get(order_id, []))

    product_ids = [product_id for product_id, _ in counts.most_common(limit)]

    if not product_ids:
        return []

    response = (
        supabase
        .table("products")
        .select(PRODUCT_COLUMNS)
        .in_("product_id", product_ids)
        .execute()
    )

    products_by_id = {
        int(product["product_id"]): product
        for product in response.data
    }

    return [
        products_by_id[product_id]
        for product_id in product_ids
        if product_id in products_by_id
    ]


@router.get("/recommend/user/{user_id}/products")
def recommend_products_for_user(user_id: int, limit: int = Query(default=12, ge=1, le=30)):
    similar_users = get_similar_users(user_id)

    if not similar_users:
        raise HTTPException(
            status_code=404,
            detail=f"User {user_id} not found or no recommendations available"
        )

    similar_user_ids = [int(user["user_id"]) for user in similar_users]
    products = _products_for_users(similar_user_ids, limit)

    return {
        "user_id": user_id,
        "similar_users": similar_users,
        "recommendations": products,
    }
