import { ProductCard } from "@/components/product-card";
import { Product } from "@/lib/data";

export function ProductRow({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {products.map((product) => (
        <div key={product.id} className="w-40 shrink-0">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}
