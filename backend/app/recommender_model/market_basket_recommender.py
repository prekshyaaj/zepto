import os
from functools import lru_cache

import pandas as pd
from fastapi import HTTPException

from backend.app.db.supabase_client import supabase

# Flow: product ids -> aisles -> matching association rules -> recommended aisles -> top products.

PRODUCTS_WITH_AISLES_TABLE = os.getenv(
    "PRODUCTS_WITH_AISLES_TABLE",
    "products_with_aisles",
)
AISLE_ASSOCIATION_RULES_TABLE = os.getenv(
    "AISLE_ASSOCIATION_RULES_TABLE",
    "aisle_association_rules",
)


def fetch_all_rows(table_name: str, page_size: int = 1000):
    """Fetch a full Supabase table in pages to bypass the 1,000-row limit."""
    rows = []
    start = 0
    while True:
        end = start + page_size - 1
        response = (
            supabase
            .table(table_name)
            .select("*")
            .range(start, end)
            .execute()
        )
        batch = response.data
        rows.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size
    return rows


@lru_cache(maxsize=1)
def _load_aisle_association_rules():
    """Load all aisle association rules once and cache them."""
    return fetch_all_rows(AISLE_ASSOCIATION_RULES_TABLE)


@lru_cache(maxsize=1)
def _load_products_with_aisles():
    """Load all products_with_aisles once and cache them."""
    return fetch_all_rows(PRODUCTS_WITH_AISLES_TABLE)


def get_market_basket_recommendations(product_ids):
    """Return aisle-level MBA product recommendations."""

    if not product_ids:
        return {"recommendations": []}

    rules_data = _load_aisle_association_rules()
    products_data = _load_products_with_aisles()

    if not rules_data or not products_data:
        raise HTTPException(status_code=503, detail="Market basket data is not loaded")

    rules = pd.DataFrame(rules_data)
    products_with_aisles = pd.DataFrame(products_data)

    if rules.empty or products_with_aisles.empty:
        raise HTTPException(status_code=503, detail="Market basket data is empty")

    products_with_aisles = products_with_aisles.dropna(subset=["product_id"])
    products_with_aisles["product_id"] = pd.to_numeric(
        products_with_aisles["product_id"],
        errors="coerce",
    ).astype(int)

    input_groups = set()
    input_dept_ids = set()

    for i in product_ids:
        matching_row = products_with_aisles[
            products_with_aisles["product_id"] == int(i)
        ]
        if matching_row.empty:
            raise HTTPException(status_code=404, detail=f"Product ID {i} not found")
        input_groups.add(matching_row["aisle"].iloc[0])
        if "department_id" in matching_row.columns:
            input_dept_ids.add(matching_row["department_id"].iloc[0])

    rec = set()

    for index, row in rules.iterrows():
        if pd.isna(row["if_basket_has"]):
            continue

        row_if_basket_has = {
            x.strip()
            for x in str(row["if_basket_has"]).split(",")
            if x.strip()
        }

        if row_if_basket_has.issubset(input_groups):
            if not pd.isna(row["then_recommend"]):
                for item in str(row["then_recommend"]).split(","):
                    rec.add(item.strip())

    input_groups_lower = [str(g).strip().lower() for g in input_groups]
    rec_lower = [str(r).strip().lower() for r in rec]

    # --- FALLBACK MECHANISM ---
    # Level 1: Standard rule matching
    recommended_products = products_with_aisles[
        products_with_aisles["aisle"].str.strip().str.lower().isin(rec_lower)
    ]

    # Level 2 Fallback: Popular products from the same input aisle
    if recommended_products.empty:
        recommended_products = products_with_aisles[
            products_with_aisles["aisle"].str.strip().str.lower().isin(input_groups_lower)
        ]

    # Level 3 Fallback: Popular products from the same department IDs
    if recommended_products.empty and input_dept_ids and "department_id" in products_with_aisles.columns:
        recommended_products = products_with_aisles[
            products_with_aisles["department_id"].isin(input_dept_ids)
        ]

    # Level 4 Fallback: Global popular products
    if recommended_products.empty:
        recommended_products = products_with_aisles

    if recommended_products.empty:
        return {"recommendations": []}

    # Pick top 3 products per aisle sorted by reorder_count
    top_products = (
        recommended_products
        .sort_values(["aisle", "reorder_count"], ascending=[True, False])
        .groupby("aisle", as_index=False)
        .head(3)
    )

    return {"recommendations": top_products.to_dict(orient="records")}
