from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# INPUT for chatbot recipe RAG flow
class RecipeRequest(BaseModel):
    dish: str


# OUTPUT for chatbot faulty product flow
class FaultyProductResponse(BaseModel):
    label: str
    is_faulty: bool
    confidence: float
    message: str


# OUTPUT for chatbot OCR expiry flow
class ExpiryCheckResponse(BaseModel):
    result: str

# OUTPUT for chatbot recipe RAG flow
class RecipeResponse(BaseModel):
    dish: str
    needs_clarification: bool
    clarification_message: str
    suggested_dish: str
    recipe: Dict[str, Any]
    matched_products: List[Any]