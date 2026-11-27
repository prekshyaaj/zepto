from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.recommender_model.market_basket_recommender import (
    get_market_basket_recommendations,
)
from backend.app.db.supabase_client import supabase

class MBARequest(BaseModel):
    product_ids: list[int]

router = APIRouter(prefix="/mba", tags=["market basket"])


@router.post("/recommend")
def recommend(request: MBARequest):
    """Recommend products using aisle-level market basket rules."""
    try:
        product_ids = request.product_ids

        result = get_market_basket_recommendations(product_ids)
        top_products_list = result.get("recommendations", [])

        if not top_products_list:
            return {"recommendations": []}

        top_product_ids = [int(row['product_id']) for row in top_products_list]

        # Fetch image_url, price, rating from the products table
        products_response = (
            supabase
            .table("products")
            .select("product_id, image_url, price, rating")
            .in_("product_id", top_product_ids)
            .execute()
        )
        product_details = {
            int(product["product_id"]): product
            for product in products_response.data
        }

        recs_list = []
        for row in top_products_list:
            pid = int(row['product_id'])
            details = product_details.get(pid, {})
            recs_list.append({
                "product_id": pid,
                "product_name": row['product_name'],
                "aisle_id": row.get("aisle_id"),
                "department_id": row.get("department_id"),
                "aisle": row.get("aisle"),
                "reorder_count": int(row.get("reorder_count") or 0),
                "reorder_ratio": row.get("reorder_ratio"),
                "image_url": details.get("image_url"),
                "price": details.get("price"),
                "rating": details.get("rating"),
            })

        return {"recommendations": recs_list}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Market basket recommendation failed: {exc}"
        ) from exc
