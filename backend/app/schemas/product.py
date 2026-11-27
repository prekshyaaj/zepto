from typing import List, Optional
from pydantic import BaseModel


class Product(BaseModel):
    product_id: int
    product_name: str
    aisle_id: int
    department_id: int


class RecommendationRequest(BaseModel):
    product_id: int
    k: int = 5


class SimilarProduct(BaseModel):
    product_name: str
    image_url: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None


class SimilarUser(BaseModel):
    user_id: int
    cluster_name: str


class RecommendationResponse(BaseModel):
    product_id: int
    recommendations: List[SimilarProduct]


class UserRecommendationResponse(BaseModel):
    user_id: int
    similar_users: List[SimilarUser]
