"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { ui } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type AccordionItemProps = {
  value: string;
  title: string;
  children: ReactNode;
};

export function AccordionItem({ value, title, children }: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item value={value} className={cn(ui.card, "overflow-hidden")}>
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between px-4 py-3 text-left text-base font-bold">
          {title}
          <ChevronDown className="h-4 w-4 text-primary transition group-data-[state=open]:rotate-180" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden text-sm text-muted data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-4 pb-4 leading-6">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

export function Accordion({ children, defaultValue }: { children: ReactNode; defaultValue?: string }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible defaultValue={defaultValue} className="space-y-3">
      {children}
    </AccordionPrimitive.Root>
  );
}
