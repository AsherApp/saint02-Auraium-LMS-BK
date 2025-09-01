"use client"

import { useState } from "react"
import { FluidTabs, TabPresets, useFluidTabs } from "@/components/ui/fluid-tabs"
import { GlassCard } from "@/components/shared/glass-card"
import { ResponsiveContainer } from "@/components/shared/responsive-container"
import { Badge } from "@/components/ui/badge"
import { 
  Home, Settings, CreditCard, Target, 
  BookOpen, Users, FileText, Clock,
  Smartphone, Tablet, Monitor
} from "lucide-react"

export default function FluidTabsDemo() {
  const dashboard = useFluidTabs('overview')
  const courses = useFluidTabs('all')
  const students = useFluidTabs('enrolled')
  const assignments = useFluidTabs('pending')

  // Custom tab configurations with icons
  const dashboardTabs = [
    { id: 'overview', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <Target className="h-4 w-4" />, badge: '12' },
  ]

  const courseTabs = [
    { id: 'all', label: 'All Courses', icon: <BookOpen className="h-4 w-4" />, badge: 24 },
    { id: 'active', label: 'Active', icon: <Target className="h-4 w-4" />, badge: 18 },
    { id: 'completed', label: 'Completed', icon: <FileText className="h-4 w-4" />, badge: 6 },
    { id: 'archived', label: 'Archived', icon: <Clock className="h-4 w-4" /> },
  ]

  const deviceTabs = [
    { id: 'mobile', label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'tablet', label: 'Tablet', icon: <Tablet className="h-4 w-4" /> },
    { id: 'desktop', label: 'Desktop', icon: <Monitor className="h-4 w-4" /> },
  ]

  return (
    <ResponsiveContainer size="wide" padding="xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Fluid Tabs Component Demo
          </h1>
          <p className="text-slate-300 text-lg">
            Professional, fluid tab navigation with glassmorphism design
          </p>
        </div>

        {/* Main Dashboard Tabs */}
        <div className="space-y-6">
          <h2 className="text-white text-xl font-semibold">Dashboard Navigation</h2>
          <div className="flex justify-center">
            <FluidTabs
              tabs={dashboardTabs}
              activeTab={dashboard.activeTab}
              onTabChange={dashboard.handleTabChange}
              variant="default"
            />
          </div>
          <GlassCard className="p-6">
            <div className="text-center text-white">
              <h3 className="text-lg font-medium mb-2">
                Active Tab: {dashboardTabs.find(t => t.id === dashboard.activeTab)?.label}
              </h3>
              <p className="text-slate-300">
                Content for the {dashboard.activeTab} section would appear here.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Course Management Tabs */}
        <div className="space-y-6">
          <h2 className="text-white text-xl font-semibold">Course Management</h2>
          <div className="flex justify-center">
            <FluidTabs
              tabs={courseTabs}
              activeTab={courses.activeTab}
              onTabChange={courses.handleTabChange}
              variant="default"
            />
          </div>
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">Course {i + 1}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {courses.activeTab}
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Sample course content for {courses.activeTab} filter
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Size Variants */}
        <div className="space-y-6">
          <h2 className="text-white text-xl font-semibold">Size Variants</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-white font-medium">Compact</h3>
              <FluidTabs
                tabs={deviceTabs}
                activeTab="mobile"
                onTabChange={() => {}}
                variant="compact"
              />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-white font-medium">Default</h3>
              <FluidTabs
                tabs={deviceTabs}
                activeTab="tablet"
                onTabChange={() => {}}
                variant="default"
              />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-white font-medium">Large</h3>
              <FluidTabs
                tabs={deviceTabs}
                activeTab="desktop"
                onTabChange={() => {}}
                variant="large"
              />
            </div>
          </div>
        </div>

        {/* Assignment Status Tabs */}
        <div className="space-y-6">
          <h2 className="text-white text-xl font-semibold">Assignment Status</h2>
          <div className="flex justify-center">
            <FluidTabs
              tabs={[
                { id: 'pending', label: 'Pending', badge: 15 },
                { id: 'submitted', label: 'Submitted', badge: 42 },
                { id: 'graded', label: 'Graded', badge: 38 },
                { id: 'overdue', label: 'Overdue', badge: 3 },
              ]}
              activeTab={assignments.activeTab}
              onTabChange={assignments.handleTabChange}
              variant="default"
            />
          </div>
          <GlassCard className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {assignments.activeTab === 'pending' ? '15' :
                 assignments.activeTab === 'submitted' ? '42' :
                 assignments.activeTab === 'graded' ? '38' : '3'}
              </div>
              <div className="text-slate-300">
                {assignments.activeTab.charAt(0).toUpperCase() + assignments.activeTab.slice(1)} Assignments
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Features */}
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="text-blue-300 font-medium">Design</h4>
              <ul className="text-slate-300 space-y-1">
                <li>• Glassmorphism styling</li>
                <li>• Subtle border radius</li>
                <li>• Professional appearance</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-purple-300 font-medium">Animations</h4>
              <ul className="text-slate-300 space-y-1">
                <li>• Fluid tab transitions</li>
                <li>• Smooth hover effects</li>
                <li>• Spring animations</li>
                <li>• Scale feedback</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-green-300 font-medium">Functionality</h4>
              <ul className="text-slate-300 space-y-1">
                <li>• Badge support</li>
                <li>• Icon integration</li>
                <li>• Size variants</li>
                <li>• Accessibility ready</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-orange-300 font-medium">Performance</h4>
              <ul className="text-slate-300 space-y-1">
                <li>• Optimized animations</li>
                <li>• Minimal re-renders</li>
                <li>• TypeScript support</li>
                <li>• Tree-shakeable</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </ResponsiveContainer>
  )
}
