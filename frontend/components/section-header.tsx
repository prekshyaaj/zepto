import { ReactNode } from "react";
import { ui } from "@/lib/tokens";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={ui.sectionTitle}>{title}</h2>
      {action}
    </div>
  );
}
