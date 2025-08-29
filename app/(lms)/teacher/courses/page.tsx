"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { CourseCard } from "@/components/course/course-card"
import { useCoursesFn } from "@/services/courses/hook"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"

export default function TeacherCoursesPage() {
  const { courses, loading, error } = useCoursesFn()
  const { user } = useAuthStore()
  const [courseStats, setCourseStats] = useState<Record<string, { modules: number; students: number }>>({})
  const [statsLoading, setStatsLoading] = useState(false)
  
  // Filter courses for the current teacher
  const myCourses = courses.filter((c) => c.teacher_email === user?.email)

  // Fetch stats for each course
  useEffect(() => {
    if (!myCourses.length) return
    
    setStatsLoading(true)
    
    const fetchCourseStats = async () => {
      try {
        const statsPromises = myCourses.map(async (course) => {
          try {
            // Get modules count
            const modulesResponse = await http<any>(`/api/modules/course/${course.id}`)
            const modulesCount = modulesResponse.items?.length || 0
            
            // Get students count
            const rosterResponse = await http<any>(`/api/courses/${course.id}/roster`)
            const studentsCount = rosterResponse.items?.length || 0
            
            return {
              courseId: course.id,
              modules: modulesCount,
              students: studentsCount
            }
          } catch (err) {
            console.error(`Failed to fetch stats for course ${course.id}:`, err)
            return {
              courseId: course.id,
              modules: 0,
              students: 0
            }
          }
        })
        
        const results = await Promise.all(statsPromises)
        const statsMap = results.reduce((acc, stat) => {
          acc[stat.courseId] = { modules: stat.modules, students: stat.students }
          return acc
        }, {} as Record<string, { modules: number; students: number }>)
        
        setCourseStats(statsMap)
      } catch (err) {
        console.error('Failed to fetch course stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchCourseStats()
  }, [myCourses])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">Your Courses</h1>
          <Link href="/teacher/courses/new">
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">Create Course</Button>
          </Link>
        </div>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading courses...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">Your Courses</h1>
          <Link href="/teacher/courses/new">
            <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">Create Course</Button>
          </Link>
        </div>
        <GlassCard className="p-6">
          <div className="text-red-300">Error loading courses: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">Your Courses</h1>
        <Link href="/teacher/courses/new">
          <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">Create Course</Button>
        </Link>
      </div>

      {myCourses.length === 0 ? (
        <GlassCard className="p-6">
          <div className="text-slate-300">No courses yet. Click Create Course to get started.</div>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((c) => {
            const stats = courseStats[c.id] || { modules: 0, students: 0 }
            return (
              <CourseCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                modulesCount={stats.modules}
                studentsCount={stats.students}
                role="teacher"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
