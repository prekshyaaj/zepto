// lib/api.ts
// Central place for ALL frontend → backend communication.
//
// Flow:
// page/component -> function here -> FastAPI backend -> Supabase / ML models
//
// Benefits:
// 1. Keeps pages/components clean
// 2. Backend URL can change in one place
// 3. Frontend never touches secrets directly
// 4. Converts backend data into frontend-friendly shape

import type { Product } from "@/lib/data";

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (
    configuredUrl === "https://huggingface.co/spaces/Prekshya/zepto_backend" ||
    configuredUrl === "https://huggingface.co/spaces/Prekshya/zepto_backend/"
  ) {
    return "https://prekshya-zepto-backend.hf.space";
  }

  return (configuredUrl || "https://prekshya-zepto-backend.hf.space").replace(/\/+$/, "");
}

const BASE_URL = getApiBaseUrl();

const FALLBACK_IMAGE = "https://placehold.co/600x600";

// ─────────────────────────────────────────────
// Backend response types
// ─────────────────────────────────────────────

type ApiProduct = {
  product_id: number;
  product_name: string;
  aisle_id?: number | null;
  department_id?: number | null;
  image_url?: string | null;
  price?: number | null;
  rating?: number | null;
};

type RecommendationPayload = {
  recommendations?: ApiProduct[];
};

export type UserProfile = {
  user_id: number;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  last_login?: string | null;
  is_active?: boolean | number | null;
  cluster_name?: string | null;
};

export type OrderItemPayload = {
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
};

export type OrderPayload = {
  order_id: string | number;
  user_id: number;
  address?: string;
  payment_method?: string;
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  total?: number;
  status: string;
  eta?: string;
  items?: OrderItemPayload[];
  products?: Product[];
  order_number?: number;
  order_dow?: number;
  order_hour_of_day?: number;
  days_since_prior_order?: string | number | null;
};

export type ApiDepartment = {
  department_id: number;
  department: string;
  image_url?: string | null;
};

// ─────────────────────────────────────────────
// Mapper functions
// Converts backend data -> frontend Product shape
// ─────────────────────────────────────────────

function mapApiProduct(product: ApiProduct): Product {
  return {
    id: String(product.product_id),
    name: product.product_name,

    brand: "Instacart",

    image: product.image_url || FALLBACK_IMAGE,

    price: Number(product.price ?? 99),

    discountPercent: 0,

    category: "Grocery",

    department: String(product.department_id ?? ""),

    aisle: String(product.aisle_id ?? ""),

    weight: "1 unit",

    rating: Number(product.rating ?? 4.2),

    delivery: "10 min",

    description: product.product_name,

    orders: 9000,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${path}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Product APIs
// ─────────────────────────────────────────────

export async function getProducts(
  limit = 100,
  offset = 0,
  query?: string
): Promise<Product[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (query?.trim()) params.set("query", query.trim());

  const data = await apiFetch<ApiProduct[]>(`/products?${params.toString()}`);
  return data.map(mapApiProduct);
}

export async function searchProducts(query: string, limit = 40): Promise<Product[]> {
  return getProducts(limit, 0, query);
}

export async function getProduct(productId: string | number): Promise<Product> {
  const data = await apiFetch<ApiProduct>(`/products/${productId}`);
  return mapApiProduct(data);
}

export async function getProductsByIds(productIds: Array<string | number>): Promise<Product[]> {
  const ids = productIds.map((id) => Number(id)).filter(Number.isFinite);
  if (!ids.length) return [];

  const data = await apiFetch<ApiProduct[]>("/products/by-ids", {
    method: "POST",
    body: JSON.stringify(ids),
  });

  return data.map(mapApiProduct);
}

export async function getProductsByDepartment(
  departmentId: number,
  limit = 100,
  offset = 0
): Promise<Product[]> {
  const data = await apiFetch<ApiProduct[]>(
    `/departments/${departmentId}/products?limit=${limit}&offset=${offset}`
  );
  return data.map(mapApiProduct);
}

// ─────────────────────────────────────────────
// Department APIs
// ─────────────────────────────────────────────

export async function getDepartments(): Promise<ApiDepartment[]> {
  return apiFetch<ApiDepartment[]>("/departments");
}

// ─────────────────────────────────────────────
// Recommendation APIs
// ─────────────────────────────────────────────

export async function getProductRecommendations(
  productId: number,
  k = 5
): Promise<Product[]> {
  const data = await apiFetch<RecommendationPayload>(`/recommend/${productId}?k=${k}`);
  return (data.recommendations ?? []).map(mapApiProduct);
}

export async function getUserRecommendations(
  userId: number
): Promise<Product[]> {
  const data = await apiFetch<RecommendationPayload>(`/recommend/user/${userId}/products`);
  return (data.recommendations ?? []).map(mapApiProduct);
}

export async function getBuyAgain(userId: number): Promise<Product[]> {
  const data = await apiFetch<RecommendationPayload>(`/users/${userId}/buy-again`);
  return (data.recommendations ?? []).map(mapApiProduct);
}

export async function getMarketBasketRecommendations(productIds: Array<string | number>): Promise<Product[]> {
  const ids = productIds.map((id) => Number(id)).filter(Number.isFinite);
  if (!ids.length) return [];

  const data = await apiFetch<RecommendationPayload>("/mba/recommend", {
    method: "POST",
    body: JSON.stringify({ product_ids: ids }),
  });

  return (data.recommendations ?? []).map(mapApiProduct);
}

// ─────────────────────────────────────────────
// Recipe RAG APIs
// ─────────────────────────────────────────────

export async function getRecipeSuggestions(
  dish: string
) {
  return apiFetch("/chatbot/recipe", {
    method: "POST",
    body: JSON.stringify({ dish }),
  });
}

// ─────────────────────────────────────────────
// OCR APIs
// ─────────────────────────────────────────────

export async function scanProductExpiry(
  imageFile: File
) {
  const formData = new FormData();

  formData.append("file", imageFile);

  return apiFetch("/chatbot/expiry-check", {
    method: "POST",
    body: formData,
  });
}

// ─────────────────────────────────────────────
// CNN Image Classification APIs
// ─────────────────────────────────────────────

export async function classifyProductImage(
  imageFile: File
) {
  const formData = new FormData();

  formData.append("image", imageFile);

  return apiFetch("/chatbot/faulty-product", {
    method: "POST",
    body: formData,
  });
}

export async function login(identifier: string): Promise<{ userId: number; user: UserProfile }> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function signup(details: { email: string; phone?: string; password: string }): Promise<{ userId: number; user: UserProfile }> {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${userId}`);
}

export async function getWishlist(userId: number): Promise<Product[]> {
  const data = await apiFetch<ApiProduct[]>(`/users/${userId}/wishlist`);
  return data.map(mapApiProduct);
}

export async function saveWishlistItem(userId: number, productId: string) {
  return apiFetch(`/users/${userId}/wishlist/${productId}`, { method: "POST" });
}

export async function removeWishlistItem(userId: number, productId: string) {
  return apiFetch(`/users/${userId}/wishlist/${productId}`, { method: "DELETE" });
}

export async function createOrder(order: Omit<OrderPayload, "order_id" | "status" | "eta">): Promise<OrderPayload> {
  return apiFetch<OrderPayload>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getOrder(orderId: string): Promise<OrderPayload> {
  return apiFetch<OrderPayload>(`/orders/${orderId}`);
}

export async function getOrderStatus(orderId: string): Promise<Pick<OrderPayload, "order_id" | "status">> {
  return apiFetch<Pick<OrderPayload, "order_id" | "status">>(`/orders/${orderId}/status`);
}

export async function getOrderHistory(userId: number): Promise<OrderPayload[]> {
  const orders = await apiFetch<Array<Omit<OrderPayload, "items" | "products"> & { items?: Array<OrderItemPayload & { product?: ApiProduct }> }>>(`/users/${userId}/orders`);

  return orders.map((order) => ({
    ...order,
    order_id: String(order.order_id),
    items: (order.items ?? []).map((item) => ({
      ...item,
      quantity: item.quantity ?? 1,
      price: item.price ?? Number(item.product?.price ?? 0),
      product: item.product ? mapApiProduct(item.product) : undefined,
    })),
  }));
}
