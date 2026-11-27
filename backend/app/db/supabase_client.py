#this is Backend ↔ Supabase connection manager

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing"
    )

# Global reusable client ,  #flow: frontend->routes->service/recommender->supabase client->supabase db
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) 
