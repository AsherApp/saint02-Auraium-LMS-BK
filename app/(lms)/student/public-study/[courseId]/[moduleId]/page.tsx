"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { http } from "@/services/http"
import { useAuthStore } from "@/store/auth-store"
import {
  BookOpen, 
  Play,
  CheckCircle,
  Clock,
  ArrowLeft,
  Lock,
  Award
} from "lucide-react"
import { motion } from "framer-motion"

interface Lesson {
  id: string
  title: string
  type: string
  duration?: number
  order: number
}

interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  order: number
  estimated_duration?: number
}

export default function PublicModuleStudyPage() {
  const params = useParams<{ courseId: string; moduleId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [module, setModule] = useState<Module | null>(null)
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  // Fetch module data
  useEffect(() => {
    const fetchModuleData = async () => {
      if (!params.courseId || !params.moduleId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch course details
        const courseResponse = await http<any>(`/api/courses/${params.courseId}`)
        
        // Check if course is in public mode
        if (courseResponse.course_mode !== 'public') {
          setError('This course is not available in public mode')
          return
        }
        
        setCourse(courseResponse)
        
        // Fetch module details
        const moduleResponse = await http<any>(`/api/modules/${params.moduleId}`)
        
        // Fetch lessons for this module
        const lessonsResponse = await http<any>(`/api/lessons/module/${params.moduleId}`)
        const lessons = (lessonsResponse.items || []).sort((a: any, b: any) => a.order - b.order)
        
        setModule({
          ...moduleResponse,
          lessons: lessons
        })
        
        // Fetch progress
        const progressResponse = await http<any>(`/api/progress/course/${params.courseId}`)
        if (progressResponse?.completed_lessons) {
          setCompletedLessons(new Set(progressResponse.completed_lessons))
        }
        
      } catch (error) {
        console.error('Failed to fetch module data:', error)
        setError('Failed to load module data')
      } finally {
        setLoading(false)
      }
    }

    fetchModuleData()
  }, [params.courseId, params.moduleId, user?.email])

  const getModuleProgress = () => {
    if (!module) return 0
    const completedCount = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length
    return module.lessons.length > 0 ? Math.round((completedCount / module.lessons.length) * 100) : 0
  }

  const isLessonAccessible = (lesson: Lesson, index: number) => {
    if (index === 0) return true // First lesson is always accessible
    
    // Check if previous lesson is completed
    const previousLesson = module?.lessons[index - 1]
    return previousLesson ? completedLessons.has(previousLesson.id) : false
  }

  const startLesson = (lesson: Lesson) => {
    router.push(`/student/public-study/${params.courseId}/${params.moduleId}/${lesson.id}`)
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
                <div key={i} className="h-20 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Module Not Found</h2>
            <p className="text-slate-300 mb-6">{error || 'The requested module could not be found.'}</p>
            <Button asChild>
              <a href={`/student/public-course/${params.courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </a>
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
            <a href={`/student/public-course/${params.courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </a>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{module.title}</h1>
              <p className="text-slate-300 text-lg mb-4">{module.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{module.lessons.length} Lessons</span>
                </div>
                {module.estimated_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>~{module.estimated_duration} minutes</span>
                  </div>
                )}
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
              <h2 className="text-xl font-semibold text-white">Module Progress</h2>
              <Badge variant={getModuleProgress() === 100 ? "default" : "secondary"}>
                {getModuleProgress() === 100 ? 'Completed' : `${getModuleProgress()}%`}
              </Badge>
            </div>
            
            <div className="mb-4">
              <Progress value={getModuleProgress()} className="h-3" />
            </div>
            
            <div className="text-sm text-slate-300">
              {module.lessons.filter(lesson => completedLessons.has(lesson.id)).length} of {module.lessons.length} lessons completed
            </div>
          </GlassCard>
        </motion.div>

        {/* Lessons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Lessons</h2>
          
          {module.lessons.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Lessons Available</h3>
              <p className="text-slate-300">
                This module doesn't have any lessons yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {module.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.has(lesson.id)
                const isAccessible = isLessonAccessible(lesson, index)
                
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <GlassCard className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                            ) : isAccessible ? (
                              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                <Play className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                                <Lock className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>Lesson {index + 1}</span>
                              {lesson.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{lesson.duration} min</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {lesson.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                              Completed
                            </Badge>
                          )}
                          
                          <Button
                            onClick={() => startLesson(lesson)}
                            disabled={!isAccessible}
                            variant={isAccessible ? "default" : "outline"}
                            size="sm"
                          >
                            {isCompleted ? 'Review' : isAccessible ? 'Start' : 'Locked'}
                          </Button>
                        </div>
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
                  Complete lessons in order to unlock the next content. You must finish each lesson 
                  before proceeding to the next one. This ensures you get the full learning experience.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
