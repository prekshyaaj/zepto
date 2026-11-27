import os
from datetime import datetime

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel

from backend.app.db.supabase_client import supabase


router = APIRouter(tags=["orders"])

ORDERS_TABLE = os.getenv("ORDERS_TABLE", "orders_final")
ORDER_ITEMS_TABLE = os.getenv("ORDER_PRODUCTS_TABLE", "order_products_prior_final")
PRODUCT_COLUMNS = "product_id,product_name,aisle_id,department_id,image_url,price,rating"


class OrderItem(BaseModel):
    product_id: int
    quantity: int
    price: float


class CreateOrderRequest(BaseModel):
    user_id: int
    items: list[OrderItem]
    address: str
    payment_method: str
    subtotal: float
    delivery_fee: float
    discount: float
    total: float


def _next_order_id():
    response = (
        supabase
        .table(ORDERS_TABLE)
        .select("order_id")
        .order("order_id", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        return 1

    return int(response.data[0]["order_id"]) + 1


def _next_order_number(user_id: int):
    response = (
        supabase
        .table(ORDERS_TABLE)
        .select("order_number")
        .eq("user_id", user_id)
        .order("order_number", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        return 1

    return int(response.data[0]["order_number"]) + 1


def _hydrate_products(product_ids):
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


def _order_status(order_id: int):
    return "Placed" if int(order_id) >= 900000000 else "Delivered"


@router.post("/orders")
def create_order(request: CreateOrderRequest):
    # The items table allows one row per (order_id, product_id), so write each
    # product once even when its quantity is above 1, and merge repeated items.
    quantities = {}
    for item in request.items:
        if item.quantity > 0:
            quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    if not quantities:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_id = _next_order_id()
    now = datetime.now()

    order_payload = {
        "order_id": order_id,
        "user_id": request.user_id,
        "order_number": _next_order_number(request.user_id),
        "order_dow": now.weekday(),
        "order_hour_of_day": now.hour,
        "days_since_prior_order": 0,
    }

    try:
        supabase.table(ORDERS_TABLE).insert(order_payload).execute()
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{ORDERS_TABLE}' is missing."
            ) from exc
        raise

    item_payloads = []
    for add_to_cart_order, product_id in enumerate(quantities, start=1):
        item_payloads.append({
            "order_id": order_id,
            "product_id": product_id,
            "add_to_cart_order": add_to_cart_order,
            "reordered": 0,
            "quantity": quantities[product_id],
        })

    try:
        supabase.table(ORDER_ITEMS_TABLE).insert(item_payloads).execute()
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{ORDER_ITEMS_TABLE}' is missing."
            ) from exc
        raise

    return {
        **order_payload,
        "items": item_payloads,
        "address": request.address,
        "payment_method": request.payment_method,
        "subtotal": request.subtotal,
        "delivery_fee": request.delivery_fee,
        "discount": request.discount,
        "total": request.total,
        "status": "Placed",
        "eta": "Arriving soon",
    }


@router.get("/orders/{order_id}")
def get_order(order_id: str):
    try:
        numeric_order_id = int(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Order not found") from exc

    try:
        response = (
            supabase
            .table(ORDERS_TABLE)
            .select("*")
            .eq("order_id", numeric_order_id)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{ORDERS_TABLE}' is missing."
            ) from exc
        raise

    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        items_response = (
            supabase
            .table(ORDER_ITEMS_TABLE)
            .select("*")
            .eq("order_id", numeric_order_id)
            .order("add_to_cart_order")
            .execute()
        )
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{ORDER_ITEMS_TABLE}' is missing."
            ) from exc
        raise

    product_ids = [int(item["product_id"]) for item in items_response.data]

    status = _order_status(numeric_order_id)

    return {
        **response.data[0],
        "items": items_response.data,
        "products": _hydrate_products(product_ids),
        "status": status,
        "eta": "Delivered" if status == "Delivered" else "Arriving soon",
    }


@router.get("/orders/{order_id}/status")
def get_order_status(order_id: str):
    try:
        numeric_order_id = int(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Order not found") from exc

    try:
        response = (
            supabase
            .table(ORDERS_TABLE)
            .select("order_id")
            .eq("order_id", numeric_order_id)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{ORDERS_TABLE}' is missing."
            ) from exc
        raise

    if not response.data:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "order_id": response.data[0]["order_id"],
        "status": _order_status(numeric_order_id),
    }


@router.get("/users/{user_id}/orders")
def get_user_orders(user_id: int, limit: int = 10):
    orders_response = (
        supabase
        .table(ORDERS_TABLE)
        .select("*")
        .eq("user_id", user_id)
        .order("order_number", desc=True)
        .limit(limit)
        .execute()
    )

    orders = orders_response.data

    if not orders:
        return []

    order_ids = [int(order["order_id"]) for order in orders]
    items_response = (
        supabase
        .table(ORDER_ITEMS_TABLE)
        .select("*")
        .in_("order_id", order_ids)
        .order("add_to_cart_order")
        .execute()
    )

    product_ids = list({
        int(item["product_id"])
        for item in items_response.data
    })
    products_by_id = {
        int(product["product_id"]): product
        for product in _hydrate_products(product_ids)
    }

    items_by_order = {}
    for item in items_response.data:
        product = products_by_id.get(int(item["product_id"]))
        items_by_order.setdefault(int(item["order_id"]), []).append({
            **item,
            "product": product,
        })

    return [
        {
            **order,
            "status": _order_status(int(order["order_id"])),
            "items": items_by_order.get(int(order["order_id"]), []),
        }
        for order in orders
    ]


@router.get("/users/{user_id}/buy-again")
def get_buy_again(user_id: int, limit: int = 12):
    orders_response = (
        supabase
        .table(ORDERS_TABLE)
        .select("order_id")
        .eq("user_id", user_id)
        .order("order_number", desc=True)
        .limit(50)
        .execute()
    )

    order_ids = [int(order["order_id"]) for order in orders_response.data]

    if not order_ids:
        return {"user_id": user_id, "recommendations": []}

    items_response = (
        supabase
        .table(ORDER_ITEMS_TABLE)
        .select("product_id,reordered,order_id")
        .in_("order_id", order_ids)
        .execute()
    )

    counts = {}
    for item in items_response.data:
        product_id = int(item["product_id"])
        counts[product_id] = counts.get(product_id, 0) + 1 + int(item.get("reordered") or 0)

    product_ids = [
        product_id
        for product_id, _ in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:limit]
    ]

    return {
        "user_id": user_id,
        "recommendations": _hydrate_products(product_ids),
    }
