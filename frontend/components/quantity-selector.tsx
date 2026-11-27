"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function QuantitySelector({ initial = 1 }: { initial?: number }) {
  const [quantity, setQuantity] = useState(initial);
  const decrement = () => setQuantity((value) => Math.max(1, value - 1));
  const increment = () => setQuantity((value) => value + 1);

  return (
    <div className="flex h-10 items-center overflow-hidden rounded-sm border border-primary bg-primary-light text-primary">
      <button onClick={decrement} className="grid h-10 w-9 place-items-center">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn("min-w-8 text-center text-sm font-extrabold")}>{quantity}</span>
      <button onClick={increment} className="grid h-10 w-9 place-items-center">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
