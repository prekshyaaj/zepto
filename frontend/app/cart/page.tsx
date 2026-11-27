"use client";

import { Heart, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { PageShell } from "@/components/page-shell";
import { ProductRow } from "@/components/product-row";
import { Button } from "@/components/ui/button";
import { getMarketBasketRecommendations, getUserRecommendations } from "@/lib/api";
import { Product } from "@/lib/data";
import { useCart, useUser } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn, formatCurrency, getDiscountPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, addItem, removeOne, removeItem } = useCart();
  const { userId } = useUser();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const productIds = items.map((item) => item.productId);
  const subtotal = items.reduce((total, item) => {
    if (!item.product) return total;
    return total + getDiscountPrice(item.product.price, item.product.discountPercent) * item.quantity;
  }, 0);
  const deliveryFee = items.length > 0 ? 19 : 0;
  const discount = Math.round(subtotal * 0.08);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  useEffect(() => {
    let active = true;

    Promise.all([
      getMarketBasketRecommendations(productIds).catch(() => []),
      userId ? getUserRecommendations(userId).catch(() => []) : Promise.resolve([]),
    ]).then(([basket, user]) => {
      if (!active) return;
      const seen = new Set(productIds);
      const merged = [...basket, ...user].filter((product) => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      });
      setSuggestions(merged.slice(0, 12));
    });

    return () => {
      active = false;
    };
  }, [productIds.join(","), userId]);

  return (
    <PageShell className="space-y-5 pb-36">
      <header className="flex items-center gap-3">
        <BackButton />
        <h1 className={cn(ui.title, "min-w-0 flex-1")}>Cart</h1>
        <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
          <Heart className="h-5 w-5 text-coral" />
        </Link>
        <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
          <Search className="h-5 w-5 text-primary" />
        </Link>
      </header>
      {items.length === 0 ? (
        <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
          <ShoppingBag className="h-14 w-14 text-primary" />
          <h2 className={ui.sectionTitle}>Your cart is empty</h2>
          <Link href="/home"><Button>Browse Products</Button></Link>
        </section>
      ) : (
        <>
          <section className="space-y-3">
            {items.map((item) => {
              if (!item.product) return null;
              const linePrice = getDiscountPrice(item.product.price, item.product.discountPercent) * item.quantity;
              return (
                <article key={item.productId} className={cn(ui.card, "flex gap-3 p-3")}>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-primary-light">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-extrabold">{item.product.name}</h2>
                        <p className="text-xs font-semibold text-muted">{item.product.weight}</p>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-muted" aria-label={`Remove ${item.product.name} from cart`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex h-10 items-center overflow-hidden rounded-sm border border-primary bg-primary-light text-primary">
                        <button onClick={() => removeOne(item.productId)} className="grid h-10 w-9 place-items-center" aria-label={`Remove one ${item.product.name}`}>
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-extrabold">{item.quantity}</span>
                        <button onClick={() => addItem(item.productId)} className="grid h-10 w-9 place-items-center" aria-label={`Add one ${item.product.name}`}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-base font-extrabold">{formatCurrency(linePrice)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
          <section className={cn(ui.card, "space-y-3 p-4")}>
            <h2 className={ui.sectionTitle}>Order Summary</h2>
            <div className="space-y-2 text-sm font-semibold">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Delivery fee</span><span>{formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-coral">-{formatCurrency(discount)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-extrabold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </section>
          <section className="space-y-3">
            <h2 className={ui.sectionTitle}>You might also like</h2>
            {suggestions.length > 0 ? <ProductRow products={suggestions} /> : <p className="text-sm font-semibold text-muted">No recommendations found for this cart.</p>}
          </section>
        </>
      )}
      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-md bg-surface/95 px-4 py-4 shadow-floating backdrop-blur">
          <Link href="/checkout"><Button className="w-full">Proceed to Checkout</Button></Link>
        </div>
      ) : null}
    </PageShell>
  );
}
