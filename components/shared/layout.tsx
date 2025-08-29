"use client"

import { ReactNode } from "react"
import { GlassCard } from "./glass-card"

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  showGlassCard?: boolean
}

export function Layout({ 
  children, 
  title, 
  description, 
  className = "",
  showGlassCard = true 
}: LayoutProps) {
  const content = (
    <div className={`p-4 md:p-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          {description && (
            <p className="text-slate-300">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )

  if (showGlassCard) {
    return <GlassCard>{content}</GlassCard>
  }

  return content
}
