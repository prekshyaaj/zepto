"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { ProductRow } from "@/components/product-row";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getProductsByIds, getRecipeSuggestions } from "@/lib/api";
import { Product } from "@/lib/data";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const suggestions = ["Pasta", "Sandwich", "Pizza", "Paneer Curry", "Biryani", "Healthy Meal"];

export default function RecipeAssistantPage() {
  const [query, setQuery] = useState("");
  const [recipe, setRecipe] = useState<any | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const runRecipe = async (dish: string) => {
    const cleanDish = dish.trim();
    if (!cleanDish) return;

    setLoading(true);
    setRecipe(null);
    setRecommendedProducts([]);

    try {
      const response: any = await getRecipeSuggestions(cleanDish);
      setRecipe(response);
      const productIds = (response.matched_products ?? [])
        .flatMap((match: any) => match.available_products ?? [])
        .map((product: any) => product.product_id)
        .filter(Boolean);
      setRecommendedProducts(await getProductsByIds(productIds));
    } finally {
      setLoading(false);
    }
  };

  const submitRecipe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runRecipe(query);
  };

  const currentRecipe = recipe?.recipe;

  return (
    <PageShell className="space-y-5 pb-36">
      <BackHeader title="Recipe Assistant" href="/ai" />
      <form onSubmit={submitRecipe} className="flex items-center gap-3">
        <div className={cn(ui.input, "flex h-14 min-w-0 flex-1 items-center gap-3 px-4")}>
        <Sparkles className="h-5 w-5 text-primary" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Gopi Bahu for a recipe" className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted" />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="h-14 shrink-0 rounded-md bg-primary px-6 text-base font-extrabold text-surface shadow-floating disabled:opacity-60">
          Go
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => { setQuery(suggestion); void runRecipe(suggestion); }} className="rounded-pill border border-border bg-surface px-3 py-2 text-sm font-bold">{suggestion}</button>
        ))}
      </div>
      <AnimatePresence>
        {loading ? (
          <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
            <ChefHat className="h-12 w-12 text-primary" />
            <p className="text-base font-extrabold">Cooking up a real recipe...</p>
          </section>
        ) : currentRecipe ? (
          <motion.section className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <article className={cn(ui.floating, "overflow-hidden")}>
              <div className="space-y-3 p-4">
                <h2 className="text-xl font-extrabold">{currentRecipe.recipe_name || query}</h2>
                <div className="flex gap-2 text-xs font-extrabold text-primary">
                  {[currentRecipe.servings].filter(Boolean).map((item) => <span key={item} className="rounded-pill bg-primary-light px-3 py-1">{item}</span>)}
                </div>
              </div>
            </article>
            <section className="space-y-3">
              <h2 className={ui.sectionTitle}>Ingredients</h2>
              <p className={cn(ui.card, "p-4 text-sm font-semibold leading-6 text-ink")}>
                {currentRecipe.ingredients.map((item: any, index: number) => (
                  <span key={`${item.name}-${index}`}>{item.quantity ? `${item.quantity} ` : ""}{item.name}{index === currentRecipe.ingredients.length - 1 ? "." : ", "}</span>
                ))}
              </p>
            </section>
            <section className="space-y-3">
              <h2 className={ui.sectionTitle}>Recipe</h2>
              <Accordion>
                {currentRecipe.recipe_steps.map((step: string, index: number) => (
                  <AccordionItem key={step} value={`step-${index}`} title={`Step ${index + 1}`}>{step}</AccordionItem>
                ))}
              </Accordion>
            </section>
            <section className="space-y-3">
              <h2 className={ui.sectionTitle}>Recommended Products</h2>
              {recommendedProducts.length > 0 ? <ProductRow products={recommendedProducts} /> : <p className="text-sm font-semibold text-muted">No matching products found.</p>}
            </section>
          </motion.section>
        ) : (
          <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
            <ChefHat className="h-12 w-12 text-primary" />
            <p className="text-base font-extrabold">Pick a craving to start</p>
          </section>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
