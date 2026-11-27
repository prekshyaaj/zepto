import Image from "next/image";
import Link from "next/link";
import { BackHeader } from "@/components/back-header";
import { FilterableProductGrid } from "@/components/filterable-product-grid";
import { PageShell } from "@/components/page-shell";
import { getDepartments, getProducts, getProductsByDepartment } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type CategoryPageProps = {
  searchParams: Promise<{ department?: string; aisle?: string; type?: string }>;
};

export default async function CategoryPage({ searchParams }: CategoryPageProps) {
  const params = await searchParams;

  const departments = await getDepartments();

  const department =
    departments.find(
      (item: any) => String(item.department_id) === params.department
    ) ??
    departments.find(
      (item: any) =>
        item.department.toLowerCase() === params.type
    );

  const visibleProducts = department
    ? await getProductsByDepartment(Number(department.department_id), 100)
    : await getProducts(100);

  if (!department) {
    return (
      <PageShell className="space-y-5">
        <BackHeader title="Departments" />

        <section className="grid grid-cols-2 gap-3">
          {departments.map((item: any) => (
            <Link
              key={item.department_id}
              href={`/category?department=${item.department_id}`}
              className={cn(ui.card, "overflow-hidden")}
            >
              <div className="relative h-28">
                <Image
                  src={item.image_url ?? "https://placehold.co/300x200"}
                  alt={item.department}
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>

              <div className="p-3">
                <h2 className="text-base font-extrabold">
                  {item.department}
                </h2>
              </div>
            </Link>
          ))}
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <BackHeader title={department.department} />

      <section className="space-y-4">
        <div className="relative h-32 overflow-hidden rounded-md bg-primary-light">
          <Image
            src={department.image_url ?? "https://placehold.co/600x300"}
            alt={department.department}
            fill
            className="object-cover"
            sizes="260px"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/10" />

          <div className="absolute inset-0 flex flex-col justify-end p-4 text-surface">
            <p className="text-xs font-extrabold uppercase tracking-normal">
              Department
            </p>

            <h1 className="text-xl font-extrabold">
              {department.department}
            </h1>
          </div>
        </div>

        <FilterableProductGrid products={visibleProducts} />
      </section>
    </PageShell>
  );
}
