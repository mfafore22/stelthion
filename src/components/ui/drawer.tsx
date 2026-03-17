"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "left" | "top" | "bottom";
}

export function Drawer({
  open,
  onOpenChange,
  children,
  side = "right",
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed bg-[#0b1320]/85 backdrop-blur-sm text-white shadow-lg transition-all border border-slate-700",
            side === "right" && "top-0 right-0 h-full w-[400px] data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-slide-out-to-right",
            side === "left" &&
              "top-0 left-0 h-full w-[400px] data-[state=open]:animate-slide-in-from-left data-[state=closed]:animate-slide-out-to-left"
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
