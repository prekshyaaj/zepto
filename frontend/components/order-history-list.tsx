"use client";

import { PackageCheck } from "lucide-react";
import { type OrderPayload } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function OrderHistoryList({ orders, emptyText = "No orders found for this user." }: { orders: OrderPayload[]; emptyText?: string }) {
  if (!orders.length) {
    return (
      <div className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
        <PackageCheck className="h-12 w-12 text-primary" />
        <p className="text-sm font-semibold text-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <article key={order.order_id} className={cn(ui.card, "p-4")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold">Order #{order.order_number ?? order.order_id}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">{order.items?.length ?? 0} items • {order.status}</p>
            </div>
            <span className="rounded-pill bg-primary-light px-3 py-1 text-xs font-extrabold text-primary">{order.order_hour_of_day ?? "--"}:00</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm font-semibold text-muted">
            {(order.items ?? [])
              .map((item) => item.product?.name)
              .filter(Boolean)
              .slice(0, 4)
              .join(", ") || "Products unavailable"}
          </p>
        </article>
      ))}
    </div>
  );
}
