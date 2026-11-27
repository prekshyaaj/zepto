import Link from "next/link";
import { BannerCarousel } from "@/components/banner-carousel";
import { BuyAgainRow } from "@/components/buy-again-row";
import { CategoryChips } from "@/components/category-chips";
import { PageShell } from "@/components/page-shell";
import { ProductRow } from "@/components/product-row";
import { RecommendedForUser } from "@/components/recommended-for-user";
import { SearchField } from "@/components/search-field";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import { getDepartments, getProducts, getProductsByDepartment } from "@/lib/api";
import { categories } from "@/lib/data";

export default async function HomePage() {
  const [products, departments] = await Promise.all([
    getProducts(40),
    getDepartments(),
  ]);

  const departmentSections = await Promise.all(
    departments.slice(0, 4).map(async (department) => ({
      department,
      products: await getProductsByDepartment(department.department_id, 8),
    }))
  );

  return (
    <PageShell className="space-y-5">
      <TopBar />
      <SearchField />
      <BannerCarousel />
      <CategoryChips categories={categories} />
      <RecommendedForUser />
      <BuyAgainRow />
      <section className="space-y-3">
        <SectionHeader title="Trending right now" action={<Link className="text-sm font-extrabold text-primary" href="/category">View all</Link>} />
        <ProductRow products={[...products].sort((a, b) => b.rating - a.rating).slice(0, 8)} />
      </section>
      <section className="space-y-3">
        <SectionHeader title="Shop by department" />
        <div className="grid grid-cols-2 gap-3">
          {departments.map((department) => (
            <Link key={department.department_id} href={`/category?department=${department.department_id}`} className="relative min-h-32 overflow-hidden rounded-md border border-border bg-surface p-3 shadow-card">
              <div className="absolute inset-0">
                <img src={department.image_url ?? "https://placehold.co/400x260"} alt="" className="h-full w-full object-cover opacity-30" />
              </div>
              <div className="relative flex h-full flex-col justify-end">
                <h3 className="text-base font-extrabold text-ink">{department.department}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {departmentSections.map(({ department, products }) => (
        <section key={department.department_id} className="space-y-3">
          <SectionHeader title={department.department} action={<Link className="text-sm font-extrabold text-primary" href={`/category?department=${department.department_id}`}>View all</Link>} />
          <ProductRow products={products} />
        </section>
      ))}
    </PageShell>
  );
}
