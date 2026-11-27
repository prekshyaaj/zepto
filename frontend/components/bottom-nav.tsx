"use client";

import { motion } from "framer-motion";
import { Bot, Home, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/store";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/category", label: "Categories", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/profile", label: "Profile", icon: UserRound }
];

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === href;
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  if (pathname === "/" || pathname === "/checkout" || pathname === "/order-confirmation") return null;

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md px-4">
      <div className={cn(ui.floating, "flex items-center justify-between bg-surface/85 p-2 backdrop-blur-xl")}>
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href} className="relative flex min-w-0 flex-1 items-center justify-center rounded-pill px-2 py-2">
              {active ? <motion.span layoutId="bottom-nav-pill" className="absolute inset-0 rounded-pill bg-primary" transition={{ duration: 0.22 }} /> : null}
              <span className={cn("relative flex items-center gap-1.5 text-xs font-bold", active ? "text-surface" : "text-muted")}>
                <Icon className="h-4 w-4" />
                {tab.href === "/cart" && itemCount > 0 ? (
                  <span className={cn(
                    "absolute -right-3 -top-3 grid h-5 min-w-5 place-items-center rounded-pill px-1 text-[10px] font-extrabold",
                    active ? "bg-coral text-surface" : "bg-coral text-surface"
                  )}>
                    {itemCount}
                  </span>
                ) : null}
                {active ? tab.label : null}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
