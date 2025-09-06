import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-blue-600 hover:bg-blue-700 text-white shadow-md",
        primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md",
        secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-md",
        warning: "bg-orange-600 hover:bg-orange-700 text-white shadow-md",
        destructive: "bg-red-600 hover:bg-red-700 text-white shadow-md",
        outline: "border-2 border-white/30 text-slate-300 hover:bg-white/10 bg-transparent",
        ghost: "hover:bg-white/10 text-slate-300 bg-transparent",
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300 bg-transparent",
        glass: "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      role="button"
      aria-label={props['aria-label'] || 'Button'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
