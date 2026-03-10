"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-slot="tabs-list"
    className={cn(
      "inline-flex h-auto items-center justify-start overflow-hidden rounded-xl border border-bo-neutral-200 bg-white shadow-bo-glass",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, style, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const element = internalRef.current;
    if (!element) return;

    const observer = new MutationObserver(() => {
      setIsActive(element.getAttribute('data-state') === 'active');
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    });

    // Set initial state
    setIsActive(element.getAttribute('data-state') === 'active');

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      data-slot="tabs-trigger"
      style={isActive ? { background: 'linear-gradient(to right, #2B2B2B 0%, #3D3D3D 50%, #2B2B2B 100%)', ...style } : style}
      className={cn(
        "ring-offset-background focus-visible:ring-bo-neutral-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold",
        "transition-all duration-200 ease-bo-out-expo",
        "disabled:pointer-events-none disabled:opacity-50",
        "text-bo-neutral-700 hover:bg-bo-neutral-50",
        "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-bo-neutral-900/15 data-[state=active]:translate-y-[-1px]",
        className
      )}
      {...props}
    />
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      "mt-2 ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
