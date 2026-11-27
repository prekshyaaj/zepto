# loading app and routers

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(".env"))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes import chatbot, market_basket, orders, products, recommendations, users


app = FastAPI(
    title="Zepto",
    version= "1.0"
)

# CORS : this is if backend is using port 8000 and frontend onn 3000 so itll prevent the clash
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#routers
app.include_router(recommendations.router)
app.include_router(chatbot.router)
app.include_router(market_basket.router)
app.include_router(products.router)
app.include_router(users.router)
app.include_router(orders.router)


@app.get("/")
def greet():
    return {"message": "API is running"}



    
