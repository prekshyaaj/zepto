from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.app.db.supabase_client import supabase


router = APIRouter(tags=["products"])

PRODUCTS_TABLE = "products"
DEPARTMENTS_TABLE = "departments"
AISLES_TABLE = "aisles"

PRODUCT_COLUMNS = "product_id,product_name,aisle_id,department_id,image_url,price,rating"


@lru_cache(maxsize=1)
def _load_departments():
    """Load departments once because department data rarely changes."""

    response = (
        supabase
        .table(DEPARTMENTS_TABLE)
        .select("department_id,department,image_url")
        .order("department_id")
        .execute()
    )

    return response.data


@lru_cache(maxsize=1)
def _load_aisles():
    """Load aisles once because aisle data rarely changes."""

    response = (
        supabase
        .table(AISLES_TABLE)
        .select("aisle_id,aisle")
        .order("aisle_id")
        .execute()
    )

    return response.data


@router.get("/products")
def get_products(
    limit: int = Query(default=50, ge=1, le=100), #means default 50 prods but max limit is 100
    offset: int = Query(default=0, ge=0), #this is how many prods to skip
    query: Optional[str] = Query(default=None),
):
    """Return products for frontend listing pages."""

    request = (
        supabase
        .table(PRODUCTS_TABLE)
        .select(PRODUCT_COLUMNS)
        .order("product_id")
        .range(offset, offset + limit - 1)
    )

    if query and query.strip():
        request = request.ilike("product_name", f"%{query.strip()}%")

    response = request.execute()

    return response.data


@router.post("/products/by-ids")
def get_products_by_ids(product_ids: list[int]):
    """Return products for a list of product ids."""

    if not product_ids:
        return []

    response = (
        supabase
        .table(PRODUCTS_TABLE)
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

'''
note: in supabase syntax-
# exact match filter → used for IDs/numbers/fixed values
.eq("product_id", product_id)

# partial text search (case-insensitive) → matches product names containing search text
.ilike("product_name", f"%{search_text}%")

'''

@router.get("/products/search")
def search_products(
    q: str,
    limit: int = Query(default=20, ge=1, le=50),
):
    """Search products by name."""

    search_text = q.strip()

    if not search_text:
        return []

    response = (
        supabase
        .table(PRODUCTS_TABLE)
        .select(PRODUCT_COLUMNS)
        .ilike("product_name", f"%{search_text}%")
        .limit(limit)
        .execute()
    )

    return response.data


@router.get("/products/{product_id}")
def get_product(product_id: int):
    """Return one product by product id."""

    response = (
        supabase
        .table(PRODUCTS_TABLE)
        .select(PRODUCT_COLUMNS)
        .eq("product_id", product_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return response.data[0]


@router.get("/departments")
def get_departments():
    """Return all product departments."""

    return _load_departments()


@router.get("/departments/{department_id}/products")
def get_products_by_department(
    department_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Return products belonging to one department."""

    response = (
        supabase
        .table(PRODUCTS_TABLE)
        .select(PRODUCT_COLUMNS)
        .eq("department_id", department_id)
        .order("product_id")
        .range(offset, offset + limit - 1)
        .execute()
    )

    return response.data


@router.get("/aisles")
def get_aisles():
    """Return all product aisles."""

    return _load_aisles()


@router.get("/aisles/{aisle_id}/products")
def get_products_by_aisle(
    aisle_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Return products belonging to one aisle."""

    response = (
        supabase
        .table(PRODUCTS_TABLE)
        .select(PRODUCT_COLUMNS)
        .eq("aisle_id", aisle_id)
        .order("product_id")
        .range(offset, offset + limit - 1)
        .execute()
    )

    return response.data
