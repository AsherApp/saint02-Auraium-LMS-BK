import type React from "react"
import { cn } from "@/lib/utils"

export function GlassCard({
  className = "",
  children = null as unknown as React.ReactNode,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-glass transition-all duration-200 hover:bg-white/15",
        className,
      )}
    >
      {children}
    </div>
  )
}
