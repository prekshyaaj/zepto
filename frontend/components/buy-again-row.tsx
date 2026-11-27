"use client";

import { useEffect, useState } from "react";
import { ProductRow } from "@/components/product-row";
import { SectionHeader } from "@/components/section-header";
import { getBuyAgain } from "@/lib/api";
import { Product } from "@/lib/data";
import { useUser } from "@/lib/store";

export function BuyAgainRow() {
  const { userId } = useUser();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    if (!userId) {
      setProducts([]);
      return;
    }

    getBuyAgain(userId)
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (!userId || products.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="Buy again" />
      <ProductRow products={products} />
    </section>
  );
}
