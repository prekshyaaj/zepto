import Link from "next/link";
import { Category } from "@/lib/data";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const departmentByCategory: Record<string, string> = {
  Fruits: "fresh-produce",
  Dairy: "fresh-produce",
  Bakery: "bakery",
  Snacks: "snacks-drinks",
  Drinks: "snacks-drinks",
  Staples: "staples",
  Fresh: "fresh-produce",
  Home: "household"
};

export function CategoryChips({ categories }: { categories: Category[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Link key={category.id} href={`/category?department=${departmentByCategory[category.label] ?? "fresh-produce"}`} className={cn(ui.pill, "flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-bold")}>
            <span className="grid h-8 w-8 place-items-center rounded-pill bg-primary-light text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
