import json
from pathlib import Path
import numpy as np
from PIL import Image
from functools import lru_cache

from tensorflow.keras.models import load_model # type: ignore
from tensorflow.keras.applications.efficientnet import preprocess_input # type: ignore

#thisll tell us if the product image uploaded by user is faulty or no


BASE_DIR = Path(__file__).resolve().parents[3]  # backend/

MODEL_PATH = BASE_DIR / "models" / "cnn_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "class_names.json"  #this is to tell , 0: faulty, 1: good

IMG_SIZE = (224, 224)

import json

# load cnn model
@lru_cache(maxsize=1)
def get_model():
    return load_model(
        MODEL_PATH,
        compile=False,  #thisll ignore optimizer, loss, training state in model as theyre not required for prediction
        custom_objects={"preprocess_input": preprocess_input}  #thisll store the preprocess func from the saved model if found
    )

''' added custom_objects and compile because if you load model directly it was crashing while finding the inbuilt preproc func'''

#save the class name order
@lru_cache(maxsize=1)
def get_class_names():
    with open(CLASS_NAMES_PATH, "r") as f:
        return json.load(f)


def prepare_image(image_file):
    """Convert uploaded image into model-ready format."""

    #as in model training tf.keras.preprocessing.image_dataset_from_directory(...)this is converting to rgb so req in backend
    image = Image.open(image_file).convert("RGB")
    
    image = image.resize(IMG_SIZE)

    image_array = np.array(image)
    image_array = np.expand_dims(image_array, axis=0)

    return image_array


# main cnn logic
def predict_faulty_product(image_file):
    model = get_model()
    class_names = get_class_names()

    image_array = prepare_image(image_file)

    predictions = model.predict(image_array, verbose=0)[0] 
    good_prob = predictions
    faulty_prob = 1 - predictions

    if predictions > 0.5:
        label = "good"
        confidence = good_prob
    else:
        label = "faulty"
        confidence = faulty_prob
    
    return {
        "label": label,
        "is_faulty": label == "faulty",
        "confidence": confidence,
        "message": "Product is faulty" if label == "faulty" else "Product is fine"
    }
