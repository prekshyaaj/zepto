import Image from "next/image";
import { notFound } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { ProductAddToCart, ProductWishlistButton } from "@/components/product-detail-actions";
import { ProductRow } from "@/components/product-row";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { getMarketBasketRecommendations, getProduct, getProductRecommendations } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn, formatCurrency, getDiscountPrice } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  let product: Awaited<ReturnType<typeof getProduct>>;

  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  const salePrice = getDiscountPrice(product.price, product.discountPercent);
  const [similar, bundle] = await Promise.all([
    getProductRecommendations(Number(product.id), 6).catch(() => []),
    getMarketBasketRecommendations([product.id]).catch(() => []),
  ]);

  return (
    <PageShell className="space-y-5 pb-36">
      <BackHeader title="Product Details" href="/home" />
      <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-primary-light">
        <Image src={product.image} alt={product.name} fill className="object-cover" priority sizes="420px" />
        <ProductWishlistButton productId={product.id} productName={product.name} />
      </div>
      <section className="space-y-3">
        <div>
          <p className="text-sm font-bold text-coral">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink">{product.name}</h1>
          <p className="mt-1 text-sm font-semibold text-muted">{product.weight}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xl font-extrabold">{formatCurrency(salePrice)}</p>
            {product.discountPercent > 0 ? <span className="rounded-pill bg-coral-light px-3 py-1 text-xs font-extrabold text-coral">{product.discountPercent}% OFF</span> : null}
          </div>
        </div>
      </section>
      <Accordion defaultValue="description">
        <AccordionItem value="description" title="Description">{product.description}</AccordionItem>
      </Accordion>
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>Similar Products</h2>
        {similar.length > 0 ? <ProductRow products={similar} /> : <p className="text-sm font-semibold text-muted">No similar products found.</p>}
      </section>
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>Frequently bought together</h2>
        {bundle.length > 0 ? <ProductRow products={bundle} /> : <p className="text-sm font-semibold text-muted">No basket recommendations found.</p>}
      </section>
      <ProductAddToCart productId={product.id} />
    </PageShell>
  );
}
