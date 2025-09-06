"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { http } from "@/services/http"
import { useAuthStore } from "@/store/auth-store"
import { ProgressAPI } from '@/services/progress/api'
import { UniversalMediaPlayer } from "@/components/shared/universal-media-player"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen, 
  FileText,
  Video, 
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Award,
  Lock,
  Download
} from "lucide-react"
import { motion } from "framer-motion"

interface Lesson {
  id: string
  title: string
  type: string
  content: any
  duration?: number
  order: number
}

interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  modules: Module[]
}

export default function PublicStudyAreaPage() {
  const params = useParams<{ courseId: string; moduleId: string; lessonId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Progress tracking
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [courseProgress, setCourseProgress] = useState<any>(null)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [currentLessonProgress, setCurrentLessonProgress] = useState({
    timeSpent: 0,
    lastUpdate: Date.now()
  })
  
  // Navigation state
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)

  // Get current lesson and module
  const currentModule = course?.modules[currentModuleIndex]
  const selectedLesson = currentModule?.lessons[currentLessonIndex]

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!params.courseId || !user?.email) return
      
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
        
        // Fetch modules
        const modulesResponse = await http<any>(`/api/modules/course/${params.courseId}`)
        const modulesData = modulesResponse.items || []
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: any) => {
            try {
              const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
              return {
                ...module,
                lessons: (lessonsResponse.items || []).sort((a: any, b: any) => a.order - b.order)
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
        
        // Sort modules by order
        const sortedModules = modulesWithLessons.sort((a: any, b: any) => a.order - b.order)
        
        setCourse({
          ...courseResponse,
          modules: sortedModules
        })
        
        // Find current module and lesson indices
        const moduleIndex = sortedModules.findIndex((m: any) => m.id === params.moduleId)
        if (moduleIndex !== -1) {
          setCurrentModuleIndex(moduleIndex)
          const lessonIndex = sortedModules[moduleIndex].lessons.findIndex((l: any) => l.id === params.lessonId)
          if (lessonIndex !== -1) {
            setCurrentLessonIndex(lessonIndex)
          }
        }
        
        // Fetch progress
        const progressResponse = await http<any>(`/api/progress/course/${params.courseId}`)
        setCourseProgress(progressResponse)
        
        if (progressResponse?.completed_lessons) {
          setCompletedLessons(new Set(progressResponse.completed_lessons))
        }
        
      } catch (error) {
        console.error('Failed to fetch course data:', error)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [params.courseId, params.moduleId, params.lessonId, user?.email])

  // Mark lesson as complete
  const markLessonComplete = async () => {
    if (!selectedLesson || markingComplete) return
    
    setMarkingComplete(true)
    
    try {
      await ProgressAPI.markLessonComplete(
        params.courseId!,
        params.moduleId!,
        selectedLesson.id,
        user?.email!
      )
      
      setCompletedLessons(prev => new Set([...prev, selectedLesson.id]))
      setLessonCompleted(true)
      
      toast({
        title: "Lesson Completed!",
        description: "Great job! You've completed this lesson.",
      })
      
      // Check if course is completed
      const allLessons = course?.modules.flatMap(m => m.lessons) || []
      const completedCount = allLessons.filter(l => 
        l.id === selectedLesson.id || completedLessons.has(l.id)
      ).length
      
      if (completedCount === allLessons.length) {
        // Course completed - generate certificate
        try {
          await http<any>(`/api/certificates/complete`, {
            method: 'POST',
            body: JSON.stringify({ courseId: params.courseId })
          })
          
          toast({
            title: "Course Completed!",
            description: "Congratulations! You've completed the entire course. Your certificate is ready for download.",
          })
        } catch (error) {
          console.error('Failed to generate certificate:', error)
        }
      }
      
    } catch (error) {
      console.error('Failed to mark lesson complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive"
      })
    } finally {
      setMarkingComplete(false)
    }
  }

  // Navigation functions
  const handleNextLesson = () => {
    if (!currentModule) return
    
    const nextLessonIndex = currentLessonIndex + 1
    if (nextLessonIndex < currentModule.lessons.length) {
      const nextLesson = currentModule.lessons[nextLessonIndex]
      router.push(`/student/public-study/${params.courseId}/${params.moduleId}/${nextLesson.id}`)
    } else {
      // Move to next module
      const nextModuleIndex = currentModuleIndex + 1
      if (nextModuleIndex < (course?.modules.length || 0)) {
        const nextModule = course?.modules[nextModuleIndex]
        if (nextModule && nextModule.lessons.length > 0) {
          router.push(`/student/public-study/${params.courseId}/${nextModule.id}/${nextModule.lessons[0].id}`)
        }
      }
    }
  }

  const handlePreviousLesson = () => {
    if (!currentModule) return
    
    const prevLessonIndex = currentLessonIndex - 1
    if (prevLessonIndex >= 0) {
      const prevLesson = currentModule.lessons[prevLessonIndex]
      router.push(`/student/public-study/${params.courseId}/${params.moduleId}/${prevLesson.id}`)
    } else {
      // Move to previous module
      const prevModuleIndex = currentModuleIndex - 1
      if (prevModuleIndex >= 0) {
        const prevModule = course?.modules[prevModuleIndex]
        if (prevModule && prevModule.lessons.length > 0) {
          router.push(`/student/public-study/${params.courseId}/${prevModule.id}/${prevModule.lessons[prevModule.lessons.length - 1].id}`)
        }
      }
    }
  }

  const canNavigateNext = () => {
    if (!currentModule) return false
    
    // Can go to next lesson in same module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return true
    }
    
    // Can go to next module
    if (currentModuleIndex < (course?.modules.length || 0) - 1) {
      return true
    }
    
    return false
  }

  const canNavigatePrevious = () => {
    if (!currentModule) return false
    
    // Can go to previous lesson in same module
    if (currentLessonIndex > 0) {
      return true
    }
    
    // Can go to previous module
    if (currentModuleIndex > 0) {
      return true
    }
    
    return false
  }

  const isLessonAccessible = (lesson: Lesson) => {
    if (!currentModule) return false
    
    const lessonIndex = currentModule.lessons.findIndex(l => l.id === lesson.id)
    if (lessonIndex === 0) return true // First lesson is always accessible
    
    // Check if previous lesson is completed
    const previousLesson = currentModule.lessons[lessonIndex - 1]
    return completedLessons.has(previousLesson.id)
  }

  const renderLessonContent = () => {
    if (!selectedLesson) return null
    
    // Handle different content types
    if (selectedLesson.content?.video?.url) {
      const videoUrl = selectedLesson.content.video.url
      
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg">
            <video
              controls
              className="w-full h-full rounded-lg"
              src={videoUrl}
              poster={selectedLesson.content.video.thumbnail_url}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement
                const currentTime = video.currentTime
                const duration = video.duration
                
                // Update progress based on video progress
                if (duration > 0) {
                  const progress = (currentTime / duration) * 100
                  setCurrentLessonProgress(prev => ({
                    ...prev,
                    timeSpent: Math.floor(progress)
                  }))
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          {selectedLesson.content.video.description && (
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-slate-300">{selectedLesson.content.video.description}</p>
            </div>
          )}
        </div>
      )
    }
    
    if (selectedLesson.content?.text) {
      return (
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: selectedLesson.content.text }}
          />
        </div>
      )
    }
    
    if (selectedLesson.content?.file) {
      return (
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-lg text-center">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">File Content</h3>
            <p className="text-slate-300 mb-4">{selectedLesson.content.file.description}</p>
            <Button variant="outline" asChild>
              <a href={selectedLesson.content.file.url} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Content Available</h3>
        <p className="text-slate-300">This lesson doesn't have any content yet.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 h-96 bg-slate-700 rounded-lg"></div>
              <div className="lg:col-span-3 h-96 bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Study Area Unavailable</h2>
            <p className="text-slate-300 mb-6">{error || 'The requested course could not be found.'}</p>
            <Button asChild>
              <a href="/student/public-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </a>
            </Button>
          </GlassCard>
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
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-slate-300">
                Module {currentModuleIndex + 1}: {currentModule?.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-300 border-purple-300">
                Public Mode
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-4">Course Content</h3>
                <div className="space-y-2">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <span>Module {moduleIndex + 1}</span>
                        {moduleIndex === currentModuleIndex && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="ml-4 space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isCompleted = completedLessons.has(lesson.id)
                          const isCurrent = lesson.id === selectedLesson?.id
                          const isAccessible = isLessonAccessible(lesson)
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                if (isAccessible) {
                                  router.push(`/student/public-study/${params.courseId}/${module.id}/${lesson.id}`)
                                }
                              }}
                              className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                isCurrent
                                  ? 'bg-purple-500/20 text-white'
                                  : isAccessible
                                  ? 'text-slate-300 hover:bg-white/5'
                                  : 'text-slate-500 cursor-not-allowed'
                              }`}
                              disabled={!isAccessible}
                            >
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : isAccessible ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${showSidebar ? 'lg:col-span-3' : 'lg:col-span-4'}`}
          >
            <GlassCard className="p-6">
              {selectedLesson ? (
                <div className="space-y-6">
                  {/* Lesson Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2">
                        {selectedLesson.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Lesson {currentLessonIndex + 1} of {currentModule?.lessons.length}</span>
                        {selectedLesson.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{selectedLesson.duration} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {completedLessons.has(selectedLesson.id) && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Lesson Content */}
                  <div className="min-h-[400px]">
                    {renderLessonContent()}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                    <Button
                      variant="outline"
                      onClick={handlePreviousLesson}
                      disabled={!canNavigatePrevious()}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-4">
                      {!completedLessons.has(selectedLesson.id) && (
                        <Button
                          onClick={markLessonComplete}
                          disabled={markingComplete}
                          variant="success"
                        >
                          {markingComplete ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Marking Complete...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={handleNextLesson}
                        disabled={!canNavigateNext()}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Lesson Selected</h3>
                  <p className="text-slate-300">Please select a lesson from the sidebar to begin.</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Public Mode Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <GlassCard className="p-4 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Award className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Public Learning Mode</h4>
                <p className="text-slate-300 text-sm">
                  Complete lessons in order to unlock the next content. No skipping allowed in public mode.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
