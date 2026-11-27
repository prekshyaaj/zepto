"use client";

import { motion } from "framer-motion";
import { filterChips } from "@/lib/data";
import { motion as motionTokens } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type FilterChip = (typeof filterChips)[number];

export function FilterChips({
  activeFilter = "All",
  onFilterChange,
}: {
  activeFilter?: FilterChip;
  onFilterChange?: (filter: FilterChip) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {filterChips.map((chip) => (
        <motion.button
          key={chip}
          type="button"
          onClick={() => onFilterChange?.(chip)}
          className={cn("shrink-0 rounded-pill border px-4 py-2 text-sm font-bold", activeFilter === chip ? "border-primary bg-primary text-surface" : "border-border bg-surface text-ink")}
          whileTap={motionTokens.button.whileTap}
        >
          {chip}
        </motion.button>
      ))}
    </div>
  );
}
