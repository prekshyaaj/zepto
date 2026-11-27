import cv2 # type: ignore
import base64
import requests
import re
import calendar
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ---------------- PREPROCESS ----------------
def preprocess(image_path):
    
    img = cv2.imread(image_path)  # load image
    if img is None:
        raise ValueError("Image could not be read. Please upload a valid image file.")

    # convert to grayscale (removes color noise)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # upscale image → helps OCR read small / curved text
    gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    # slight blur → smoothens noise, improves text clarity
    gray = cv2.GaussianBlur(gray, (3,3), 0)

    return gray


# ---------------- ENCODE IMAGE ----------------
def encode_image(img):
    """
    Converts image → base64 string so it can be sent to API
    """

    _, buffer = cv2.imencode('.png', img)  # convert image to PNG format and stores as binary bytes
    return base64.b64encode(buffer).decode()  # encode to base64 string so that api can understand the image


# ---------------- LLM OCR ----------------
def extract_text_llm(image_path):
    """
    Sends image to LLM for OCR extraction
    """

    processed_img = preprocess(image_path)  # clean image
    base64_img = encode_image(processed_img)  # encode image

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {                                             #this is basically for -> Hey API, I’m this user — let me in
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # VERY STRICT OCR PROMPT (forces model to not hallucinate)
    prompt = """
You are a HIGH-PRECISION OCR system specialized in curved and distorted text.

Extract ALL visible text exactly as seen.

DO NOT summarize.
DO NOT correct spelling.
DO NOT assume missing characters.

Return RAW text only.
"""

    # request body that is describing what task to perform
    data = {
        "model": "openai/gpt-4o-mini",      #use this model
        "max_tokens": 500,                  #OCR output is short, so keep token usage low
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt}, #my ocr instructions here
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_img}" #sending img encoded as base 64 so were telling to decode this n read it
                        }
                    }
                ]
            }
        ]
    }

    # send request to API
    response = requests.post(url, headers=headers, json=data)
    try:
        result = response.json()
    except ValueError:
        raise RuntimeError("OCR service returned an unreadable response")

    # OpenRouter returns an "error" object instead of "choices" when the
    # request fails. Without this check, the API route crashes with a vague 500.
    if "choices" not in result:
        error_message = result.get("error", {}).get("message", "OCR service did not return text")
        raise RuntimeError(error_message)

    # extract OCR text from response
    return result["choices"][0]["message"]["content"]  
''' 
note: this is result["choices"]:
 [
  {
    "message": {
      "content": "full OCR extracted text"
    }
  }
] so this return the FULL OCR TEXT, not just dates
'''
 
# ---------------- DATE EXTRACTION ----------------  (via regex)
def add_date_safely(dates, year, month, day):
    """
    Adds a date, correcting only impossible month-end OCR dates.
    Example: 31/09/23 is not a real date, so treat it as 30/09/23.
    """
    try:
        dates.append(datetime(year, month, day)) # If date is valid → use it directly (e.g., 12/05/2024)
    except ValueError:
        if 1 <= month <= 12:
            last_day = calendar.monthrange(year, month)[1]
            # If invalid like 31/09/2023 → clamp to last valid day (30/09/2023)
            if day > last_day and day <= 31:
                dates.append(datetime(year, month, last_day))

def extract_dates(text):
    """
    Extracts ALL possible dates from OCR text

    Covers:
    1. 12/05/2025 or 12-05-2025 or 12.05.2025
    2. Dec 2026
    3. 17 Feb 2026
    4. Feb 17, 2026
    """

    dates = []

    # ---------- 1. Numeric Dates ----------
    # Covers: 12/05/2025, 12-05-2025, 12.05.2025 (year can be 2 digit or 4 both)
    numeric_matches = re.findall(
        r"(\d{1,2})\s*[\.\-/]\s*(\d{1,2})\s*[\.\-/]\s*(\d{2}|\d{4})", 
        #(number) separator (number) separator (year); d{1,2} this means take 2 digit, then 2 more, then 4 for year, and [\.\-/] these are separators
        text
    )
    
    #below will return like: [("12", "05", "24"), ("01", "09", "2025")]
    for m in numeric_matches:
        try:
            day, month, year = map(int, m)
            # Labels often print dates like 11/03/24. Convert 2-digit years
            # to 20xx so expiry comparisons work for modern packaged goods.
            if year < 100:
                year += 2000
            add_date_safely(dates, year, month, day)
        except:
            pass  


    # ---------- 2. Month + Year ----------
    # Covers: Dec 2026, Jul. 2025, September 2024
    month_map = {
        "jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
        "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12
    }

    text_lower = text.lower()

    month_matches = re.findall(
        # Only match month-year dates like "JAN 2024" when there is no day
        # directly before the month. This prevents "16 JAN 2024" from also
        # becoming a fake extra date "28 JAN 2024".
        r"(?<!\d\s)(?<!\d)\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b",
        text_lower
    )

    for m in month_matches:
        try:
            month = month_map[m[0][:3]]
            year = int(m[1])

            # assume end of month for expiry
            last_day = calendar.monthrange(year, month)[1]
            dates.append(datetime(year, month, last_day))
        except:
            pass


    # ---------- 3. Day Month Year ----------
    # Covers: 17 Feb 2026
    dmy_text_matches = re.findall(
        r"\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})\b",
        text_lower
    )

    for d, m, y in dmy_text_matches:
        try:
            add_date_safely(dates, int(y), month_map[m], int(d))
        except:
            pass


    # ---------- 4. Month Day, Year ----------
    # Covers: Feb 17, 2026
    mdy_text_matches = re.findall(
        r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2}),?\s*(\d{4})\b",
        text_lower
    )

    for m, d, y in mdy_text_matches:
        try:
            add_date_safely(dates, int(y), month_map[m], int(d))
        except:
            pass


    return dates

# ---------------- EXPIRY LOGIC ----------------
def find_expiry(dates):
    """
    Finds the most likely expiry date
    Logic:
    - remove unrealistic dates
    - pick latest date as expiry
    """

    if not dates:
        return None

    today = datetime.today()  #extract current date

    # remove weird dates (like 1999 or 2099)
    dates = [d for d in dates if d.year > 2000 and d.year < today.year + 5]

    if not dates:
        return None

    # sort dates chronologically
    dates.sort()

    print("\n Sorted Dates:")
    for d in dates:
        print(d.strftime("%d-%m-%Y"))

    # latest date = expiry 
    return dates[-1]


# ---------------- MAIN ----------------
def check_expiry(image_path):
    """
    Full pipeline:
    Image → OCR → Extract Dates → Detect Expiry
    """

    try:
        text = extract_text_llm(image_path)
    except Exception as e:
        # Return the OCR problem as the API result instead of letting FastAPI
        # turn it into a generic "Internal Server Error" page.
        return f" OCR error: {e}"

    print("\n OCR TEXT:\n", text)

    dates = extract_dates(text)

    print("\n Found Dates:", [d.strftime("%d-%m-%Y") for d in dates])

    expiry = find_expiry(dates)

    if not expiry:
        return " No expiry detected"

    # compare with current date
    if expiry < datetime.today():
        return f" Expired: {expiry.strftime('%d %b %Y')}"
    else:
        return f" Valid until: {expiry.strftime('%d %b %Y')}"
