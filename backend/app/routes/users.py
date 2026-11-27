import os
from datetime import datetime, timezone
from hashlib import sha256
from typing import Optional, Union

from postgrest.exceptions import APIError
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.db.supabase_client import supabase


router = APIRouter(tags=["users"])

USERS_TABLE = os.getenv("USERS_TABLE", "users_final")
WISHLIST_TABLE = os.getenv("WISHLIST_TABLE", "wishlists")
PRODUCT_COLUMNS = "product_id,product_name,aisle_id,department_id,image_url,price,rating"


class LoginRequest(BaseModel):
    identifier: str


class SignupRequest(BaseModel):
    email: str
    phone: Optional[Union[str, int]] = None
    password: str


def _normalize_phone(value: str):
    digits = "".join(character for character in value if character.isdigit())
    if not digits:
        return value.strip()
    if len(digits) == 10:
        return f"+91{digits}"
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    return f"+{digits}" if value.strip().startswith("+") else digits


def _get_user_by_identifier(identifier: str):
    clean_identifier = identifier.strip()

    if not clean_identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    column = "email" if "@" in clean_identifier else "phone"
    value = clean_identifier if column == "email" else _normalize_phone(clean_identifier)

    response = (
        supabase
        .table(USERS_TABLE)
        .select("user_id,email,phone,created_at,last_login,is_active,cluster_name")
        .eq(column, value)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found in Supabase")

    return response.data[0]


def _phone_to_bigint(value: Optional[Union[str, int]]):
    if value is None:
        return None

    digits = "".join(character for character in str(value) if character.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]

    return int(digits) if digits else None


def _hash_password(password: str):
    return sha256(password.encode("utf-8")).hexdigest()


@router.post("/auth/login")
def login(request: LoginRequest):
    """Resolve a real Supabase-backed user for the frontend session."""

    user = _get_user_by_identifier(request.identifier)

    return {
        "userId": int(user["user_id"]),
        "user": user,
    }


@router.post("/auth/signup")
def signup(request: SignupRequest):
    email = request.email.strip().lower()
    phone = _phone_to_bigint(request.phone)
    password = request.password.strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_email = (
        supabase
        .table(USERS_TABLE)
        .select("user_id")
        .eq("email", email)
        .limit(1)
        .execute()
    )

    if existing_email.data:
        raise HTTPException(status_code=409, detail="Email is already registered")

    if phone is not None:
        existing_phone = (
            supabase
            .table(USERS_TABLE)
            .select("user_id")
            .eq("phone", phone)
            .limit(1)
            .execute()
        )

        if existing_phone.data:
            raise HTTPException(status_code=409, detail="Phone number is already registered")

    latest_user = (
        supabase
        .table(USERS_TABLE)
        .select("user_id")
        .order("user_id", desc=True)
        .limit(1)
        .execute()
    )
    next_user_id = int(latest_user.data[0]["user_id"]) + 1 if latest_user.data else 1
    now = datetime.now(timezone.utc).isoformat()

    user_payload = {
        "user_id": next_user_id,
        "email": email,
        "phone": phone,
        "password_hash": _hash_password(password),
        "auth_provider": "email",
        "created_at": now,
        "last_login": now,
        "is_active": 1,
        "cluster": None,
        "cluster_name": None,
    }

    response = (
        supabase
        .table(USERS_TABLE)
        .insert(user_payload)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Could not create user")

    user = response.data[0]

    return {
        "userId": int(user["user_id"]),
        "user": {
            "user_id": user["user_id"],
            "email": user.get("email"),
            "phone": user.get("phone"),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login"),
            "is_active": user.get("is_active"),
            "cluster_name": user.get("cluster_name"),
        },
    }


@router.get("/users/{user_id}")
def get_user(user_id: int):
    response = (
        supabase
        .table(USERS_TABLE)
        .select("user_id,email,phone,created_at,last_login,is_active,cluster_name")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    return response.data[0]


@router.get("/users/{user_id}/wishlist")
def get_wishlist(user_id: int):
    try:
        response = (
            supabase
            .table(WISHLIST_TABLE)
            .select("product_id")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as exc:
        if "PGRST205" in str(exc):
            return []
        raise

    product_ids = [int(row["product_id"]) for row in response.data]

    if not product_ids:
        return []

    products_response = (
        supabase
        .table("products")
        .select(PRODUCT_COLUMNS)
        .in_("product_id", product_ids)
        .execute()
    )

    products_by_id = {
        int(product["product_id"]): product
        for product in products_response.data
    }

    return [
        products_by_id[product_id]
        for product_id in product_ids
        if product_id in products_by_id
    ]


@router.post("/users/{user_id}/wishlist/{product_id}")
def add_wishlist_item(user_id: int, product_id: int):
    try:
        supabase.table(WISHLIST_TABLE).upsert({
            "user_id": user_id,
            "product_id": product_id,
        }).execute()
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{WISHLIST_TABLE}' is missing. Run backend/supabase_app_schema.sql."
            ) from exc
        raise

    return {"user_id": user_id, "product_id": product_id, "saved": True}


@router.delete("/users/{user_id}/wishlist/{product_id}")
def remove_wishlist_item(user_id: int, product_id: int):
    try:
        (
            supabase
            .table(WISHLIST_TABLE)
            .delete()
            .eq("user_id", user_id)
            .eq("product_id", product_id)
            .execute()
        )
    except APIError as exc:
        if "PGRST205" in str(exc):
            raise HTTPException(
                status_code=503,
                detail=f"Supabase table '{WISHLIST_TABLE}' is missing. Run backend/supabase_app_schema.sql."
            ) from exc
        raise

    return {"user_id": user_id, "product_id": product_id, "saved": False}
