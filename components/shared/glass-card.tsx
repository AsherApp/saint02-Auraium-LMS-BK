import type React from "react"
import { cn } from "@/lib/utils"

export function GlassCard({
  className = "",
  children = null as unknown as React.ReactNode,
  variant = "default",
  hover = true,
}: {
  className?: string
  children?: React.ReactNode
  variant?: "default" | "light" | "medium" | "heavy"
  hover?: boolean
}) {
  const variants = {
    default: "bg-white/10 backdrop-blur-md border-white/20 shadow-glass",
    light: "bg-white/5 backdrop-blur-sm border-white/10 shadow-glass-light",
    medium: "bg-white/15 backdrop-blur-lg border-white/25 shadow-glass",
    heavy: "bg-white/20 backdrop-blur-xl border-white/30 shadow-glass-heavy",
  }

  const hoverEffects = hover ? "hover:bg-white/15 hover:border-white/30 hover:shadow-glass-heavy hover:scale-[1.02] hover:-translate-y-1" : ""

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 ease-out transform-gpu",
        variants[variant],
        hoverEffects,
        className,
      )}
    >
      {children}
    </div>
  )
}
