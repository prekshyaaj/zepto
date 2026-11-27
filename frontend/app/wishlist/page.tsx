"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const { wishlistProducts } = useWishlist();

  return (
    <PageShell className="space-y-5">
      <BackHeader title="Favourite picks" />
      {wishlistProducts.length > 0 ? (
        <ProductGrid products={wishlistProducts} />
      ) : (
        <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
          <Heart className="h-14 w-14 text-coral" />
          <h2 className={ui.sectionTitle}>No favourites yet</h2>
          <p className="text-sm font-semibold text-muted">Tap the heart on any product to keep it here.</p>
          <Link href="/home"><Button>Browse Products</Button></Link>
        </section>
      )}
    </PageShell>
  );
}
