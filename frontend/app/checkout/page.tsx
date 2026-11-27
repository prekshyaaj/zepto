"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { CreditCard, MapPin, Smartphone, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackHeader } from "@/components/back-header";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { createOrder } from "@/lib/api";
import { useCart, useUser } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn, formatCurrency, getDiscountPrice } from "@/lib/utils";

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "cod", label: "COD", icon: Wallet }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCart();
  const { userId } = useUser();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => {
    if (!item.product) return total;
    return total + getDiscountPrice(item.product.price, item.product.discountPercent) * item.quantity;
  }, 0);
  const deliveryFee = items.length > 0 ? 19 : 0;
  const discount = Math.round(subtotal * 0.08);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const placeOrder = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }

    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const order = await createOrder({
        user_id: userId,
        address,
        payment_method: paymentMethod,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        items: items.map((item) => ({
          product_id: Number(item.productId),
          quantity: item.quantity,
          price: item.product ? getDiscountPrice(item.product.price, item.product.discountPercent) : 0,
        })),
      });

      window.localStorage.setItem("zepto-last-order-id", String(order.order_id));
      router.push(`/order-confirmation?orderId=${order.order_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Order could not be placed.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <PageShell className="space-y-5 pb-32">
      <BackHeader title="Checkout" href="/cart" />
      <section className={cn(ui.card, "space-y-3 p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-primary-light text-primary"><MapPin className="h-5 w-5" /></span>
            <div>
              <h2 className="font-extrabold">Delivery Address</h2>
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 min-h-20 w-full bg-transparent text-sm font-semibold leading-5 text-muted outline-none" placeholder="Enter delivery address" />
            </div>
          </div>
        </div>
      </section>
      <section className={cn(ui.card, "space-y-3 p-4")}>
        <h2 className={ui.sectionTitle}>Order Summary</h2>
        <div className="flex justify-between text-sm font-semibold text-muted"><span>{itemCount || 0} items</span><span>{formatCurrency(subtotal)}</span></div>
      </section>
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>Payment Method</h2>
        <RadioGroup.Root value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <RadioGroup.Item key={method.id} value={method.id} className={cn(ui.card, "flex w-full items-center justify-between p-4 text-left data-[state=checked]:border-primary data-[state=checked]:bg-primary-light")}>
                <span className="flex items-center gap-3 font-extrabold"><Icon className="h-5 w-5 text-primary" />{method.label}</span>
                <span className="grid h-5 w-5 place-items-center rounded-pill border border-primary">
                  <RadioGroup.Indicator className="h-3 w-3 rounded-pill bg-primary" />
                </span>
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
      </section>
      {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-surface/95 px-4 py-4 shadow-floating backdrop-blur">
        <Button onClick={placeOrder} disabled={placing || items.length === 0} className="w-full">{placing ? "Placing..." : "Place Order"}</Button>
      </div>
    </PageShell>
  );
}
