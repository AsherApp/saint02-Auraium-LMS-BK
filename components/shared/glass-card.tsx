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
        "rounded-xl border border-white/20 bg-white/10 backdrop-blur shadow-[0_8px_32px_rgba(2,6,23,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
