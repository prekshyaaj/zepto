"use client";

import { useMemo, useState } from "react";
import { FilterChips, type FilterChip } from "@/components/filter-chips";
import { ProductGrid } from "@/components/product-grid";
import type { Product } from "@/lib/data";

export function FilterableProductGrid({ products }: { products: Product[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");
  const visibleProducts = useMemo(() => {
    if (activeFilter === "Price") {
      return [...products].sort((first, second) => first.price - second.price);
    }

    if (activeFilter === "Rating") {
      return [...products].sort((first, second) => second.rating - first.rating);
    }

    return products;
  }, [activeFilter, products]);

  return (
    <>
      <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ProductGrid products={visibleProducts} />
    </>
  );
}
