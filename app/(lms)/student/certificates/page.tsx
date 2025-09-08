"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { CourseCompletionCertificate } from "@/components/shared/course-completion-certificate"
import { getUserDisplayName } from "@/utils/name-utils"
import { 
  Award, 
  Download, 
  Eye, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  Clock,
  GraduationCap,
  Star,
  Trophy
} from "lucide-react"

interface CourseCompletion {
  course_id: string
  course_title: string
  completion_percentage: number
  completed_lessons: number
  total_lessons: number
  completed_assignments: number
  total_assignments: number
  passed_quizzes: number
  total_quizzes: number
  started_at: string
  completed_at?: string
  certificate_issued?: boolean
  certificate_url?: string
}

export default function StudentCertificatesPage() {
  const { user } = useAuthStore()
  const [completedCourses, setCompletedCourses] = useState<CourseCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseCompletion | null>(null)

  useEffect(() => {
    if (!user?.email) return
    fetchCompletedCourses()
  }, [user?.email])

  const fetchCompletedCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get student's course progress
      const progressResponse = await http<any>(`/api/students/me/progress`)
      const progressData = progressResponse.items || []
      
      // Filter for completed courses (100% completion)
      const completed = progressData.filter((course: any) => 
        course.completion_percentage >= 100 && course.course?.course_mode === 'public'
      )
      
      setCompletedCourses(completed)
    } catch (err: any) {
      console.error('Error fetching completed courses:', err)
      setError(err.message || "Failed to fetch completed courses")
    } finally {
      setLoading(false)
    }
  }

  const handleViewCertificate = (course: CourseCompletion) => {
    setSelectedCourse(course)
    setShowCertificate(true)
  }

  const handleDownloadCertificate = async (course: CourseCompletion) => {
    try {
      // Generate certificate PDF
      const response = await http<any>(`/api/certificates/generate`, {
        method: 'POST',
        body: {
          course_id: course.course_id,
          student_email: user?.email,
          student_name: getUserDisplayName(user),
          completion_date: course.completed_at || new Date().toISOString()
        }
      })
      
      if (response.certificate_url) {
        // Download the certificate
        window.open(response.certificate_url, '_blank')
      }
    } catch (err: any) {
      console.error('Error generating certificate:', err)
      alert('Failed to generate certificate. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading certificates...</p>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <div className="text-red-300 mb-4">Error: {error}</div>
            <Button onClick={fetchCompletedCourses} variant="outline">
              Try Again
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-yellow-400" />
            My Certificates
          </h1>
          <p className="text-slate-400 mt-1">View and download your course completion certificates</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedCourses.length}</p>
              <p className="text-slate-400 text-sm">Certificates Earned</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {completedCourses.reduce((sum, course) => sum + course.completed_lessons, 0)}
              </p>
              <p className="text-slate-400 text-sm">Lessons Completed</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Star className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {completedCourses.length > 0 ? Math.round(completedCourses.reduce((sum, course) => sum + course.completion_percentage, 0) / completedCourses.length) : 0}%
              </p>
              <p className="text-slate-400 text-sm">Average Completion</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Certificates List */}
      {completedCourses.length === 0 ? (
        <GlassCard className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Certificates Yet</h3>
            <p className="text-slate-400 mb-6">
              Complete your public courses to earn certificates. Keep learning to unlock your achievements!
            </p>
            <Button 
              onClick={() => window.location.href = '/student/courses'}
              className="bg-blue-600/80 hover:bg-blue-600"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Courses
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedCourses.map((course) => (
            <GlassCard key={course.course_id} className="p-6 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Award className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm line-clamp-2">
                      {course.course_title}
                    </h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Completed
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Completion</span>
                  <span className="text-white font-medium">{course.completion_percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Lessons</span>
                  <span className="text-white">{course.completed_lessons}/{course.total_lessons}</span>
                </div>
                {course.completed_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Completed</span>
                    <span className="text-white">
                      {new Date(course.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewCertificate(course)}
                  className="flex-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadCertificate(course)}
                  className="flex-1 bg-yellow-600/80 hover:bg-yellow-600 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && selectedCourse && (
        <CourseCompletionCertificate
          courseTitle={selectedCourse.course_title}
          studentName={getUserDisplayName(user)}
          completionDate={selectedCourse.completed_at || new Date().toISOString()}
          courseId={selectedCourse.course_id}
          totalLessons={selectedCourse.total_lessons}
          completedLessons={selectedCourse.completed_lessons}
          totalAssignments={selectedCourse.total_assignments}
          completedAssignments={selectedCourse.completed_assignments}
          totalQuizzes={selectedCourse.total_quizzes}
          passedQuizzes={selectedCourse.passed_quizzes}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  )
}
