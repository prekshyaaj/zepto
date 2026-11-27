import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-primary", className)}>
      <Image src="/assets/logo.jpg" alt="Zepto inspired logo" fill priority className="object-contain" sizes="96px" />
    </div>
  );
}
