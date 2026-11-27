"use client";

import { Check, MapPin, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { getOrderStatus } from "@/lib/api";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const steps = ["Placed", "Packed", "Picked Up", "Delivered"];

function stepIsActive(step: string, status: string) {
  return steps.indexOf(step) <= steps.indexOf(status);
}

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Placed");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const id = orderId ?? window.localStorage.getItem("zepto-last-order-id");
    if (!id) return;
    getOrderStatus(id).then((order) => setStatus(order.status)).catch(() => setStatus("Placed"));
  }, [orderId]);

  return (
    <PageShell className="space-y-5">
      <BackHeader title="Track Order" href="/home" />
      <section className={cn(ui.card, "p-4")}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const active = stepIsActive(step, status);
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-pill border text-xs font-extrabold", active ? "border-primary bg-primary text-surface" : "border-border bg-surface text-muted")}>
                    {active ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={cn("text-center text-xs font-bold", active ? "text-primary" : "text-muted")}>{step}</span>
                </div>
                {index < steps.length - 1 ? <span className={cn("mx-1 h-0.5 flex-1", stepIsActive(steps[index + 1], status) ? "bg-primary" : "bg-border")} /> : null}
              </div>
            );
          })}
        </div>
      </section>
      <section className="relative h-64 overflow-hidden rounded-lg bg-border">
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-surface text-primary shadow-floating">
          <MapPin className="h-8 w-8" />
        </div>
      </section>
      <section className={cn(ui.card, "flex items-center justify-between p-4")}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-pill bg-primary-light text-primary"><UserRound className="h-6 w-6" /></span>
          <div>
            <h2 className="font-extrabold">Aman Verma</h2>
            <p className="text-sm font-semibold text-muted">Delivery partner</p>
          </div>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-pill bg-coral-light text-coral"><Phone className="h-5 w-5" /></button>
      </section>
    </PageShell>
  );
}
