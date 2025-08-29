import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      aria-label={props['aria-label'] || 'Input'}
      className={cn(
        "file:text-gray-900 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-300 flex h-11 w-full min-w-0 rounded-md border bg-transparent px-4 py-2 text-base font-bold shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300",
        className
      )}
      {...props}
    />
  )
}

export { Input }
