'''
this is supposed to:

1.send prompt to OpenRouter
2.receive AI response
3.return generated recipe text back to service layer

'''

import json
import os
import requests
from dotenv import load_dotenv


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def call_openrouter(system_prompt, user_message):
    """Send prompts to OpenRouter and return the model text."""

    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set")

    #payload is the python dict with the info we want to send to llm
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},  #both prompts alr defined in recipe service 
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.4,  #temp controls how random the LLM response should be so lower temp -> consistent response, as required
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        # send POST request to OpenRouter API and wait maximum 20 sec for response
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=20
        )

        response.raise_for_status()

        response_data = response.json()

        # read API response → decode JSON → extract model output
        return response_data["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        raise RuntimeError("OpenRouter request timed out")

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"OpenRouter request failed: {str(e)}")