"use client"

import { ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  className?: string
}

export function FormField({ 
  label, 
  children, 
  required = false, 
  error,
  className = ""
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-white">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
