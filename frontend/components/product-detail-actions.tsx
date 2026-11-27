"use client";

import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart, useWishlist } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProductWishlistButton({ productId, productName }: { productId: string; productName: string }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(productId);

  return (
    <button
      onClick={() => toggleWishlist(productId)}
      className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-pill bg-surface/95 text-coral shadow-floating"
      aria-label={wished ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
    >
      <Heart className={cn("h-5 w-5", wished ? "fill-coral" : "")} />
    </button>
  );
}

export function ProductAddToCart({ productId }: { productId: string }) {
  const { cart, itemCount, addItem, removeOne } = useCart();
  const quantity = cart[productId] ?? 0;

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 bg-surface/95 px-4 py-4 shadow-floating backdrop-blur">
      <Link href="/cart" className="relative grid h-14 w-14 shrink-0 place-items-center rounded-md border border-border bg-surface text-ink shadow-card" aria-label={`Open cart with ${itemCount} items`}>
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-pill bg-coral px-1 text-xs font-extrabold text-surface">
            {itemCount}
          </span>
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        {quantity > 0 ? (
          <div className="flex h-14 items-center overflow-hidden rounded-md bg-primary text-surface shadow-floating">
            <button onClick={() => removeOne(productId)} className="grid h-14 flex-1 place-items-center" aria-label="Remove one from cart">
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-20 text-center text-base font-extrabold">{quantity}</span>
            <button onClick={() => addItem(productId)} className="grid h-14 flex-1 place-items-center" aria-label="Add one to cart">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Button onClick={() => addItem(productId)} className="h-14 w-full rounded-md bg-primary text-base font-extrabold text-surface shadow-floating">
            <Plus className="h-5 w-5" />
            Add to cart
          </Button>
        )}
      </div>
    </div>
  );
}
