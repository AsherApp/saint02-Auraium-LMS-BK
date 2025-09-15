"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FluidTabsProps {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    badge?: number | string
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  variant?: 'default' | 'compact' | 'large'
  width?: 'auto' | 'wide' | 'full' | 'content-match'
}

interface FluidTabProps {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  isActive: boolean
  onClick: () => void
  variant?: 'default' | 'compact' | 'large'
}

function FluidTab({ id, label, icon, badge, isActive, onClick, variant = 'default' }: FluidTabProps) {
  const sizeClasses = {
    compact: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        // Base styles with flex-1 for equal width distribution
        "relative flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50",
        "hover:scale-[1.02] active:scale-[0.98] flex-1 min-w-0",
        sizeClasses[variant],
        // Active state - remove color classes to avoid conflicts with Framer Motion
        isActive 
          ? "shadow-lg" 
          : "hover:bg-white/5"
      )}
      whileHover={{ 
        y: -1
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Active background with glassmorphism */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md border border-white/20 rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.8, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 2 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.4
            }}
          />
        )}
      </AnimatePresence>

      {/* Smooth slider effect */}
      {isActive && (
        <motion.div
          layoutId="tabSlider"
          className="absolute inset-0 bg-white/5 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        {icon && (
          <motion.div
            animate={isActive ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}
        
        <span 
          className={`whitespace-nowrap font-medium ${
            isActive ? "text-white" : "text-slate-300"
          }`}
        >
          {label}
        </span>
        
        {badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold rounded-full",
              isActive 
                ? "bg-white/20 text-white" 
                : "bg-blue-600/80 text-white"
            )}
          >
            {badge}
          </motion.div>
        )}
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-white/5 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  )
}

export function FluidTabs({ tabs, activeTab, onTabChange, className, variant = 'default', width = 'auto' }: FluidTabsProps) {
  const widthClasses = {
    auto: "inline-flex",
    wide: "flex max-w-4xl w-full flex-wrap justify-center",
    full: "flex w-full flex-wrap justify-center",
    'content-match': "flex w-full max-w-6xl flex-wrap justify-center"
  }

  return (
    <div className={cn(
      // Container with glassmorphism - responsive width
      "items-center gap-1 p-1.5 rounded-xl",
      "bg-black/20 backdrop-blur-lg border border-white/10",
      "shadow-2xl shadow-black/20",
      widthClasses[width],
      className
    )}>
      {tabs.map((tab) => (
        <FluidTab
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          badge={tab.badge}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          variant={variant}
        />
      ))}
      
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/5 to-purple-600/5 -z-10" />
    </div>
  )
}

// Preset configurations
export const TabPresets = {
  dashboard: [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'subscription', label: 'Subscription', icon: '🎯' },
  ],
  
  courses: [
    { id: 'all', label: 'All Courses', badge: 12 },
    { id: 'active', label: 'Active', badge: 8 },
    { id: 'completed', label: 'Completed', badge: 4 },
    { id: 'archived', label: 'Archived' },
  ],
  
  students: [
    { id: 'enrolled', label: 'Enrolled', badge: 156 },
    { id: 'pending', label: 'Pending', badge: 23 },
    { id: 'inactive', label: 'Inactive', badge: 8 },
  ],
  
  assignments: [
    { id: 'pending', label: 'Pending', badge: 15 },
    { id: 'submitted', label: 'Submitted', badge: 42 },
    { id: 'graded', label: 'Graded', badge: 38 },
    { id: 'overdue', label: 'Overdue', badge: 3 },
  ]
}

// Helper hook for tab state management
export function useFluidTabs(initialTab: string) {
  const [activeTab, setActiveTab] = React.useState(initialTab)
  
  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])
  
  return {
    activeTab,
    setActiveTab,
    handleTabChange
  }
}
