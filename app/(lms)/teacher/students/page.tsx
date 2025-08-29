"use client"

import { useMemo, useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { http } from "@/services/http"
import { Users, Search, Mail, BookOpen } from "lucide-react"

export default function AllStudentsPage() {
  const { user } = useAuthStore()
  const { courses } = useCoursesFn()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all students and their enrollments
  useEffect(() => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    
    const fetchStudents = async () => {
      try {
        // Get all students
        const studentsResponse = await http<any>('/api/students')
        const allStudents = studentsResponse.items || []
        
        // Get enrollments for each course
        const enrollmentsPromises = courses.map(async (course) => {
          try {
            const rosterResponse = await http<any>(`/api/courses/${course.id}/roster`)
            return rosterResponse.items.map((enrollment: any) => ({
              ...enrollment,
              course_title: course.title,
              course_id: course.id
            }))
          } catch (err) {
            console.error(`Failed to fetch roster for course ${course.id}:`, err)
            return []
          }
        })
        
        const enrollmentsResults = await Promise.all(enrollmentsPromises)
        const allEnrollments = enrollmentsResults.flat()
        
        // Combine student data with enrollments
        const studentMap = new Map()
        
        // Add all students first
        allStudents.forEach((student: any) => {
          studentMap.set(student.email.toLowerCase(), {
            id: student.id,
            email: student.email,
            name: student.name,
            status: student.status,
            courses: [],
            total_courses: 0
          })
        })
        
        // Add enrollment data
        allEnrollments.forEach((enrollment: any) => {
          const key = enrollment.email.toLowerCase()
          const student = studentMap.get(key)
          if (student) {
            student.courses.push({
              id: enrollment.course_id,
              title: enrollment.course_title,
              state: enrollment.state
            })
            student.total_courses = student.courses.length
          }
        })
        
        const studentsList = Array.from(studentMap.values())
          .sort((a, b) => a.email.localeCompare(b.email))
        
        setStudents(studentsList)
      } catch (err: any) {
        setError(err.message || "Failed to fetch students")
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [user?.email, courses])

  const filteredStudents = students.filter(student =>
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Student Management</h1>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading students...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Student Management</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Student Management</h1>
          <p className="text-slate-400 mt-1">Manage all students across your courses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStudents.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Students Found</h3>
            <p className="text-slate-400">
              {searchQuery ? "No students match your search." : "No students are enrolled in your courses yet."}
            </p>
          </GlassCard>
        ) : (
          filteredStudents.map((student) => (
            <GlassCard key={student.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{student.name || student.email}</h3>
                    <p className="text-slate-400 text-sm">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {student.status}
                      </Badge>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-500 text-xs">{student.total_courses} courses</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {student.courses.map((course: any) => (
                      <Badge key={course.id} variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                        {course.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}

