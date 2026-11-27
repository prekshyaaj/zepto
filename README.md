# Zepto-inspired Grocery App with ML Recommendations

A quick-commerce grocery app built on the Instacart dataset. It recommends products, users and aisles with classic ML, and has an AI assistant that can suggest recipes, check expiry dates and detect damaged products from a photo.

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** FastAPI (Python 3.11), deployed with Docker on Hugging Face Spaces
- **Database:** Supabase (Postgres)
- **ML / AI:** scikit-learn, FP-Growth, TensorFlow (EfficientNet), FAISS, Sentence Transformers, OpenRouter LLMs

## Features

**Shopping**
- Browse by department and aisle, search, product pages
- Cart, checkout, order confirmation, order tracking and order history
- Wishlist, profile, sign up and log in
- "Buy again" row built from a user's past orders

**Recommendations**
| Feature | How it works |
|---|---|
| Similar products | KNN over product embeddings (`product_recomm.joblib`) |
| Similar users / "recommended for you" | KNN over user embeddings built from purchase history (`user_recomm.joblib`) |
| Frequently bought together | FP-Growth association rules mined at aisle level: cart products → their aisles → matching rules → top products from the recommended aisles |

**AI assistant**
| Feature | How it works |
|---|---|
| Recipe → shopping list | An LLM writes the recipe and its ingredients, then each ingredient is matched to real products with semantic search (MiniLM embeddings + FAISS index) |
| Expiry date check | Upload a photo of the label; a vision LLM reads the expiry date and the app says whether the product has expired |
| Damaged product check | Upload a photo; a CNN fine-tuned from EfficientNet classifies it as faulty or good |

## Project structure

```
backend/
  main.py                  FastAPI app and routers
  run_backend.py           Entry point (local dev and Docker)
  app/routes/              products, users, orders, recommendations, market_basket, chatbot
  app/recommender_model/   product, user and market-basket recommenders
  app/chatbot_model/       recipe RAG, expiry OCR, faulty-product CNN
  models/                  Trained models and the FAISS index
  data/                    CSV exports of the database tables
frontend/
  app/                     Next.js pages (home, category, product, cart, checkout, orders, ai, ...)
  components/              UI components
  lib/                     API client and cart store
recommender/               Notebooks: product KNN, user KNN, FP-Growth market basket
chatbot/                   Notebooks: CNN training, dataset de-duplication, OCR, recipe RAG
Dockerfile                 Backend image for Hugging Face Spaces
```

## Running locally

### 1. Database
Create a Supabase project and load the CSVs in `backend/data/` into tables with the same names (`products`, `users_final`, `orders_final`, `order_products_prior_final`). The app also expects `image_url`, `price` and `rating` columns on `products`, a `quantity` column on `order_products_prior_final`, and the `aisles`, `departments`, `products_with_aisles`, `aisle_association_rules` and `wishlists` tables.

### 2. Backend
```bash
cp .env.example .env        # fill in the values below
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/run_backend.py
```
The API runs at http://127.0.0.1:8000 and the interactive docs are at http://127.0.0.1:8000/docs.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only, never expose it to the browser) |
| `OPENROUTER_API_KEY` | OpenRouter key for the recipe and expiry features |
| `OPENROUTER_MODEL` | OpenRouter model to use (it must support images for the expiry check) |

### 3. Frontend
```bash
cd frontend
pnpm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
pnpm dev
```
Open http://localhost:3000.

### Docker
```bash
docker build -t zepto-backend .
docker run -p 7860:7860 --env-file .env zepto-backend
```

## API overview

| Area | Endpoints |
|---|---|
| Products | `GET /products`, `GET /products/search`, `GET /products/{id}`, `POST /products/by-ids`, `GET /departments`, `GET /aisles`, ... |
| Auth and users | `POST /auth/signup`, `POST /auth/login`, `GET /users/{id}`, wishlist endpoints |
| Orders | `POST /orders`, `GET /orders/{id}`, `GET /orders/{id}/status`, `GET /users/{id}/orders`, `GET /users/{id}/buy-again` |
| Recommendations | `GET /recommend/{product_id}`, `GET /recommend/user/{user_id}`, `GET /recommend/user/{user_id}/products`, `POST /recommend` (market basket) |
| AI assistant | `POST /chatbot/recipe`, `POST /chatbot/expiry-check`, `POST /chatbot/faulty-product` |

## Data

Product, order and aisle data come from the public [Instacart Market Basket Analysis](https://www.kaggle.com/c/instacart-market-basket-analysis) dataset. User accounts in `users_final.csv` are generated demo users, not real people.

## Disclaimer

This is a student project inspired by quick-commerce apps. It is not affiliated with or endorsed by Zepto.
