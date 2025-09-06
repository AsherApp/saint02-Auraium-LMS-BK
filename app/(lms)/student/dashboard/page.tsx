"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { StatCard, QuickActionCard } from "@/components/shared/stat-card"
import { Greeting } from "@/components/shared/greeting"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { 
  BookOpen, 
  ListChecks, 
  Award, 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Target, 
  Star, 
  Activity,
  Bell,
  MessageSquare,
  FileText,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  User,
  Key,
  GraduationCap
} from "lucide-react"
import { motion } from "framer-motion"

export default function StudentDashboardPage() {
  const { user } = useAuthStore()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [studentCode, setStudentCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  useEffect(() => {
    console.log('Student Dashboard - User:', user)
    console.log('Student Dashboard - Auth Token:', localStorage.getItem('auth-token'))
  }, [user])
  
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
        const coursesResponse = await http<any>(`/api/students/me/courses`)
        console.log('Student Dashboard - Courses response:', coursesResponse)
        const enrolledCourses = coursesResponse.items || []
        
        // Check if any course is in public mode
        const hasPublicCourses = enrolledCourses.some((course: any) => course.courses?.course_mode === 'public')
        
        if (hasPublicCourses) {
          // Redirect to public mode dashboard
          window.location.href = '/student/public-dashboard'
          return
        }
        
        setEnrolledCourses(enrolledCourses)
        
        // Get assignments for enrolled courses
        const assignmentPromises = (enrolledCourses || []).map(async (course: any) => {
          try {
            console.log('Student Dashboard - Fetching assignments for course:', course.course_id)
            const assignmentsResponse = await http<any>(`/api/courses/${course.course_id}/assignments`)
            return (assignmentsResponse.items || []).map((assignment: any) => ({
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

        // Get announcements for the student
        try {
          console.log('Student Dashboard - Fetching announcements...')
          const announcementsResponse = await http<any>(`/api/announcements/student`)
          console.log('Student Dashboard - Announcements response:', announcementsResponse)
          setAnnouncements(announcementsResponse.items || [])
        } catch (err) {
          console.error('Failed to fetch announcements:', err)
          setAnnouncements([])
        }

        // Get student code
        try {
          const profileResponse = await http<any>(`/api/students/me/profile`)
          if (profileResponse.student_code) {
            setStudentCode(profileResponse.student_code)
          }
        } catch (err) {
          console.error('Failed to fetch student code:', err)
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

  // Calculate statistics based on real data
  const stats = {
    totalCourses: enrolledCourses.length,
    totalAssignments: assignments.length,
    upcomingAssignments: assignments.filter((a: any) => 
      a.due_at && new Date(a.due_at) > new Date()
    ).length,
    overdueAssignments: assignments.filter((a: any) => 
      a.due_at && new Date(a.due_at) < new Date()
    ).length,
    completedAssignments: assignments.filter((a: any) => 
      a.status === 'submitted' || a.status === 'graded'
    ).length,
    upcomingSessions: liveSessions.filter((s: any) => 
      s.start_at && new Date(s.start_at) > new Date()
    ).length,
    completionRate: enrolledCourses.length > 0 && assignments.length > 0 ? 
      Math.round((assignments.filter((a: any) => a.status === 'submitted' || a.status === 'graded').length / assignments.length) * 100) : 0
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6" variant="medium" hover={false}>
          <Greeting userName={user?.name || 'Student'} />
          <div className="text-slate-300 mt-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
            Loading your dashboard...
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6" variant="medium" hover={false}>
          <Greeting userName={user?.name || 'Student'} />
          <div className="text-red-300 mt-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error: {error}
          </div>
        </GlassCard>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Personalized Greeting Header */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" variant="medium" hover={false}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <Greeting userName={user?.name || 'Student'} />
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-300" />
                  <span className="text-blue-200 text-sm font-mono bg-blue-500/20 px-3 py-1 rounded">
                    {studentCode || "Loading..."}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Student
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/student/courses'}
                variant="primary"
                className="text-sm sm:text-base"
              >
                View Courses
              </Button>
              <Button 
                onClick={() => window.location.href = '/student/assignments'}
                variant="outline"
                className="text-sm sm:text-base border-white/20 text-white hover:bg-white/10"
              >
                My Assignments
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Welcome Message for New Students */}
      {enrolledCourses.length === 0 && !loading && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8 text-center" variant="light" hover={false}>
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Welcome to your learning journey! 🎓
            </h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              You're all set to start exploring courses, completing assignments, and achieving your goals. 
              Let's make learning fun and rewarding!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = '/student/courses'}
                variant="primary"
                className="text-sm sm:text-base"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
              <Button 
                onClick={() => window.location.href = '/student/assignments'}
                variant="outline"
                className="text-sm sm:text-base border-white/20 text-white hover:bg-white/10"
              >
                <ListChecks className="h-4 w-4 mr-2" />
                View Assignments
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Announcements - Prominent Display */}
      {announcements.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Megaphone className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-white text-xl font-bold">Latest Announcements</h2>
            </div>
            
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement, index) => (
                <motion.div 
                  key={announcement.id}
                  className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {announcement.title || 'Announcement'}
                      </h3>
                      <p className="text-blue-100 text-sm mb-2">
                        {announcement.message || announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-blue-200">
                        {announcement.teachers?.name && (
                          <span>From: {announcement.teachers.name}</span>
                        )}
                        {announcement.created_at && (
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        )}
                        {announcement.priority && announcement.priority !== 'normal' && (
                          <Badge 
                            variant="secondary" 
                            className={`${
                              announcement.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                              announcement.priority === 'urgent' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {announcement.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {announcements.length > 3 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/student/discussions'}
                  className="text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
                >
                  View All Announcements
                </Button>
              </div>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Simplified Stats Overview */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <StatCard
          title="Courses"
          value={stats.totalCourses}
          description="Enrolled"
          icon={BookOpen}
          iconColor="blue"
        />
        
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          description="Total Tasks"
          icon={ListChecks}
          iconColor="green"
        />
        
        <StatCard
          title="Completed"
          value={stats.completedAssignments}
          description="Finished"
          icon={Award}
          iconColor="purple"
        />
        
        <StatCard
          title="Due Soon"
          value={stats.upcomingAssignments}
          description="Upcoming"
          icon={Clock}
          iconColor="orange"
        />
      </motion.div>

      {/* Progress Overview - Simplified */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-white text-lg font-semibold">Your Progress</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Assignment Completion</span>
                <span className="text-white font-medium">
                  {stats.totalAssignments > 0 ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0} 
                className="h-3" 
              />
              <p className="text-slate-400 text-xs mt-2">
                {stats.completedAssignments} of {stats.totalAssignments} assignments completed
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">On-Time Submission</span>
                <span className="text-white font-medium">
                  {stats.totalAssignments > 0 ? Math.round(((stats.totalAssignments - stats.overdueAssignments) / stats.totalAssignments) * 100) : 100}%
                </span>
              </div>
              <Progress 
                value={stats.totalAssignments > 0 ? ((stats.totalAssignments - stats.overdueAssignments) / stats.totalAssignments) * 100 : 100} 
                className="h-3" 
              />
              <p className="text-slate-400 text-xs mt-2">
                {stats.overdueAssignments} overdue assignments
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick Actions - Simplified */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <QuickActionCard
          title="My Courses"
          description="Access modules and lessons"
          icon={BookOpen}
          iconColor="blue"
          href="/student/courses"
        />
        
        <QuickActionCard
          title="Assignments"
          description="View and submit tasks"
          icon={ListChecks}
          iconColor="green"
          href="/student/assignments"
        />
        
        <QuickActionCard
          title="Live Classes"
          description="Join live sessions"
          icon={Users}
          iconColor="purple"
          href="/student/live-class"
        />
        
        <QuickActionCard
          title="Discussions"
          description="View announcements and discussions"
          icon={MessageSquare}
          iconColor="blue"
          href="/student/discussions"
        />
      </motion.div>

      {/* Recent Assignments - Simplified */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <ListChecks className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold">Recent Assignments</h2>
                <p className="text-slate-400 text-sm">Your latest tasks and deadlines</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/student/assignments'}
              className="text-orange-300 border-orange-500/30 hover:bg-orange-500/10"
            >
              View All
            </Button>
          </div>
          
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.slice(0, 4).map((assignment, index) => (
                <motion.div 
                  key={assignment.id} 
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      assignment.status === 'submitted' || assignment.status === 'graded' 
                        ? 'bg-green-500/20' 
                        : new Date(assignment.due_at) < new Date() 
                        ? 'bg-red-500/20' 
                        : 'bg-blue-500/20'
                    }`}>
                      {assignment.status === 'submitted' || assignment.status === 'graded' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : new Date(assignment.due_at) < new Date() ? (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{assignment.title}</h3>
                      <p className="text-slate-400 text-sm mb-2">{assignment.course_title}</p>
                      {assignment.due_at && (
                        <p className={`text-xs ${
                          new Date(assignment.due_at) < new Date() 
                            ? 'text-red-400' 
                            : 'text-slate-500'
                        }`}>
                          Due: {new Date(assignment.due_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ListChecks className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No assignments yet</p>
              <p className="text-slate-500 text-sm">Your teachers will assign tasks here</p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
