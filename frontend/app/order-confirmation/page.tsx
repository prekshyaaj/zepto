"use client";

import { motion } from "framer-motion";
import { Check, Heart, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { getOrder, type OrderPayload } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const id = orderId ?? window.localStorage.getItem("zepto-last-order-id");
    if (!id) return;
    getOrder(id).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  return (
    <PageShell className="space-y-5 pb-10">
      <header className="flex items-center justify-end gap-3">
        <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
          <Heart className="h-5 w-5 text-coral" />
        </Link>
        <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
          <Search className="h-5 w-5 text-primary" />
        </Link>
      </header>
      <section className={cn(ui.card, "w-full p-8 text-center")}>
        <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25 }} className="mx-auto grid h-24 w-24 place-items-center rounded-pill bg-primary-light text-primary">
          <motion.svg viewBox="0 0 48 48" className="h-14 w-14" initial="hidden" animate="visible">
            <motion.path d="M14 25.5 21 32l14-17" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }} transition={{ duration: 0.28 }} />
          </motion.svg>
        </motion.div>
        <h1 className="mt-6 text-2xl font-extrabold">Order placed</h1>
        <p className="mt-2 text-sm font-semibold text-muted">Order ID {order?.order_id ?? orderId ?? "Pending"}</p>
        <p className="mt-1 text-md font-extrabold text-primary">{order?.eta ?? order?.status ?? "Fetching order"}</p>
        <div className="mt-7 space-y-3">
          <Link href={`/tracking${order?.order_id ? `?orderId=${order.order_id}` : ""}`}><Button className="w-full"><Check className="h-4 w-4" />Track Order</Button></Link>
          <Link href="/home" className="block text-sm font-extrabold text-primary">Continue Shopping</Link>
        </div>
      </section>
    </PageShell>
  );
}
