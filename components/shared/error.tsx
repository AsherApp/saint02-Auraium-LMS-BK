"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "./glass-card"

interface ErrorProps {
  title?: string
  message?: string
  children?: ReactNode
  onRetry?: () => void
  onBack?: () => void
  className?: string
}

export function Error({ 
  title = "Something went wrong", 
  message = "An error occurred while loading this content.",
  children,
  onRetry,
  onBack,
  className = ""
}: ErrorProps) {
  return (
    <GlassCard className={className}>
      <div className="text-center p-6">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        
        {children}
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
