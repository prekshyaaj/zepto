"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function BackButton({ fallbackHref = "/home" }: { fallbackHref?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button onClick={goBack} className={cn(ui.pill, "grid h-11 w-11 place-items-center")} aria-label="Go back">
      <ArrowLeft className="h-5 w-5 text-primary" />
    </button>
  );
}
