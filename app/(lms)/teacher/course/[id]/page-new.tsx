"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useCourseDetailFn } from "@/services/courses/hook"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { CourseOverview } from "@/components/teacher/course/course-overview"
import { ModulesSection } from "@/components/teacher/course/modules-section"
import { StudentsSection } from "@/components/teacher/course/students-section"
import { 
  BookOpen,
  Users,
  SettingsIcon,
  Award,
  BarChart2
} from "lucide-react"

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  const [showEditModal, setShowEditModal] = useState(false)
  
  const { course, loading, error } = useCourseDetailFn(courseId)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'modules', label: 'Modules', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'certificates', label: 'Certificates', icon: <Award className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> }
  ]

  const { activeTab, setActiveTab } = useFluidTabs(tabs)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-400">Failed to load course details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <CourseOverview 
        course={course} 
        onEdit={() => setShowEditModal(true)} 
      />

      {/* Fluid Tabs */}
      <FluidTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700"
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModulesSection courseId={courseId} />
              <StudentsSection courseId={courseId} />
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <ModulesSection courseId={courseId} />
        )}

        {activeTab === 'students' && (
          <StudentsSection courseId={courseId} />
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Analytics coming soon</p>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Certificate configuration coming soon</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <SettingsIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Course settings coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
