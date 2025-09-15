"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface EnhancedProgressProps {
  value: number
  max?: number
  className?: string
  showPercentage?: boolean
  animated?: boolean
  color?: "blue" | "green" | "purple" | "orange" | "red"
  size?: "sm" | "md" | "lg"
  showGlow?: boolean
}

const colorVariants = {
  blue: {
    background: "bg-gradient-to-r from-blue-500 to-blue-600",
    glow: "shadow-blue-500/50",
    text: "text-blue-400"
  },
  green: {
    background: "bg-gradient-to-r from-green-500 to-green-600",
    glow: "shadow-green-500/50",
    text: "text-green-400"
  },
  purple: {
    background: "bg-gradient-to-r from-purple-500 to-purple-600",
    glow: "shadow-purple-500/50",
    text: "text-purple-400"
  },
  orange: {
    background: "bg-gradient-to-r from-orange-500 to-orange-600",
    glow: "shadow-orange-500/50",
    text: "text-orange-400"
  },
  red: {
    background: "bg-gradient-to-r from-red-500 to-red-600",
    glow: "shadow-red-500/50",
    text: "text-red-400"
  }
}

const sizeVariants = {
  sm: {
    height: "h-1",
    text: "text-xs",
    padding: "px-2 py-1"
  },
  md: {
    height: "h-2",
    text: "text-sm",
    padding: "px-3 py-1.5"
  },
  lg: {
    height: "h-3",
    text: "text-base",
    padding: "px-4 py-2"
  }
}

export function EnhancedProgress({
  value,
  max = 100,
  className,
  showPercentage = true,
  animated = true,
  color = "blue",
  size = "md",
  showGlow = true
}: EnhancedProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const colors = colorVariants[color]
  const sizes = sizeVariants[size]

  return (
    <div className={cn("relative w-full", className)}>
      {/* Background track */}
      <div className={cn(
        "relative w-full bg-slate-700/50 rounded-full overflow-hidden",
        sizes.height
      )}>
        {/* Progress fill */}
        <div
          className={cn(
            "relative h-full rounded-full transition-all duration-1000 ease-out",
            colors.background,
            showGlow && "shadow-lg",
            showGlow && colors.glow
          )}
          style={{ 
            width: `${percentage}%`,
            transitionDelay: animated ? '200ms' : '0ms'
          }}
        >
          {/* Shimmer effect */}
          {animated && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            />
          )}
          
          {/* Glow effect */}
          {showGlow && (
            <div
              className="absolute inset-0 rounded-full opacity-50 animate-pulse"
              style={{
                background: `radial-gradient(circle at center, ${colors.background.split(' ')[1]} 0%, transparent 70%)`
              }}
            />
          )}
        </div>
      </div>
      
      {/* Percentage text */}
      {showPercentage && (
        <div
          className={cn(
            "absolute -top-8 right-0 transition-all duration-500 ease-out",
            sizes.text,
            colors.text,
            "font-semibold"
          )}
          style={{
            opacity: 1,
            transform: 'translateY(0)',
            transitionDelay: animated ? '500ms' : '0ms'
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}

// Course Progress Bar Component
interface CourseProgressBarProps {
  value: number
  className?: string
  showDetails?: boolean
  totalLessons?: number
  completedLessons?: number
}

export function CourseProgressBar({
  value,
  className,
  showDetails = true,
  totalLessons = 0,
  completedLessons = 0
}: CourseProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Course Progress</span>
          <span className="text-slate-300">
            {completedLessons} of {totalLessons} lessons
          </span>
        </div>
      )}
      
      <EnhancedProgress
        value={value}
        color="blue"
        size="md"
        showPercentage={true}
        animated={true}
        showGlow={true}
        className="w-full"
      />
      
      {showDetails && (
        <div
          className="text-xs text-slate-500 transition-opacity duration-500 ease-out"
          style={{
            opacity: 1,
            transitionDelay: '800ms'
          }}
        >
          {value === 100 ? "🎉 Course completed!" : "Keep going!"}
        </div>
      )}
    </div>
  )
}
