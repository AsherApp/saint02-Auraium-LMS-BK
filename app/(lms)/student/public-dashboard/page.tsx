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
  GraduationCap,
  Download,
  Eye
} from "lucide-react"
import { motion } from "framer-motion"

export default function PublicStudentDashboardPage() {
  const { user } = useAuthStore()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [studentCode, setStudentCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debug logging
  useEffect(() => {
    console.log('Public Student Dashboard - User:', user)
    console.log('Public Student Dashboard - Auth Token:', localStorage.getItem('auth-token'))
  }, [user])

  useEffect(() => {
    if (!user?.email) {
      console.log('Public Student Dashboard - No user email, returning early')
      return
    }

    console.log('Public Student Dashboard - Fetching data for user:', user.email)
    setLoading(true)
    setError(null)
    
    const fetchStudentData = async () => {
      try {
        console.log('Public Student Dashboard - Fetching courses...')
        // Get enrolled courses
        const coursesResponse = await http<any>(`/api/students/me/enrollments`)
        console.log('Public Student Dashboard - Courses response:', coursesResponse)
        const enrolledCourses = coursesResponse.items || []
        
        // Filter only public mode courses
        const publicCourses = enrolledCourses.filter((course: any) => 
          course.course?.course_mode === 'public'
        )
        
        console.log('Public Student Dashboard - Public courses:', publicCourses)
        setEnrolledCourses(publicCourses)
        
        // Get announcements for public courses
        if (publicCourses.length > 0) {
          const announcementPromises = publicCourses.map(async (course: any) => {
            try {
              const announcementsResponse = await http<any>(`/api/announcements?course_id=${course.course_id}`)
              return (announcementsResponse.items || []).map((announcement: any) => ({
                ...announcement,
                course_title: course.course?.title || "Unknown Course"
              }))
            } catch (err) {
              console.error(`Failed to fetch announcements for course ${course.course_id}:`, err)
              return []
            }
          })
          
          const allAnnouncements = await Promise.all(announcementPromises)
          setAnnouncements(allAnnouncements.flat())
        }
        
        // Get student code
        if (user.student_code) {
          setStudentCode(user.student_code)
        }
        
      } catch (err) {
        console.error('Public Student Dashboard - Error fetching data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [user?.email])

  // Calculate stats for public courses only
  const totalCourses = enrolledCourses.length
  const completedCourses = enrolledCourses.filter(course => 
    course.progress_percentage >= 100
  ).length
  const inProgressCourses = enrolledCourses.filter(course => 
    course.progress_percentage > 0 && course.progress_percentage < 100
  ).length
  const avgProgress = enrolledCourses.length > 0 
    ? Math.round(enrolledCourses.reduce((sum, course) => sum + (course.progress_percentage || 0), 0) / enrolledCourses.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your public learning dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <Greeting name={user?.name || user?.email || 'Student'} />
              <p className="text-slate-300 mt-2">
                Welcome to your public learning environment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Eye className="h-3 w-3 mr-1" />
                Public Learning Mode
              </Badge>
              {studentCode && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <User className="h-3 w-3 mr-1" />
                  {studentCode}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Public Courses"
            value={totalCourses}
            icon={<BookOpen className="h-5 w-5" />}
            trend="+0%"
            description="Available courses"
          />
          <StatCard
            title="Completed"
            value={completedCourses}
            icon={<CheckCircle2 className="h-5 w-5" />}
            trend="+0%"
            description="Finished courses"
          />
          <StatCard
            title="In Progress"
            value={inProgressCourses}
            icon={<Clock className="h-5 w-5" />}
            trend="+0%"
            description="Active learning"
          />
          <StatCard
            title="Avg Progress"
            value={`${avgProgress}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend="+0%"
            description="Overall completion"
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Public Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Public Courses
                  </h2>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {totalCourses} Available
                  </Badge>
                </div>

                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No public courses available</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Contact your instructor to get access to public courses
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course, index) => (
                      <motion.div
                        key={course.course_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              {course.course?.title || 'Untitled Course'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {course.course?.description || 'No description available'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                              Public
                            </Badge>
                            {course.progress_percentage >= 100 && (
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                <Award className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{course.progress_percentage || 0}%</span>
                          </div>
                          <Progress 
                            value={course.progress_percentage || 0} 
                            className="h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Enrolled {new Date(course.enrolled_at).toLocaleDateString()}
                            </span>
                            {course.last_activity && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-4 w-4" />
                                Last active {new Date(course.last_activity).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/student/public-course/${course.course_id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View Course
                              </Button>
                            </Link>
                            {course.progress_percentage >= 100 && (
                              <Button size="sm" variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
                                <Download className="h-4 w-4 mr-1" />
                                Certificate
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Recent Announcements
                    </h2>
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {announcements.length} New
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((announcement, index) => (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-medium text-white">
                            {announcement.title}
                          </h3>
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {announcement.course_title}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Posted {new Date(announcement.created_at).toLocaleDateString()}</span>
                          <span>By {announcement.teacher_name || 'Instructor'}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </h2>
                
                <div className="space-y-4">
                  <QuickActionCard
                    title="View All Courses"
                    description="Browse your public courses"
                    icon={<BookOpen className="h-5 w-5" />}
                    href="/student/courses"
                    variant="default"
                  />
                  <QuickActionCard
                    title="My Notes"
                    description="Access your study notes"
                    icon={<FileText className="h-5 w-5" />}
                    href="/student/notes"
                    variant="outline"
                  />
                  <QuickActionCard
                    title="Settings"
                    description="Manage your profile"
                    icon={<User className="h-5 w-5" />}
                    href="/student/settings"
                    variant="outline"
                  />
                </div>
              </GlassCard>
            </motion.div>

            {/* Public Learning Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-6 bg-blue-500/10 border-blue-500/20">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Public Learning Mode
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    You're in a simplified learning environment with access to public courses, 
                    notes, and basic features.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>✓ Course content and study materials</p>
                    <p>✓ Progress tracking and certificates</p>
                    <p>✓ Notes and personal settings</p>
                    <p>✗ Assignments and live classes (restricted)</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}