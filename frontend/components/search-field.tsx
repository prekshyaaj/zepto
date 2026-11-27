import { Mic, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function SearchField({ large = false, spark = false }: { large?: boolean; spark?: boolean }) {
  const LeftIcon = spark ? Sparkles : Search;

  return (
    <Link
      href="/search?q="
      className={cn(ui.input, "flex items-center gap-3 px-4", large ? "h-14" : "h-12")}
    >
      <LeftIcon className="h-5 w-5 text-primary" />
      <span className={cn("flex-1 text-muted", large ? "text-md" : "text-base")}>Search for groceries</span>
      {large ? <Mic className="h-5 w-5 text-coral" /> : null}
    </Link>
  );
}
