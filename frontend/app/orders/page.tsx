"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BackHeader } from "@/components/back-header";
import { OrderHistoryList } from "@/components/order-history-list";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { getOrderHistory, type OrderPayload } from "@/lib/api";
import { useUser } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const { userId } = useUser();
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    getOrderHistory(userId)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) {
    return (
      <PageShell className="space-y-5">
        <BackHeader title="Orders" />
        <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
          <h2 className={ui.sectionTitle}>Login required</h2>
          <Link href="/login"><Button>Login</Button></Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <BackHeader title="Orders" href="/profile" />
      {loading ? <p className="text-sm font-bold text-muted">Loading orders...</p> : <OrderHistoryList orders={orders} />}
    </PageShell>
  );
}
