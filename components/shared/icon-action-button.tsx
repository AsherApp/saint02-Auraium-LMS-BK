"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface IconActionButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
  loading?: boolean
  href?: string
  asChild?: boolean
  children?: React.ReactNode
}

export function IconActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  size = "sm",
  className,
  disabled = false,
  loading = false,
  href,
  asChild = false,
  children
}: IconActionButtonProps) {
  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "p-2 h-10 w-10 transition-all duration-200",
        "hover:scale-105 hover:shadow-lg",
        "focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500",
        className
      )}
      disabled={disabled || loading}
      asChild={asChild}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
      {children}
    </Button>
  )

  if (href) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href={href} className="inline-block">
              {buttonContent}
            </a>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-slate-900 text-white border-white/20">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 text-white border-white/20">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Predefined action button variants for common use cases
export function CreateButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Plus}
      label="Create New"
      onClick={onClick}
      href={href}
      variant="default"
      className={cn("bg-green-600/80 hover:bg-green-600 text-white", className)}
    />
  )
}

export function EditButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Pencil}
      label="Edit"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-blue-600/80 hover:bg-blue-600 text-white", className)}
    />
  )
}

export function DeleteButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Trash2}
      label="Delete"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-red-600/80 hover:bg-red-600 text-white", className)}
    />
  )
}

export function ViewButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Eye}
      label="View"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-slate-600/80 hover:bg-slate-600 text-white", className)}
    />
  )
}

export function SettingsButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Settings}
      label="Settings"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-white/10 hover:bg-white/20 text-white", className)}
    />
  )
}

export function UsersButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Users}
      label="Manage Users"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-blue-600/80 hover:bg-blue-600 text-white", className)}
    />
  )
}

export function VideoButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").Video}
      label="Video"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-green-600/80 hover:bg-green-600 text-white", className)}
    />
  )
}

export function FileButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").FileText}
      label="File"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-purple-600/80 hover:bg-purple-600 text-white", className)}
    />
  )
}

export function AssignmentButton({ onClick, className, href }: { onClick?: () => void; className?: string; href?: string }) {
  return (
    <IconActionButton
      icon={require("lucide-react").ClipboardList}
      label="Assignment"
      onClick={onClick}
      href={href}
      variant="ghost"
      className={cn("bg-orange-600/80 hover:bg-orange-600 text-white", className)}
    />
  )
}
