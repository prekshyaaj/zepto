import { Heart, Search } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function BackHeader({ title, href = "/home" }: { title: string; href?: string }) {
  return (
    <header className="flex items-center gap-3">
      <BackButton fallbackHref={href} />
      <h1 className={cn(ui.title, "min-w-0 flex-1 truncate")}>{title}</h1>
      <Link href="/wishlist" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Open wishlist">
        <Heart className="h-5 w-5 text-coral" />
      </Link>
      <Link href="/search" className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Search groceries">
        <Search className="h-5 w-5 text-primary" />
      </Link>
    </header>
  );
}
