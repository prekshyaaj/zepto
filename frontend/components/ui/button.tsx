"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { ui, motion as motionTokens } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "coral" | "ghost" | "plain";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: ui.primaryButton,
  coral: ui.coralButton,
  ghost: ui.ghostButton,
  plain: "rounded-md bg-transparent text-ink"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <motion.button
      ref={ref}
      type={type}
      className={cn("inline-flex items-center justify-center gap-2 px-4 py-3 text-base font-bold", variants[variant], className)}
      whileTap={motionTokens.button.whileTap}
      transition={motionTokens.button.transition}
      {...props}
    />
  )
);

Button.displayName = "Button";
