"use client"

import React from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, SettingsIcon, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  status: string
  teacher_email: string
  created_at: string
  updated_at: string
}

interface CourseOverviewProps {
  course: Course
  onEdit: () => void
}

export function CourseOverview({ course, onEdit }: CourseOverviewProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-slate-400 mt-1">{course.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={course.status === 'active' ? 'default' : 'secondary'}
            className={course.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}
          >
            {course.status}
          </Badge>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
          <Users className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-sm text-slate-400">Students</p>
            <p className="text-lg font-semibold text-white">0</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
          <BookOpen className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-sm text-slate-400">Modules</p>
            <p className="text-lg font-semibold text-white">0</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg">
          <ExternalLink className="h-5 w-5 text-purple-400" />
          <div>
            <p className="text-sm text-slate-400">Lessons</p>
            <p className="text-lg font-semibold text-white">0</p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}