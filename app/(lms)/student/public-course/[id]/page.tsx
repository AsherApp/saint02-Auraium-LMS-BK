"use client"

import type React from "react"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  ArrowLeft,
  Award,
  Clock,
  User
} from "lucide-react"
import { CertificateDownload } from "@/components/shared/certificate-download"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { motion } from "framer-motion"

export default function PublicStudentCourseDetailPage() {
  const params = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completionStatus, setCompletionStatus] = useState<any>({})

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!params.id || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch course details
        const courseResponse = await http<any>(`/api/courses/${params.id}`)
        setCourse(courseResponse)
        
        // Fetch modules
        const modulesResponse = await http<any>(`/api/modules/course/${params.id}`)
        const modulesData = modulesResponse.items || []
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
              return {
                ...module,
                lessons: lessonsResponse.items || []
              }
            } catch (error) {
              console.error(`Failed to fetch lessons for module ${module.id}:`, error)
              return {
                ...module,
                lessons: []
              }
            }
          })
        )
        
        setModules(modulesWithLessons)
        
        // Fetch completion status
        const completionResponse = await http<any>(`/api/progress/course/${params.id}`)
        setCompletionStatus(completionResponse || {})
        
      } catch (error) {
        console.error('Failed to fetch course data:', error)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [params.id, user?.email])

  const getModuleProgress = (module: any) => {
    if (!completionStatus.modules) return 0
    const moduleProgress = completionStatus.modules[module.id]
    if (!moduleProgress) return 0
    
    const totalLessons = module.lessons.length
    const completedLessons = moduleProgress.completed_lessons || 0
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const getOverallProgress = () => {
    if (!completionStatus.overall) return 0
    return completionStatus.overall.percentage || 0
  }

  const isCourseCompleted = () => {
    return getOverallProgress() === 100
  }


  const startCourse = () => {
    // Navigate to the first lesson of the first module
    if (modules.length > 0 && modules[0].lessons.length > 0) {
      window.location.href = `/student/public-study/${params.id}/${modules[0].id}/${modules[0].lessons[0].id}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-slate-700 rounded-lg mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Course Not Found</h2>
            <p className="text-slate-300 mb-6">{error || 'The requested course could not be found.'}</p>
            <Button asChild>
              <Link href="/student/public-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/student/public-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-slate-300 text-lg mb-4">{course.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Instructor: {course.teacher_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{modules.length} Modules</span>
                </div>
                <Badge variant="outline" className="text-purple-300 border-purple-300">
                  Public Mode
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Course Progress</h2>
              <Badge variant={isCourseCompleted() ? "default" : "secondary"}>
                {isCourseCompleted() ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                <span>Overall Progress</span>
                <span>{getOverallProgress()}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-3" />
            </div>
            
            {isCourseCompleted() && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-green-400">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">Course Completed!</span>
                </div>
                <CertificateDownload
                  courseId={params.id}
                  studentId={user?.email || ''}
                  courseTitle={course?.title}
                  studentName={user?.name}
                  size="sm"
                />
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Course Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Course Content</h2>
          
          {modules.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Content Available</h3>
              <p className="text-slate-300">
                This course doesn't have any modules or lessons yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => {
                const moduleProgress = getModuleProgress(module)
                const isModuleCompleted = moduleProgress === 100
                
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * moduleIndex }}
                  >
                    <GlassCard className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Module {moduleIndex + 1}: {module.title}
                          </h3>
                          <p className="text-slate-300 text-sm mb-3">
                            {module.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{module.lessons.length} Lessons</span>
                            <span>Estimated {module.estimated_duration || 30} minutes</span>
                          </div>
                        </div>
                        
                        <Badge variant={isModuleCompleted ? "default" : "secondary"}>
                          {isModuleCompleted ? 'Completed' : `${moduleProgress}%`}
                        </Badge>
                      </div>
                      
                      <div className="mb-4">
                        <Progress value={moduleProgress} className="h-2" />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          asChild 
                          className="flex-1"
                          variant="outline"
                        >
                          <Link href={`/student/public-study/${params.id}/${module.id}`}>
                            {isModuleCompleted ? 'Review Module' : 'Start Module'}
                          </Link>
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
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
                  This is a simplified learning experience. You can only access course content 
                  and must complete lessons in order. No assignments, live classes, or discussions 
                  are available. Complete all modules to earn your certificate.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
