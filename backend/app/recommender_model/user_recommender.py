import os
import joblib

from pathlib import Path
from functools import lru_cache

from backend.app.db.supabase_client import supabase

# This file is only for user-user recommendations.
# It loads the saved KNN model and finds users similar to one user.
BASE_DIR = Path(__file__).resolve().parents[2]  # backend/

MODEL_PATH = BASE_DIR / "models" / "user_recomm.joblib"
USERS_TABLE = os.getenv(
    "USERS_TABLE",
    "users_final"
)

@lru_cache(maxsize=1)
def _load_model_assets():
    """Load trained KNN model once and cache it."""

    model = joblib.load(MODEL_PATH)

    user_id_list = model["user_id_list"]

    # mapping: user_id -> embedding index

    user_id_to_index = {
        int(uid): index
        for index, uid in enumerate(
            user_id_list
        )
    }

    return {

        "knn": model["knn"],
        "X_emb": model["X_emb"],
        "user_id_list": user_id_list,

        # fast lookup dictionary

        "user_id_to_index":
            user_id_to_index,
    }


def _get_user_details(user_ids):
    """Fetch user details from Supabase."""

    response = (
        supabase
        .table(USERS_TABLE)

        # fetch only required columns

        .select(
            "user_id,"
            "cluster_name"
        )

        # get only recommended users

        .in_("user_id", user_ids)

        .execute()
    )

    return response.data

# main recomm logic

def get_similar_users(
    user_id: int,
    k: int = 5
):
    """Return top k similar users."""

    assets = _load_model_assets()

    knn = assets["knn"]
    X_emb = assets["X_emb"]
    user_id_list = assets["user_id_list"]
    user_id_to_index = assets["user_id_to_index"]

    user_id = int(user_id)

    # user not found

    if user_id not in user_id_to_index:
        return []

    # get embedding index of user

    query_index = (user_id_to_index[user_id])

    # KNN expects 2D input

    query_vector = X_emb[
        query_index
    ].reshape(1, -1)

    distances, indices = knn.kneighbors(
        query_vector,
        n_neighbors=k + 1
    )

    recommended_user_ids = []

    for index in indices[0]:

        if index == query_index:  # skip same user
            continue

        recommended_user_id = int(
            user_id_list[index]
        )

        recommended_user_ids.append(
            recommended_user_id
        )

        if len(recommended_user_ids) == k:
            break

    # get user details from supabase

    users = _get_user_details(
        recommended_user_ids
    )

    return users
