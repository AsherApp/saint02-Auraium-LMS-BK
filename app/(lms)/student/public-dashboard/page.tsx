"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { 
  BookOpen, 
  Award, 
  CheckCircle2,
  User,
  Calendar
} from "lucide-react"
import { CertificateDownload } from "@/components/shared/certificate-download"
import { motion } from "framer-motion"

// Course Card Component
function PublicCourseCard({ enrollment, user, index }: { enrollment: any, user: any, index: number }) {
  const course = enrollment.course_details || enrollment.courses || enrollment
  const courseId = enrollment.course_id || course.id
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch progress for each course
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const progressResponse = await http<any>(`/api/progress/course/${courseId}`)
        setProgress(progressResponse?.overall?.percentage || 0)
      } catch (error) {
        console.error('Failed to fetch course progress:', error)
        setProgress(0)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProgress()
  }, [courseId])
  
  const getCompletionStatus = (progress: number) => {
    return progress === 100 ? 'completed' : 'in-progress'
  }
  
  const status = getCompletionStatus(progress)
  const isCompleted = status === 'completed'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <GlassCard className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-2 line-clamp-2">
              {course.title || 'Untitled Course'}
            </h3>
            <p className="text-slate-300 text-sm line-clamp-2 mb-3">
              {course.description || 'No description available'}
            </p>
          </div>
          <Badge 
            variant={isCompleted ? "default" : "secondary"}
            className="ml-2"
          >
            {isCompleted ? 'Completed' : 'In Progress'}
          </Badge>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
            <span>Progress</span>
            <span>{isLoading ? '...' : `${progress}%`}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="mt-auto">
          <div className="flex gap-2">
            <Button 
              asChild 
              className="flex-1"
              variant="outline"
            >
              <Link href={`/student/public-course/${courseId}`}>
                {isCompleted ? 'Review' : 'Continue'}
              </Link>
            </Button>
            
            {isCompleted && (
              <CertificateDownload
                courseId={courseId}
                studentId={user?.email || ''}
                courseTitle={course.title}
                studentName={user?.name}
                size="sm"
                variant="outline"
                showText={false}
                className="px-3"
              />
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function PublicStudentDashboardPage() {
  const { user } = useAuthStore()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [studentCode, setStudentCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (user?.email) {
      fetchStudentData()
    }
  }, [user])

  const fetchStudentData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch enrolled courses (public mode only)
      const coursesResponse = await http<any>(`/api/students/me/enrollments`)
      const courses = coursesResponse.items || []
      
      // Filter only public mode courses and fetch full course details
      const publicCourses = courses.filter((course: any) => course.course?.course_mode === 'public')
      
      // Fetch full course details for each public course
      const coursesWithDetails = await Promise.all(
        publicCourses.map(async (enrollment: any) => {
          try {
            const courseResponse = await http<any>(`/api/courses/${enrollment.course_id}`)
            return {
              ...enrollment,
              course_details: courseResponse
            }
          } catch (err) {
            console.error(`Failed to fetch course details for ${enrollment.course_id}:`, err)
            return enrollment
          }
        })
      )
      
      setEnrolledCourses(coursesWithDetails)
      
      // Fetch announcements for public courses
      const announcementsResponse = await http<any>(`/api/announcements`)
      const allAnnouncements = announcementsResponse.items || []
      
      // Filter announcements for public courses only
      const publicAnnouncements = allAnnouncements.filter((announcement: any) => 
        publicCourses.some((course: any) => course.id === announcement.course_id)
      )
      setAnnouncements(publicAnnouncements.slice(0, 3)) // Show only latest 3
      
      // Get student code
      setStudentCode(user?.email?.split('@')[0] || '')
      
    } catch (error) {
      console.error('Failed to fetch student data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome, {user?.name || 'Student'}
              </h1>
              <p className="text-slate-300 text-lg">
                Student Code: <span className="font-mono bg-slate-800 px-2 py-1 rounded">{studentCode}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Public Learning Mode</p>
              <Badge variant="outline" className="text-purple-300 border-purple-300">
                Restricted Access
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-400" />
              Latest Announcements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement, index) => (
                <GlassCard key={announcement.id} className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {announcement.title}
                  </h3>
                  <p className="text-slate-300 text-sm line-clamp-3 mb-3">
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    <Badge variant="secondary" className="text-xs">
                      {announcement.course_title}
                    </Badge>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            Your Courses
          </h2>
          
          {enrolledCourses.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Courses Yet</h3>
              <p className="text-slate-300">
                You haven't been enrolled in any public courses yet.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment, index) => (
                <PublicCourseCard 
                  key={enrollment.course_id || enrollment.id} 
                  enrollment={enrollment} 
                  user={user} 
                  index={index} 
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Public Mode Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <GlassCard className="p-6 border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Award className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Public Learning Mode</h3>
                <p className="text-slate-300 text-sm">
                  You're in a simplified learning environment. Some features like assignments, 
                  live classes, and discussions are not available in this mode. Focus on 
                  completing the course content to earn your certificate.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
