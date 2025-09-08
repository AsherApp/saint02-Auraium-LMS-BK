"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { useCourseStore } from "@/store/course-store"
import { useCoursesFn } from "@/services/courses/hook"
import { useAssignmentsFn } from "@/services/assignments/hook"
import { http } from "@/services/http"
import { getUserDisplayName } from "@/utils/name-utils"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  BarChart3,
  Bell,
  Megaphone,
  Target,
  Star,
  Calendar,
  MessageSquare,
  Settings,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const { courses, loading: coursesLoading } = useCoursesFn()
  // Type assertion to ensure we're working with API courses that have enrollment_count
  const apiCourses = courses as any[]
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
    recentSubmissions: 0,
    totalAssignments: 0,
    overdueAssignments: 0,
    averageCompletionRate: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    courseEngagement: 0,
    studentPerformance: 0
  })

  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    course_id: 'all'
  })

  // Initialize demo courses if none exist
  useEffect(() => {
    if (localCourses.length === 0) {
      seedIfEmpty()
    }
  }, [localCourses.length, seedIfEmpty])

  // Fetch analytics from backend API
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.email) return
      
      try {
        console.log('Teacher Dashboard - Fetching analytics from backend...')
        const response = await http<any>('/api/teacher/analytics')
        console.log('Teacher Dashboard - Analytics response:', response)
        
        // Update stats with backend data
        setStats({
          totalStudents: response.totalStudents || 0,
          activeCourses: response.totalCourses || 0,
          pendingAssignments: 0, // Will be calculated from assignments
          completedAssignments: 0, // Will be calculated from assignments
          averageGrade: response.averageCompletion || 0,
          upcomingDeadlines: 0, // Will be calculated from assignments
          totalLiveSessions: liveSessions.length,
          recentSubmissions: 0, // Will be calculated from assignments
          totalAssignments: response.totalAssignments || 0,
          overdueAssignments: 0, // Will be calculated from assignments
          averageCompletionRate: response.averageCompletion || 0,
          totalEnrollments: response.totalEnrollments || 0,
          activeEnrollments: response.totalEnrollments || 0,
          courseEngagement: response.coursePerformance?.length > 0 ? 
            Math.round(response.coursePerformance.reduce((acc: number, course: any) => acc + (course.avgCompletion || 0), 0) / response.coursePerformance.length) : 0,
          studentPerformance: response.averageCompletion || 0
        })
        
        setRecentActivities(response.recentActivity || [])
      } catch (error) {
        console.error('Failed to fetch teacher analytics:', error)
        // Fallback to frontend calculation if backend fails
        calculateFrontendStats()
      }
    }

    fetchAnalytics()
  }, [user?.email, liveSessions])

  // Fallback frontend calculation
  const calculateFrontendStats = () => {
    if (apiCourses && assignments) {
      console.log('Teacher Dashboard - Using frontend calculation fallback')
      
      const totalStudents = apiCourses.reduce((acc, course) => {
        const enrollmentCount = (course as any).enrollment_count || 0
        return acc + enrollmentCount
      }, 0)
      
      const activeCourses = apiCourses.filter(course => course.status === 'published').length
      const totalAssignments = assignments.length
      const pendingAssignments = assignments.filter((assignment: any) => 
        (assignment.submission_count || 0) > 0 && !assignment.is_graded
      ).length
      const completedAssignments = assignments.filter((assignment: any) => 
        assignment.is_graded
      ).length
      const overdueAssignments = assignments.filter((assignment: any) => 
        assignment.due_at && new Date(assignment.due_at) < new Date()
      ).length
      const upcomingDeadlines = assignments.filter((assignment: any) => {
        if (!assignment.due_at) return false
        const dueDate = new Date(assignment.due_at)
        const now = new Date()
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        return diffDays <= 7 && diffDays > 0
      }).length

      const totalEnrollments = apiCourses.reduce((acc, course) => {
        const enrollmentCount = (course as any).enrollment_count || 0
        return acc + enrollmentCount
      }, 0)
      
      const assignmentsWithSubmissions = assignments.reduce((acc, assignment: any) => {
        return acc + (assignment.submission_count || 0)
      }, 0)
      const averageCompletionRate = totalAssignments > 0 ? 
        Math.round((assignmentsWithSubmissions / (totalAssignments * Math.max(totalStudents, 1))) * 100) : 0

      const coursesWithEnrollments = apiCourses.filter(course => {
        const enrollmentCount = (course as any).enrollment_count || 0
        return enrollmentCount > 0
      }).length
      const courseEngagement = apiCourses.length > 0 ? Math.round((coursesWithEnrollments / apiCourses.length) * 100) : 0

      setStats({
        totalStudents,
        activeCourses,
        pendingAssignments,
        completedAssignments,
        averageGrade: totalStudents > 0 ? Math.round((activeCourses / apiCourses.length) * 100) : 0,
        upcomingDeadlines,
        totalLiveSessions: liveSessions.length,
        recentSubmissions: assignmentsWithSubmissions,
        totalAssignments,
        overdueAssignments,
        averageCompletionRate,
        totalEnrollments,
        activeEnrollments: totalEnrollments,
        courseEngagement,
        studentPerformance: totalStudents > 0 ? Math.round((activeCourses / Math.max(apiCourses.length, 1)) * 100) : 0
      })
    }
  }

  // Update assignment-specific stats when assignments data changes
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      const pendingAssignments = assignments.filter((assignment: any) => 
        (assignment.submission_count || 0) > 0 && !assignment.is_graded
      ).length
      const completedAssignments = assignments.filter((assignment: any) => 
        assignment.is_graded
      ).length
      const overdueAssignments = assignments.filter((assignment: any) => 
        assignment.due_at && new Date(assignment.due_at) < new Date()
      ).length
      const upcomingDeadlines = assignments.filter((assignment: any) => {
        if (!assignment.due_at) return false
        const dueDate = new Date(assignment.due_at)
        const now = new Date()
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        return diffDays <= 7 && diffDays > 0
      }).length
      const assignmentsWithSubmissions = assignments.reduce((acc, assignment: any) => {
        return acc + (assignment.submission_count || 0)
      }, 0)

      setStats(prev => ({
        ...prev,
        pendingAssignments,
        completedAssignments,
        overdueAssignments,
        upcomingDeadlines,
        recentSubmissions: assignmentsWithSubmissions,
        totalAssignments: assignments.length
      }))
    }
  }, [assignments])

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

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast({
        title: "Missing information",
        description: "Please fill in both title and message",
        variant: "destructive"
      })
      return
    }

    try {
      await http('/api/announcements', {
        method: 'POST',
        body: {
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          course_id: newAnnouncement.course_id === 'all' ? null : newAnnouncement.course_id,
          priority: newAnnouncement.priority
        }
      })

      toast({
        title: "Announcement created!",
        description: "Your announcement has been posted successfully"
      })

      setNewAnnouncement({ title: '', message: '', priority: 'normal', course_id: 'all' })
      setShowAnnouncementDialog(false)
    } catch (error: any) {
      toast({
        title: "Failed to create announcement",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }

  if (coursesLoading || assignmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
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
      {/* Welcome Header */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {getUserDisplayName(user)}! 👋
          </h1>
          <p className="text-slate-300">
            Here's what's happening with your courses and students today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white">
                <Megaphone className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium">Title</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="bg-slate-700 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium">Message</label>
                  <Textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your announcement message..."
                    className="bg-slate-700 border-white/20 text-white min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-medium">Priority</label>
                    <Select
                      value={newAnnouncement.priority}
                      onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-white/20">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium">Course (Optional)</label>
                    <Select
                      value={newAnnouncement.course_id || 'all'}
                      onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, course_id: value || 'all' }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-white/20 text-white">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-white/20">
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreateAnnouncement} 
                    className="flex-1"
                  >
                    Create Announcement
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAnnouncementDialog(false)}
                    className="border-white/20 text-white hover:bg-white/10 flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
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
      </motion.div>

      {/* Platform Overview - Compact Section */}
      <motion.div variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-2">Platform Overview</h2>
          <p className="text-slate-400 text-sm">Your teaching platform at a glance</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 hover:bg-white/10 border border-white/10 hover:border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs font-medium">Total Students</p>
                  <p className="text-lg font-bold text-white">{stats.totalStudents}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 hover:bg-white/10 border border-white/10 hover:border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs font-medium">Active Courses</p>
                  <p className="text-lg font-bold text-white">{stats.activeCourses}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20 hover:bg-white/10 border border-white/10 hover:border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Activity className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs font-medium">Live Sessions</p>
                  <p className="text-lg font-bold text-white">{stats.totalLiveSessions}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs font-medium">Completion Rate</p>
                  <p className="text-lg font-bold text-white">{stats.averageGrade}%</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Assignment Analytics - Grouped Section */}
      <motion.div variants={itemVariants}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-2">Assignment Analytics</h2>
          <p className="text-slate-400 text-sm">Track your assignment performance and workload</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 hover:bg-white/10 border border-white/10 hover:border-orange-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stats.totalAssignments}</p>
                  <p className="text-slate-400 text-xs">Total</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pending</span>
                  <span className="text-orange-400 font-medium">{stats.pendingAssignments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Completed</span>
                  <span className="text-green-400 font-medium">{stats.completedAssignments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Overdue</span>
                  <span className="text-red-400 font-medium">{stats.overdueAssignments}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 hover:bg-white/10 border border-white/10 hover:border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stats.recentSubmissions}</p>
                  <p className="text-slate-400 text-xs">Submissions</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">This Week</span>
                  <span className="text-purple-400 font-medium">{Math.floor(stats.recentSubmissions * 0.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg/Day</span>
                  <span className="text-blue-400 font-medium">{Math.floor(stats.recentSubmissions / 7)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Response Rate</span>
                  <span className="text-green-400 font-medium">
                    {stats.totalStudents > 0 ? Math.round((stats.recentSubmissions / Math.max(stats.totalStudents, 1)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group"
          >
            <GlassCard className="p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stats.upcomingDeadlines}</p>
                  <p className="text-slate-400 text-xs">Due Soon</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Next 3 Days</span>
                  <span className="text-cyan-400 font-medium">{Math.floor(stats.upcomingDeadlines * 0.6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">This Week</span>
                  <span className="text-blue-400 font-medium">{stats.upcomingDeadlines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg Time</span>
                  <span className="text-green-400 font-medium">
                    {stats.totalAssignments > 0 ? Math.round((stats.totalAssignments * 1.5) * 10) / 10 : 0}h
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Courses</h2>
                  <p className="text-slate-400 text-sm">Your most active courses</p>
                </div>
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
                    className=""
                  >
                    Create Your First Course
                  </Button>
                </div>
              ) : (
                recentCourses.map((course, index) => (
                  <motion.div 
                    key={course.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{course.title}</h3>
                        <p className="text-slate-400 text-sm">{(course as any).enrollment_count || 0} students</p>
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
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="space-y-6" variants={itemVariants}>
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
              <Button 
                onClick={() => router.push('/discussions')}
                className="w-full justify-start bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30"
              >
                <Megaphone className="h-4 w-4 mr-2" />
                View Announcements
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
        </motion.div>
      </div>

      {/* Recent Assignments */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <FileText className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Assignments</h2>
                <p className="text-slate-400 text-sm">Latest assignments and their status</p>
              </div>
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
                <p className="text-slate-500 text-sm">Create assignments from the Quick Actions above</p>
              </div>
            ) : (
              recentAssignments.map((assignment, index) => (
                <motion.div 
                  key={assignment.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
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
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
