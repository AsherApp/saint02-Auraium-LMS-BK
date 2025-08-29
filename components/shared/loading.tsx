"use client"

import { ReactNode } from "react"

interface LoadingProps {
  children?: ReactNode
  text?: string
  className?: string
}

export function Loading({ 
  children, 
  text = "Loading...", 
  className = "" 
}: LoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-slate-300">{text}</p>
        {children}
      </div>
    </div>
  )
}

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${className}`}></div>
  )
}
