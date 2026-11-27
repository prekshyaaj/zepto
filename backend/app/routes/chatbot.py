from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.app.chatbot_model.faulty_product.cnn_faulty_detector import predict_faulty_product
from backend.app.chatbot_model.expiry_ocr.expiry_service import check_expiry_from_upload
from backend.app.chatbot_model.recipe_rag.services.recipe_service import generate_recipe
from backend.app.schemas.chatbot import ExpiryCheckResponse, FaultyProductResponse, RecipeRequest, RecipeResponse

router = APIRouter()


@router.post("/chatbot/faulty-product")  # api end point for chatbot faulty product flow
def check_faulty_product(image: UploadFile = File(...)):

    # Accept only image uploads for this flow so if user sends anything else error will be raised 
    #note: "image/" is a standard MIME type prefix automatically attached by the browser/client when uploading files
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    prediction = predict_faulty_product(image.file)  # send uploaded image to CNN

    # get response acc to the predefined pydantic model format
    return FaultyProductResponse(**prediction)  #** because this is unpacking dict so tht pydantic can verify fields otw error


@router.post("/chatbot/recipe")  # api end point for chatbot recipe RAG flow
def create_recipe(request: RecipeRequest):

    dish_name = request.dish.strip()  #.strip() just to remove the extra spaces in i/p eg: " pasta "

    # Dish name is required to generate recipe ingredients.
    if not dish_name:
        raise HTTPException(
            status_code=400,
            detail="Please enter a dish name"
        )
    
    try:
        return RecipeResponse(**generate_recipe(dish_name))  # FIXED ONLY THIS LINE

    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc)
        ) from exc


@router.post("/chatbot/expiry-check")  # api end point for chatbot OCR expiry flow
def check_expiry_api(file: UploadFile = File(...)):

    # OCR expiry flow also needs an image file.
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file"
        )

    result = check_expiry_from_upload(file)

    return ExpiryCheckResponse(**result)