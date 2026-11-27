"use client";

import { Bell, ChevronRight, Heart, PackageCheck, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { OrderHistoryList } from "@/components/order-history-list";
import { PageShell } from "@/components/page-shell";
import { ProductRow } from "@/components/product-row";
import { Button } from "@/components/ui/button";
import { getOrderHistory, getUserProfile, getUserRecommendations, type OrderPayload, type UserProfile } from "@/lib/api";
import { Product } from "@/lib/data";
import { useUser, useWishlist } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { userId, clearUser } = useUser();
  const { wishlist } = useWishlist();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderPayload[]>([]);
  const menu = [
    { label: "Orders", value: `${orders.length} previous`, icon: PackageCheck, href: "/orders" },
    { label: "Wishlist", value: `${wishlist.length} items`, icon: Heart, href: "/wishlist" },
    { label: "Notifications", value: "Account alerts", icon: Bell }
  ];

  useEffect(() => {
    if (!userId) return;

    getUserProfile(userId).then(setProfile).catch(() => setProfile(null));
    getUserRecommendations(userId).then(setRecommended).catch(() => setRecommended([]));
    getOrderHistory(userId).then(setOrders).catch(() => setOrders([]));
  }, [userId]);

  if (!userId) {
    return (
      <PageShell className="space-y-5">
        <h1 className={ui.title}>Profile</h1>
        <section className={cn(ui.card, "grid place-items-center gap-3 p-8 text-center")}>
          <UserRound className="h-14 w-14 text-primary" />
          <h2 className={ui.sectionTitle}>Login required</h2>
          <Link href="/login"><Button>Login</Button></Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton />
          <h1 className={ui.title}>Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
            <Heart className="h-5 w-5 text-coral" />
          </Link>
          <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
            <Search className="h-5 w-5 text-primary" />
          </Link>
        </div>
      </header>
      <section className="rounded-md bg-primary p-5 text-surface shadow-floating">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-pill bg-surface/15">
            <UserRound className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{profile?.email ?? profile?.phone ?? `User ${userId}`}</h1>
            <p className="mt-1 text-sm font-semibold text-surface/75">{profile?.phone ?? profile?.email ?? "Supabase user"}</p>
          </div>
        </div>
        <Button onClick={clearUser} variant="coral" className="mt-4 w-full">Logout</Button>
      </section>
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>Recommended for you</h2>
        {recommended.length > 0 ? <ProductRow products={recommended} /> : <p className="text-sm font-semibold text-muted">No recommendations found for this user.</p>}
      </section>
      <section className="space-y-3">
        <h2 className={ui.sectionTitle}>Order history</h2>
        <OrderHistoryList orders={orders.slice(0, 3)} emptyText="No recent orders found for this user." />
        {orders.length > 3 ? <Link href="/orders" className="block text-sm font-extrabold text-primary">View all orders</Link> : null}
      </section>
      <section className={cn(ui.card, "divide-y divide-border overflow-hidden")}>
        {menu.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-sm bg-primary-light text-primary"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">{item.label}</span>
                <span className="block text-xs font-semibold text-muted">{item.value}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="flex w-full items-center gap-3 p-4 text-left">
                {content}
              </Link>
            );
          }

          return (
            <button key={item.label} className="flex w-full items-center gap-3 p-4 text-left">
              {content}
            </button>
          );
        })}
      </section>
    </PageShell>
  );
}
