import { Heart, Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/home" aria-label="Go home">
        <Logo className="h-11 w-11" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-extrabold text-ink">Zepto Grocery</p>
        <p className="text-xs font-bold text-muted">Fresh picks in minutes</p>
      </div>
      <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
        <Heart className="h-5 w-5 text-coral" />
      </Link>
      <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
        <Search className="h-5 w-5 text-primary" />
      </Link>
    </header>
  );
}
