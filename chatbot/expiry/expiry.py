from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil, os

# import your function directly
from expiry.ocr_openrouter import check_expiry
router = APIRouter(prefix="/expiry", tags=["expiry"])

@router.post('/check')
async def check_expiry_api(file: UploadFile = File(...)): #dots mean REQUIRED field
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        #wb means Images are not text → they are binary data.
        shutil.copyfileobj(file.file, buffer)#Copy all data from uploaded file → into disk file

    result = check_expiry(temp_path)

    os.remove(temp_path)

    return {
        "result": result
    }

# why do we sav in disk bcz cv2.imread(temp_path) expects file path on the disk