"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4 w-full p-2 sm:p-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-11 w-full items-center justify-center rounded-lg p-2 gap-2 font-bold text-base",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      aria-label={props['aria-label'] || 'Tab'}
      className={cn(
        "data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 focus-visible:border-ring focus-visible:ring-blue-500/50 focus-visible:outline-ring dark:data-[state=active]:border-gray-300 dark:data-[state=active]:bg-input/30 text-gray-900 dark:text-muted-foreground inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-base font-bold whitespace-nowrap transition-[color,box-shadow] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-md [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none p-2 sm:p-4 bg-white/5 rounded-lg border border-white/10", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
