"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { banners } from "@/lib/data";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % banners.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  const banner = banners[index];

  return (
    <section className={cn(ui.floating, "relative h-40 overflow-hidden border-0")}>
      <Image src={banner.image} alt={banner.title} fill className="object-cover" sizes="420px" priority />
      <div className="absolute inset-0 bg-primary/55" />
      <motion.div key={banner.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex flex-col justify-end p-5 text-surface">
        <p className="text-2xl font-extrabold">{banner.title}</p>
        <p className="mt-1 text-sm font-semibold text-surface/85">{banner.subtitle}</p>
        <div className="mt-4 flex gap-1.5">
          {banners.map((item, itemIndex) => (
            <span key={item.id} className={cn("h-1.5 rounded-pill", itemIndex === index ? "w-6 bg-coral" : "w-2 bg-surface/60")} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
