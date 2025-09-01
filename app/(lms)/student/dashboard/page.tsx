"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { StatCard, QuickActionCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { BookOpen, ListChecks, Award, Calendar, Users, Clock } from "lucide-react"
import { StudentHeader } from "@/components/student/student-header"

export default function StudentDashboardPage() {
  const { user } = useAuthStore()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  useEffect(() => {
    console.log('Student Dashboard - User:', user)
    console.log('Student Dashboard - Auth Token:', localStorage.getItem('auth-token'))
  }, [user])
  
  // Calculate statistics
  const stats = {
    totalCourses: enrolledCourses.length,
    totalAssignments: assignments.length,
    upcomingAssignments: assignments.filter(a => 
      a.due_at && new Date(a.due_at) > new Date()
    ).length,
    overdueAssignments: assignments.filter(a => 
      a.due_at && new Date(a.due_at) < new Date()
    ).length,
    completedAssignments: assignments.filter(a => 
      a.status === 'submitted' || a.status === 'graded'
    ).length,
    upcomingSessions: liveSessions.filter(s => 
      s.start_at && new Date(s.start_at) > new Date()
    ).length
  }

  // Fetch student data
  useEffect(() => {
    if (!user?.email) {
      console.log('Student Dashboard - No user email, skipping data fetch')
      return
    }
    
    console.log('Student Dashboard - Fetching data for user:', user.email)
    setLoading(true)
    setError(null)
    
    const fetchStudentData = async () => {
      try {
        console.log('Student Dashboard - Fetching courses...')
        // Get enrolled courses
        const coursesResponse = await http<any>(`/api/students/${user.email}/courses`)
        console.log('Student Dashboard - Courses response:', coursesResponse)
        setEnrolledCourses(coursesResponse.items || [])
        
        // Get assignments for enrolled courses
        const assignmentPromises = (coursesResponse.items || []).map(async (course: any) => {
          try {
            console.log('Student Dashboard - Fetching assignments for course:', course.course_id)
            const assignmentsResponse = await http<any>(`/api/courses/${course.course_id}/assignments`)
            return assignmentsResponse.items.map((assignment: any) => ({
              ...assignment,
              course_title: course.courses?.title || "Unknown Course"
            }))
          } catch (err) {
            console.error(`Failed to fetch assignments for course ${course.course_id}:`, err)
            return []
          }
        })
        
        const assignmentResults = await Promise.all(assignmentPromises)
        const allAssignments = assignmentResults.flat()
        console.log('Student Dashboard - All assignments:', allAssignments)
        setAssignments(allAssignments)
        
        // Get live sessions for the student
        try {
          console.log('Student Dashboard - Fetching live sessions...')
          const sessionsResponse = await http<any>(`/api/live/my-sessions`)
          console.log('Student Dashboard - Live sessions response:', sessionsResponse)
          setLiveSessions(sessionsResponse.items || [])
        } catch (err) {
          console.error('Failed to fetch live sessions:', err)
          setLiveSessions([])
        }
        
      } catch (err: any) {
        console.error('Student Dashboard - Error fetching data:', err)
        setError(err.message || "Failed to fetch student data")
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [user?.email])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Student Dashboard</h1>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading your dashboard...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Student Dashboard</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Student Header with Name and Code */}
      <StudentHeader />
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 truncate">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Here's what's happening with your courses and assignments today.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button 
            onClick={() => window.location.href = '/student/courses'}
            variant="primary"
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            View Courses
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Enrolled Courses"
          value={stats.totalCourses}
          description="Enrolled Courses"
          icon={BookOpen}
          iconColor="blue"
          className="animate-fade-in-up"
        />
        
        <StatCard
          title="Total Assignments"
          value={stats.totalAssignments}
          description="Total Assignments"
          icon={ListChecks}
          iconColor="green"
          className="animate-fade-in-up"
        />
        
        <StatCard
          title="Completed"
          value={stats.completedAssignments}
          description="Completed"
          icon={Award}
          iconColor="purple"
          className="animate-fade-in-up"
        />
        
        <StatCard
          title="Upcoming"
          value={stats.upcomingAssignments}
          description="Upcoming"
          icon={Clock}
          iconColor="orange"
          className="animate-fade-in-up"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <QuickActionCard
          title="My Courses"
          description="Access modules and lessons."
          icon={BookOpen}
          iconColor="blue"
          href="/student/courses"
          className="animate-fade-in-up"
        />
        
        <QuickActionCard
          title="Assignments"
          description="View due tasks and submit work."
          icon={ListChecks}
          iconColor="green"
          href="/student/assignments"
          className="animate-fade-in-up"
        />
        
        <QuickActionCard
          title="Live Classes"
          description="Join live sessions."
          icon={Users}
          iconColor="purple"
          href="/student/live-class"
          className="animate-fade-in-up"
        />
      </div>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">Recent Assignments</h2>
          <div className="grid gap-3">
            {assignments.slice(0, 3).map((assignment) => (
              <GlassCard key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{assignment.title}</h3>
                    <p className="text-slate-400 text-sm">{assignment.course_title}</p>
                    {assignment.due_at && (
                      <p className="text-slate-500 text-xs mt-1">
                        Due: {new Date(assignment.due_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {assignment.type}
                  </Badge>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
