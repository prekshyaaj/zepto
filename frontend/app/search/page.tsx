"use client";

import { LayoutGrid, SearchX } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { searchProducts } from "@/lib/api";
import { categories, recentSearches, type Product } from "@/lib/data";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async (value: string) => {
    const searchText = value.trim();
    setSubmitted(true);

    if (!searchText) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      setResults(await searchProducts(searchText));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(query);
  };

  // Run initial URL-driven search (used by the large search field handoff).
  useEffect(() => {
    if (initialQuery.trim()) {
      setQuery(initialQuery);
      void runSearch(initialQuery);
    }
  }, [initialQuery]);
  const showResults = submitted && !loading && results.length > 0;
  const showEmpty = submitted && !loading && results.length === 0;

  return (
    <PageShell className="space-y-5">
      <BackHeader title="Search" />
      <form onSubmit={submitSearch} className="flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search for groceries" className={cn(ui.input, "h-14 min-w-0 flex-1 px-4 font-semibold")} />
        <Button type="submit" className="h-14 px-4">Go</Button>
      </form>
      {!submitted ? (
        <>
          <section className="space-y-3">
            <h2 className={ui.sectionTitle}>Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item) => (
                <button key={item} onClick={() => { setQuery(item); void runSearch(item); }} className={cn(ui.pill, "px-4 py-2 text-sm font-bold")}>{item}</button>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className={ui.sectionTitle}>Popular Categories</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button key={category.id} className={cn(ui.card, "flex items-center gap-3 p-4 text-left font-bold")}>
                    <span className="grid h-10 w-10 place-items-center rounded-sm bg-primary-light text-primary"><Icon className="h-5 w-5" /></span>
                    {category.label}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
      {loading ? <p className="text-sm font-bold text-muted">Searching...</p> : null}
      {showResults ? <ProductGrid products={results} /> : null}
      {showEmpty ? (
        <div className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
          <SearchX className="h-12 w-12 text-primary" />
          <h2 className={ui.sectionTitle}>No results found</h2>
          <p className="text-sm font-semibold text-muted">Try milk, pasta, paneer or snacks.</p>
          <LayoutGrid className="h-8 w-8 text-coral" />
        </div>
      ) : null}
    </PageShell>
  );
}
