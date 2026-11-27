"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { motion as motionTokens } from "@/lib/tokens";

export default function SplashPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-primary px-6">
      <motion.section className="flex w-full max-w-sm flex-col items-center text-center" {...motionTokens.page}>
        <Logo className="h-40 w-40 shadow-floating" />
        <h1 className="mt-8 text-2xl font-extrabold text-surface">Groceries at lightning speed</h1>
        <p className="mt-3 text-md font-semibold text-surface/80">Fresh picks, pantry staples and recipes delivered before the kettle boils.</p>
        <Link href="/home" className="mt-8 w-full">
          <Button variant="coral" className="w-full">Get Started</Button>
        </Link>
      </motion.section>
    </main>
  );
}
