"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductsByIds, getWishlist, removeWishlistItem, saveWishlistItem, type UserProfile } from "@/lib/api";
import { Product } from "@/lib/data";

type CartMap = Record<string, number>;

const CART_KEY = "zepto-cart";
const WISHLIST_KEY = "zepto-wishlist";
const USER_KEY = "zepto-user";
const STORE_EVENT = "zepto-store-change";

const defaultCart: CartMap = {};
const defaultWishlist: string[] = [];

type StoredUser = {
  userId: number;
  profile?: UserProfile;
};

let serverWishlistUserId: number | null = null;
let serverWishlistProducts: Product[] | null = null;
let serverWishlistPromise: Promise<Product[]> | null = null;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(STORE_EVENT));
}

function loadServerWishlist(userId: number) {
  if (serverWishlistUserId === userId && serverWishlistProducts) {
    return Promise.resolve(serverWishlistProducts);
  }

  if (serverWishlistUserId === userId && serverWishlistPromise) {
    return serverWishlistPromise;
  }

  serverWishlistUserId = userId;
  serverWishlistPromise = getWishlist(userId)
    .then((products) => {
      serverWishlistProducts = products;
      return products;
    })
    .finally(() => {
      serverWishlistPromise = null;
    });

  return serverWishlistPromise;
}

function invalidateServerWishlistCache(userId: number) {
  if (serverWishlistUserId !== userId) return;
  serverWishlistProducts = null;
  serverWishlistPromise = null;
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const sync = () => setValue(readJson(key, fallback));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(STORE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(STORE_EVENT, sync);
    };
  }, [fallback, key]);

  const setStoredValue = (nextValue: T) => {
    setValue(nextValue);
    writeJson(key, nextValue);
  };

  return [value, setStoredValue] as const;
}

export function useCart() {
  const [cart, setCart] = useStoredState<CartMap>(CART_KEY, defaultCart);
  const [products, setProducts] = useState<Product[]>([]);
  const productIds = useMemo(() => Object.keys(cart).filter((id) => cart[id] > 0), [cart]);

  useEffect(() => {
    let active = true;

    if (!productIds.length) {
      setProducts([]);
      return;
    }

    getProductsByIds(productIds)
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, [productIds.join(",")]);

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => ({
          productId,
          quantity,
          product: products.find((product) => product.id === productId)
        }))
        .filter((item) => item.product && item.quantity > 0),
    [cart, products]
  );
  const itemCount = useMemo(
    () => Object.values(cart).reduce((total, quantity) => total + quantity, 0),
    [cart]
  );

  const addItem = (productId: string) => {
    setCart({ ...cart, [productId]: (cart[productId] ?? 0) + 1 });
  };

  const removeOne = (productId: string) => {
    const nextQuantity = (cart[productId] ?? 0) - 1;
    const nextCart = { ...cart };
    if (nextQuantity > 0) nextCart[productId] = nextQuantity;
    else delete nextCart[productId];
    setCart(nextCart);
  };

  const removeItem = (productId: string) => {
    const nextCart = { ...cart };
    delete nextCart[productId];
    setCart(nextCart);
  };

  return { cart, items, itemCount, addItem, removeOne, removeItem };
}

export function useUser() {
  const [user, setUser] = useStoredState<StoredUser | null>(USER_KEY, null);

  const setCurrentUser = (nextUser: StoredUser) => setUser(nextUser);
  const clearUser = () => setUser(null);

  return {
    user,
    userId: user?.userId ?? null,
    profile: user?.profile ?? null,
    setCurrentUser,
    clearUser,
  };
}

export function useWishlist() {
  const [wishlist, setWishlist] = useStoredState<string[]>(WISHLIST_KEY, defaultWishlist);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const { userId } = useUser();

  useEffect(() => {
    let active = true;

    if (userId) {
      loadServerWishlist(userId)
        .then((products) => {
          if (!active) return;
          const productIds = products.map((product) => product.id);
          setWishlistProducts(products);
          if (wishlist.join(",") !== productIds.join(",")) {
            setWishlist(productIds);
          }
        })
        .catch(() => {
          if (active) setWishlistProducts([]);
        });
    } else if (wishlist.length) {
      getProductsByIds(wishlist)
        .then((products) => {
          if (active) setWishlistProducts(products);
        })
        .catch(() => {
          if (active) setWishlistProducts([]);
        });
    } else {
      setWishlistProducts([]);
    }

    return () => {
      active = false;
    };
  }, [userId, wishlist.join(",")]);

  const toggleWishlist = (productId: string) => {
    const wished = wishlist.includes(productId);
    setWishlist(wished ? wishlist.filter((id) => id !== productId) : [...wishlist, productId]);

    if (userId) {
      invalidateServerWishlistCache(userId);
      const request = wished
        ? removeWishlistItem(userId, productId)
        : saveWishlistItem(userId, productId);

      request.catch(() => {
        setWishlist(wishlist);
      });
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  return { wishlist, wishlistProducts, toggleWishlist, isWishlisted };
}
