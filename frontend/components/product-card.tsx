"use client";

import { motion } from "framer-motion";
import { Heart, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/data";
import { useCart, useWishlist } from "@/lib/store";
import { motion as motionTokens, ui } from "@/lib/tokens";
import { cn, formatCurrency, getDiscountPrice } from "@/lib/utils";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const salePrice = getDiscountPrice(product.price, product.discountPercent);
  const { cart, addItem, removeOne } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(product.id);
  const quantity = cart[product.id] ?? 0;

  return (
    <motion.article className="min-w-0 overflow-hidden rounded-md border border-border bg-surface p-2 shadow-card" {...motionTokens.card}>
      <div className="relative">
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-sm bg-[#F7F3F8]">
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="220px" />
          <span className="absolute left-2 top-2 rounded-sm bg-primary px-2 py-1 text-xs font-extrabold text-surface">{product.delivery}</span>
          </div>
        </Link>
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-pill bg-surface/95 text-coral shadow-card"
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={cn("h-4 w-4", wished ? "fill-coral" : "")} />
        </button>
      </div>
      <div className="space-y-2 pt-3">
        <div className="min-h-12">
          <h3 className={cn("line-clamp-2 font-extrabold text-ink", compact ? "text-sm" : "text-base")}>{product.name}</h3>
          <p className="mt-1 text-xs font-semibold text-muted">{product.weight}</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-muted">
          <Star className="h-3.5 w-3.5 fill-coral text-coral" />
          {product.rating} <span className="text-muted/80">({Math.round((product.orders ?? 9000) / 1000)}k)</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-extrabold text-[#25833D]">{formatCurrency(salePrice)}</p>
            {product.discountPercent > 0 ? <p className="text-xs font-semibold text-muted line-through">{formatCurrency(product.price)}</p> : null}
          </div>
          {quantity > 0 ? (
            <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-sm bg-coral text-surface">
              <button onClick={() => removeOne(product.id)} className="grid h-9 w-8 place-items-center" aria-label={`Remove one ${product.name}`}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-7 text-center text-sm font-extrabold">{quantity}</span>
              <button onClick={() => addItem(product.id)} className="grid h-9 w-8 place-items-center" aria-label={`Add one ${product.name}`}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => addItem(product.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-coral text-surface" aria-label={`Add ${product.name} to cart`}>
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
