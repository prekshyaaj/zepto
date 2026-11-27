"use client";

import { motion } from "framer-motion";
import { ChevronRight, ChefHat, Heart, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { motion as motionTokens, ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/ai/returns", title: "Product Return Help", subtitle: "Refund support for damaged or expired items", icon: RotateCcw },
  { href: "/ai/recipe", title: "Recipe Assistant", subtitle: "Ideas, ingredients and cart-ready recipes", icon: ChefHat }
];

export default function AiLandingPage() {
  return (
    <PageShell className="space-y-6">
      <header className="flex items-center gap-3">
        <h1 className={cn(ui.title, "min-w-0 flex-1")}>AI Assistant</h1>
        <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
          <Heart className="h-5 w-5 text-coral" />
        </Link>
        <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
          <Search className="h-5 w-5 text-primary" />
        </Link>
      </header>
      <section className="grid place-items-center pt-4 text-center">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="relative h-28 w-28 overflow-hidden rounded-pill bg-primary-light ring-8 ring-primary/10">
          <Image src="/assets/gopi-bahu.png" alt="Gopi Bahu" fill className="object-cover object-top" sizes="112px" priority />
        </motion.div>
        <div className={cn(ui.card, "mt-5 p-4 text-left")}>
          <p className="text-base font-bold">Hi, I'm Gopi Bahu, your AI assistant. How can I help?</p>
        </div>
      </section>
      <section className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="block">
              <motion.article className={cn(ui.card, "flex items-center gap-4 p-5")} {...motionTokens.card}>
                <span className="grid h-12 w-12 place-items-center rounded-sm bg-primary-light text-primary"><Icon className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-extrabold">{action.title}</span>
                  <span className="mt-1 block text-sm font-semibold text-muted">{action.subtitle}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-muted" />
              </motion.article>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
