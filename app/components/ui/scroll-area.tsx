// components/ui/scroll-area.tsx
"use client";

import * as React from "react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils"; // or replace with your own classnames helper

export function ScrollArea({
  className,
  children,
  viewportClassName,
  orientation = "vertical",
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixScrollArea.Root> & {
  viewportClassName?: string;
  orientation?: "vertical" | "horizontal" | "both";
}) {
  const vertical = orientation === "vertical" || orientation === "both";
  const horizontal = orientation === "horizontal" || orientation === "both";

  return (
    <RadixScrollArea.Root
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <RadixScrollArea.Viewport
        className={cn("h-full w-full rounded-[inherit]", viewportClassName)}
      >
        {children}
      </RadixScrollArea.Viewport>

      {vertical && (
        <RadixScrollArea.Scrollbar
          orientation="vertical"
          className="flex touch-none select-none p-0.5 transition-colors duration-[160ms] ease-out data-[state=hidden]:opacity-0"
        >
          <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral-300 hover:bg-neutral-400" />
        </RadixScrollArea.Scrollbar>
      )}

      {horizontal && (
        <RadixScrollArea.Scrollbar
          orientation="horizontal"
          className="flex touch-none select-none p-0.5 transition-colors duration-[160ms] ease-out data-[state=hidden]:opacity-0"
        >
          <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral-300 hover:bg-neutral-400" />
        </RadixScrollArea.Scrollbar>
      )}

      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}

export const ScrollBar = RadixScrollArea.Scrollbar;
