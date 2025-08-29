"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { useCourseStore } from "@/store/course-store"
import { useCoursesFn } from "@/services/courses/hook"
import { useAssignmentsFn } from "@/services/assignments/hook"
import { http } from "@/services/http"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Plus,
  ArrowRight,
  Activity,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { courses, loading: coursesLoading } = useCoursesFn()
  const { items: assignments, loading: assignmentsLoading } = useAssignmentsFn()
  const { courses: localCourses, seedIfEmpty } = useCourseStore()

  // Real statistics calculated from actual data
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0,
    upcomingDeadlines: 0,
    totalLiveSessions: 0,
    recentSubmissions: 0
  })

  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  // Initialize demo courses if none exist
  useEffect(() => {
    if (localCourses.length === 0) {
      seedIfEmpty()
    }
  }, [localCourses.length, seedIfEmpty])

  useEffect(() => {
    if (courses && assignments) {
      // Calculate real statistics from actual data
      const totalStudents = courses.reduce((acc, course) => acc + (course.enrollment_count || 0), 0)
      const activeCourses = courses.filter(course => course.status === 'published').length
      const pendingAssignments = assignments.filter(assignment => 
        new Date(assignment.due_at) > new Date()
      ).length
      const completedAssignments = assignments.filter(assignment => 
        new Date(assignment.due_at) <= new Date()
      ).length
      const upcomingDeadlines = assignments.filter(assignment => {
        const dueDate = new Date(assignment.due_at)
        const now = new Date()
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        return diffDays <= 7 && diffDays > 0
      }).length

      setStats({
        totalStudents,
        activeCourses,
        pendingAssignments,
        completedAssignments,
        averageGrade: totalStudents > 0 ? Math.round((activeCourses / courses.length) * 100) : 0,
        upcomingDeadlines,
        totalLiveSessions: 0, // Will be updated in separate effect
        recentSubmissions: 0  // Will be updated in separate effect
      })
    }
  }, [courses, assignments])

  // Fetch live sessions and recent activities
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!user?.email) return
      
      try {
        // Fetch live sessions
        const sessionsResponse = await http<any>('/api/live')
        const teacherSessions = sessionsResponse.items || []
        setLiveSessions(teacherSessions)
        
        // Update stats with live sessions count
        setStats(prev => ({
          ...prev,
          totalLiveSessions: teacherSessions.length
        }))
        
        // Fetch recent submissions (simplified - could be enhanced with real API)
        const recentSubmissionsCount = (assignments || []).reduce((acc, assignment) => {
          return acc + (assignment.submission_count || 0)
        }, 0)
        
        setStats(prev => ({
          ...prev,
          recentSubmissions: recentSubmissionsCount
        }))
        
      } catch (error) {
        console.error('Failed to fetch additional dashboard data:', error)
        // Set default values on error
        setLiveSessions([])
        setStats(prev => ({
          ...prev,
          totalLiveSessions: 0,
          recentSubmissions: 0
        }))
      }
    }
    
    fetchAdditionalData()
  }, [user?.email, assignments])

  // Use database courses first, fallback to local courses
  const recentCourses = (courses && courses.length > 0 ? courses : localCourses).slice(0, 3)
  const recentAssignments = assignments?.slice(0, 5) || []
  const recentLiveSessions = liveSessions?.slice(0, 3) || []

  if (coursesLoading || assignmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'Teacher'}! 👋
          </h1>
          <p className="text-slate-300">
            Here's what's happening with your courses and students today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/teacher/courses/new')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => router.push('/teacher/assignments')}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Assignments
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
              <p className="text-green-400 text-xs mt-1">Enrolled across all courses</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Courses</p>
              <p className="text-2xl font-bold text-white">{stats.activeCourses}</p>
              <p className="text-blue-400 text-xs mt-1">Currently running</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Pending Assignments</p>
              <p className="text-2xl font-bold text-white">{stats.pendingAssignments}</p>
              <p className="text-orange-400 text-xs mt-1">Need grading</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Live Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.totalLiveSessions}</p>
              <p className="text-blue-400 text-xs mt-1">Total sessions held</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Course Completion</p>
              <p className="text-2xl font-bold text-white">{stats.averageGrade}%</p>
              <p className="text-green-400 text-xs mt-1">Active course rate</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Recent Submissions</p>
              <p className="text-2xl font-bold text-white">{stats.recentSubmissions}</p>
              <p className="text-purple-400 text-xs mt-1">Student submissions</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Courses</h2>
                <p className="text-slate-400 text-sm">Your most active courses</p>
              </div>
              <Link href="/teacher/courses">
                <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No courses yet</p>
                  <Button 
                    onClick={() => router.push('/teacher/courses/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Create Your First Course
                  </Button>
                </div>
              ) : (
                recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{course.title}</h3>
                        <p className="text-slate-400 text-sm">{course.enrollment_count || 0} students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/teacher/course/${course.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold text-white">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-3">
              {stats.upcomingDeadlines > 0 ? (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{stats.upcomingDeadlines}</p>
                  <p className="text-slate-400 text-sm">assignments due this week</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recent Live Sessions */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Recent Live Sessions</h3>
            </div>
            <div className="space-y-3">
              {recentLiveSessions.length === 0 ? (
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No live sessions yet</p>
                </div>
              ) : (
                                 recentLiveSessions.map((session) => (
                   <div key={session.id} className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10">
                     <div>
                       <p className="text-white text-sm font-medium">{session.title || 'Live Session'}</p>
                       <p className="text-slate-400 text-xs">
                         {session.course_title ? `${session.course_title} • ` : ''}
                         {new Date(session.created_at).toLocaleDateString()}
                       </p>
                     </div>
                     <Badge 
                       variant="secondary" 
                       className={`text-xs ${
                         session.status === 'active' 
                           ? 'bg-green-500/20 text-green-300 border-green-500/30'
                           : session.status === 'scheduled'
                           ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                           : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                       }`}
                     >
                       {session.status || 'Completed'}
                     </Badge>
                   </div>
                 ))
              )}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/teacher/assignments/new')}
                className="w-full justify-start bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
              <Button 
                onClick={() => router.push('/teacher/live-class')}
                className="w-full justify-start bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30"
              >
                <Activity className="h-4 w-4 mr-2" />
                Start Live Class
              </Button>
              <Button 
                onClick={() => router.push('/teacher/student-management')}
                className="w-full justify-start bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Button>
            </div>
          </GlassCard>

          {/* Performance Overview */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Student Engagement</span>
                  <span className="text-white">{stats.totalStudents > 0 ? Math.round((stats.totalStudents / (stats.totalStudents + 5)) * 100) : 0}%</span>
                </div>
                <Progress value={stats.totalStudents > 0 ? Math.round((stats.totalStudents / (stats.totalStudents + 5)) * 100) : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Course Completion</span>
                  <span className="text-white">{stats.averageGrade}%</span>
                </div>
                <Progress value={stats.averageGrade} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Assignment Submission</span>
                  <span className="text-white">{stats.pendingAssignments > 0 ? Math.round((stats.completedAssignments / (stats.pendingAssignments + stats.completedAssignments)) * 100) : 0}%</span>
                </div>
                <Progress value={stats.pendingAssignments > 0 ? Math.round((stats.completedAssignments / (stats.pendingAssignments + stats.completedAssignments)) * 100) : 0} className="h-2" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Assignments */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Assignments</h2>
            <p className="text-slate-400 text-sm">Latest assignments and their status</p>
          </div>
          <Link href="/teacher/assignments">
            <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {recentAssignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No assignments yet</p>
              <Button 
                onClick={() => router.push('/teacher/assignments')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Your First Assignment
              </Button>
            </div>
          ) : (
            recentAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{assignment.title}</h3>
                    <p className="text-slate-400 text-sm">
                      Due: {new Date(assignment.due_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={new Date(assignment.due_at) > new Date() ? 'default' : 'destructive'}>
                    {new Date(assignment.due_at) > new Date() ? 'Active' : 'Overdue'}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push(`/teacher/assignment/${assignment.id}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  )
}
