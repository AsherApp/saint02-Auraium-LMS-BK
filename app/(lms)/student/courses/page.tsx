"use client"

import { GlassCard } from "@/components/shared/glass-card"
import { CourseCard } from "@/components/course/course-card"
import { useAuthStore } from "@/store/auth-store"
import { useEffect, useState } from "react"
import { http } from "@/services/http"

export default function StudentCoursesPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<any[]>([])
  const [courseStats, setCourseStats] = useState<Record<string, { modules: number; students: number }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const email = (user?.email || '').toLowerCase()
    if (!email) return
    
    setLoading(true)
    setError(null)
    
    const fetchCourses = async () => {
      try {
        console.log('Student Courses - Fetching courses for:', email)
        const response = await http<any>(`/api/students/${email}/courses`)
        console.log('Student Courses - API Response:', response)
        const enrolledCourses = response.items || []
        console.log('Student Courses - Enrolled courses:', enrolledCourses)
        setCourses(enrolledCourses)
        
        // Fetch stats for each course
        const statsPromises = enrolledCourses.map(async (course: any) => {
          try {
            const modulesResponse = await http<any>(`/api/modules/course/${course.course_id}`)
            const modulesCount = modulesResponse.items?.length || 0
            
            const rosterResponse = await http<any>(`/api/courses/${course.course_id}/roster`)
            const studentsCount = rosterResponse.items?.length || 0
            
            return {
              courseId: course.course_id,
              modules: modulesCount,
              students: studentsCount
            }
          } catch (err) {
            console.error(`Failed to fetch stats for course ${course.course_id}:`, err)
            return {
              courseId: course.course_id,
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
      } catch (err: any) {
        setError(err.message || "Failed to load courses")
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [user?.email])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Courses</h1>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading your courses...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Courses</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl font-semibold">My Courses</h1>
      {courses.length === 0 ? (
        <GlassCard className="p-6">
          <div className="text-slate-300">You are not enrolled in any courses yet.</div>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const stats = courseStats[c.course_id] || { modules: 0, students: 0 }
            const courseData = c.courses || {}
            return (
              <CourseCard
                key={c.course_id}
                id={c.course_id}
                title={courseData.title && courseData.title.trim() ? courseData.title.trim() : "Untitled Course"}
                description={courseData.description || "No description available"}
                modulesCount={stats.modules}
                studentsCount={stats.students}
                role="student"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
