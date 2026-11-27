import os
import shutil #copy file data
import tempfile #create temporary files safely

from backend.app.chatbot_model.expiry_ocr.ocr_openrouter import check_expiry


def check_expiry_from_upload(uploaded_file):
    """Save uploaded image temporarily and run the OCR expiry checker."""

    suffix = os.path.splitext(uploaded_file.filename or "")[1] #to get img extension like .jpg
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix) #to create temp file on disk eg:temp1.jpg

    try:
        with temp_file:
            shutil.copyfileobj(uploaded_file.file, temp_file) #copy the uploaded img in the temp file

        result = check_expiry(temp_file.name)

        return {
            "result": result
        }

    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)  #deleting the temp file after returning
