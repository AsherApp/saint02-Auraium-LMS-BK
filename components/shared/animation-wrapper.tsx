"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimationWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: "fade-in" | "fade-in-delay" | "fade-in-delay-2" | "fade-in-delay-3" | "fade-in-delay-4"
  duration?: "fast" | "normal" | "slow" | "smooth"
}

export function AnimationWrapper({ 
  children, 
  className = "", 
  delay = 0,
  animation = "fade-in",
  duration = "normal"
}: AnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const durationClasses = {
    fast: "duration-150",
    normal: "duration-200", 
    slow: "duration-300",
    smooth: "duration-500"
  }

  return (
    <div
      className={cn(
        "transition-all ease-out transform-gpu",
        durationClasses[duration],
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}

// Staggered animation wrapper for lists
interface StaggeredAnimationWrapperProps {
  children: React.ReactNode | React.ReactNode[]
  className?: string
  staggerDelay?: number
  animation?: "fade-in" | "fade-in-delay" | "fade-in-delay-2" | "fade-in-delay-3" | "fade-in-delay-4"
  duration?: "fast" | "normal" | "slow" | "smooth"
}

export function StaggeredAnimationWrapper({ 
  children, 
  className = "",
  staggerDelay = 100,
  animation = "fade-in",
  duration = "normal"
}: StaggeredAnimationWrapperProps) {
  // Convert children to array if it's not already an array
  const childrenArray = Array.isArray(children) ? children : [children]
  
  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <AnimationWrapper
          key={index}
          delay={index * staggerDelay}
          animation={animation}
          duration={duration}
        >
          {child}
        </AnimationWrapper>
      ))}
    </div>
  )
}

// Page transition wrapper
interface PageTransitionWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageTransitionWrapper({ children, className = "" }: PageTransitionWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out transform-gpu",
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  )
}
