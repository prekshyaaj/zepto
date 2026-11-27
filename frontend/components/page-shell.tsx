"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { motion as motionTokens, ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={ui.page}>
      <motion.div className={cn(ui.shell, className)} {...motionTokens.page}>
        {children}
      </motion.div>
    </main>
  );
}
