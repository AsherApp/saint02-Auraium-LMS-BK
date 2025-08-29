"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { http } from "@/services/http"
import { useAuthStore } from "@/store/auth-store"
import { ProgressAPI } from '@/services/progress/api'
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { UniversalMediaPlayer } from "@/components/shared/universal-media-player"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen, 
  FileText,
  Video, 
  CheckCircle,
  Clock,
  Target,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  ClipboardList,
  MessageSquare,
  StickyNote,
  Plus,
  Trash2,
  Users,
  Award,
  Trophy
} from "lucide-react"

interface StudyAreaProps {
  courseId?: string
  moduleId?: string
  lessonId?: string
  title?: string
  onNavigate?: (moduleId: string, lessonId: string) => void
}

interface Lesson {
  id: string
  title: string
  type: string
  content: any
  description?: string
  duration: number
  points: number
  position: number
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  position: number
}

interface Course {
  id: string
  title: string
  description: string
  modules: Module[]
}

export function StudyArea({ courseId, moduleId, lessonId, title = "Study Area", onNavigate }: StudyAreaProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Study timer
  const [studyTimer, setStudyTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({})
  const [studyGoals, setStudyGoals] = useState<string[]>([])
  
  // Progress tracking
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [courseProgress, setCourseProgress] = useState<any>(null)
  const [markingComplete, setMarkingComplete] = useState(false)
  
  // Document and presentation viewers
  const [viewingDocument, setViewingDocument] = useState<FileInfo | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<FileInfo | null>(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<any>(null)
  const [newGoal, setNewGoal] = useState("")
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const [notes, setNotes] = useState<string>('')
  const [discussions, setDiscussions] = useState<any[]>([])
  const [newDiscussion, setNewDiscussion] = useState('')
  const [discussionEnabled, setDiscussionEnabled] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [currentLessonProgress, setCurrentLessonProgress] = useState<{
    videoWatched: boolean
    quizCompleted: boolean
    contentRead: boolean
    timeSpent: number
  }>({
    videoWatched: false,
    quizCompleted: false,
    contentRead: false,
    timeSpent: 0
  })

  // Get current module and lesson
  const currentModule = course?.modules?.[currentModuleIndex]
  const selectedLesson = currentModule?.lessons?.[currentLessonIndex]

  // Fetch course data with modules and lessons
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch course
        const courseResponse = await http<any>(`/api/courses/${courseId}`)
        
        // Fetch modules for this course
        const modulesResponse = await http<any>(`/api/modules/course/${courseId}`)
        const modules = modulesResponse.items || []
        
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modules.map(async (module: any) => {
            try {
              const lessonsResponse = await http<any>(`/api/lessons/module/${module.id}`)
              console.log(`Lessons for module ${module.id}:`, lessonsResponse.items)
              return {
                ...module,
                lessons: lessonsResponse.items || []
              }
            } catch (err) {
              console.error(`Failed to fetch lessons for module ${module.id}:`, err)
              return {
                ...module,
                lessons: []
              }
            }
          })
        )
        
        const courseData = {
          ...courseResponse,
          modules: modulesWithLessons
        }
        console.log('Fetched course data:', courseData)
        setCourse(courseData)
      } catch (err: any) {
        setError(err.message || "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [courseId, user?.email])

  // Fetch course progress
  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!courseId || !user?.email) return
      
      try {
        const progress = await ProgressAPI.getCourseProgress(courseId)
        console.log('Fetched course progress:', progress)
        console.log('Sidebar progress data:', {
          courseProgress: progress,
          courseCompletion: progress?.courseCompletion,
          completedLessons: progress?.courseCompletion?.completed_lessons,
          totalLessons: progress?.courseCompletion?.total_lessons
        })
        setCourseProgress(progress)
        
        // Check if current lesson is completed
        if (selectedLesson) {
          const isCompleted = progress.detailedProgress?.some((p: any) => 
            p.lesson_id === selectedLesson.id && p.status === 'completed'
          )
          console.log('Current lesson completion status:', { lessonId: selectedLesson.id, isCompleted })
          setLessonCompleted(isCompleted || false)
          
          // Add to completed lessons set if completed
          if (isCompleted) {
            setCompletedLessons(prev => new Set([...prev, selectedLesson.id]))
          }
        }
      } catch (error) {
        console.error('Error fetching course progress:', error)
      }
    }
    
    fetchCourseProgress()
  }, [courseId, user?.email, selectedLesson?.id])

  // Track time spent on current lesson
  useEffect(() => {
    if (!selectedLesson || lessonCompleted) return
    
    const interval = setInterval(() => {
      setCurrentLessonProgress(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1
      }))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [selectedLesson?.id, lessonCompleted])

  // Study timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => {
          // If we have a lesson with duration, count down from it
          if (selectedLesson?.duration) {
            const totalSeconds = selectedLesson.duration * 60
            const remaining = Math.max(0, totalSeconds - prev - 1)
            if (remaining === 0) {
              setTimerRunning(false)
            }
            return totalSeconds - remaining
          }
          // Otherwise, count up as study time
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, selectedLesson?.duration])

  // Reset timer when lesson changes
  useEffect(() => {
    setStudyTimer(0)
    setTimerRunning(false)
    setQuizAnswers({})
  }, [selectedLesson?.id])

  const formatTime = (seconds: number) => {
    // If we have a lesson with duration, show countdown
    if (selectedLesson?.duration) {
      const totalSeconds = selectedLesson.duration * 60
      const remaining = Math.max(0, totalSeconds - seconds)
      const hrs = Math.floor(remaining / 3600)
      const mins = Math.floor((remaining % 3600) / 60)
      const secs = remaining % 60
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    // Otherwise, show elapsed time
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getLessonProgress = () => {
    if (!course || !selectedLesson) return 0
    
    // Check if current lesson is completed
    const isCompleted = courseProgress?.detailedProgress?.some((p: any) => 
      p.lesson_id === selectedLesson.id && p.status === 'completed'
    )
    
    if (isCompleted) {
      return 100
    }
    
    // If not completed, show progress based on study time vs duration
    if (selectedLesson.duration && studyTimer > 0) {
      const totalSeconds = selectedLesson.duration * 60
      const progress = Math.min((studyTimer / totalSeconds) * 100, 99) // Cap at 99% until completed
      return Math.round(progress)
    }
    
    return 0
  }

  const getCourseProgress = () => {
    if (!course || !courseProgress) return 0
    
    const totalLessons = course.modules?.reduce((total: number, module: any) => 
      total + (module.lessons?.length || 0), 0
    ) || 0
    
    const completedLessons = courseProgress.detailedProgress?.filter((p: any) => 
      p.status === 'completed'
    ).length || 0
    
    console.log('Course progress calculation:', {
      totalLessons,
      completedLessons,
      detailedProgress: courseProgress.detailedProgress
    })
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const handleMarkAsComplete = async () => {
    if (!selectedLesson || !courseId || !user?.email) return
    
    setMarkingComplete(true)
    try {
      await ProgressAPI.recordLessonCompletion({
        courseId,
        moduleId: currentModule?.id,
        lessonId: selectedLesson.id,
        lessonTitle: selectedLesson.title,
        timeSpentSeconds: studyTimer
      })
      
      setLessonCompleted(true)
      toast({
        title: "Lesson Completed!",
        description: `Great job completing "${selectedLesson.title}"`,
      })
      
      // Refresh course progress
      const progress = await ProgressAPI.getCourseProgress(courseId)
      setCourseProgress(progress)
      
    } catch (error) {
      console.error('Error marking lesson as complete:', error)
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive"
      })
    } finally {
      setMarkingComplete(false)
    }
  }

  const removeGoal = (goal: string) => {
    setStudyGoals(prev => prev.filter(g => g !== goal))
  }

  // Check if lesson can be completed based on content type
  const canCompleteLesson = (lesson: any): boolean => {
    if (!lesson) return false
    
    // For video lessons, require minimum watch time
    if (lesson.content?.video?.url || lesson.content?.video_url) {
      return currentLessonProgress.videoWatched && currentLessonProgress.timeSpent >= 30 // 30 seconds minimum
    }
    
    // For quiz lessons, require completion
    if (lesson.content?.quiz?.questions || lesson.content?.quiz_questions) {
      return currentLessonProgress.quizCompleted
    }
    
    // For text content, require minimum read time
    if (lesson.content?.text_content) {
      return currentLessonProgress.contentRead && currentLessonProgress.timeSpent >= 10 // 10 seconds minimum
    }
    
    // For file/document lessons, require some interaction
    if (lesson.content?.file_url || lesson.content?.file?.url || lesson.content?.files) {
      return currentLessonProgress.timeSpent >= 5 // 5 seconds minimum
    }
    
    // Default: allow completion after some time spent
    return currentLessonProgress.timeSpent >= 10
  }

  // Check if next lesson is accessible
  const canAccessNextLesson = (): boolean => {
    if (!course?.modules) return false
    
    const currentModule = course.modules[currentModuleIndex]
    const nextLessonIndex = currentLessonIndex + 1
    const nextModuleIndex = currentModuleIndex + 1
    
    // If there's a next lesson in current module
    if (nextLessonIndex < currentModule.lessons.length) {
      const currentLesson = currentModule.lessons[currentLessonIndex]
      return completedLessons.has(currentLesson.id)
    }
    
    // If moving to next module
    if (nextModuleIndex < course.modules.length) {
      const currentLesson = currentModule.lessons[currentLessonIndex]
      return completedLessons.has(currentLesson.id)
    }
    
    return false
  }

  // Check if course is fully completed
  const isCourseCompleted = (): boolean => {
    if (!course?.modules) return false
    
    const totalLessons = course.modules.reduce((total: number, module: any) => 
      total + module.lessons.length, 0
    )
    
    return completedLessons.size >= totalLessons
  }

  // Handle lesson progression
  const handleNextLesson = () => {
    if (!canAccessNextLesson()) {
      toast({
        title: "Complete Current Lesson",
        description: "Please complete the current lesson before proceeding.",
        variant: "destructive"
      })
      return
    }
    
    const currentModule = course?.modules?.[currentModuleIndex]
    const nextLessonIndex = currentLessonIndex + 1
    const nextModuleIndex = currentModuleIndex + 1
    
    // Move to next lesson in current module
    if (currentModule && nextLessonIndex < currentModule.lessons.length) {
      setCurrentLessonIndex(nextLessonIndex)
    }
    // Move to next module
    else if (course && nextModuleIndex < course.modules.length) {
      setCurrentModuleIndex(nextModuleIndex)
      setCurrentLessonIndex(0)
    }
  }

  const handlePreviousLesson = () => {
    const prevLessonIndex = currentLessonIndex - 1
    const prevModuleIndex = currentModuleIndex - 1
    
    // Move to previous lesson in current module
    if (prevLessonIndex >= 0) {
      setCurrentLessonIndex(prevLessonIndex)
    }
    // Move to previous module
    else if (prevModuleIndex >= 0) {
      const prevModule = course?.modules[prevModuleIndex]
      if (prevModule) {
        setCurrentModuleIndex(prevModuleIndex)
        setCurrentLessonIndex(prevModule.lessons.length - 1)
      }
    }
  }

  const renderLessonContent = (lesson = selectedLesson) => {
    if (!lesson) return null
    
    console.log('Rendering lesson content:', {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonType: lesson.type,
      lessonContent: lesson.content
    })

    // If lesson has content, display it
    if (lesson.content) {
      // Handle different content types
      if (lesson.content.video?.url) {
        const videoUrl = lesson.content.video.url
        
        // Check if it's a YouTube URL
        const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('youtube-nocookie.com')
        
        if (isYouTubeUrl) {
          return (
            <div onMouseEnter={() => setCurrentLessonProgress(prev => ({ ...prev, timeSpent: prev.timeSpent + 1 }))}>
              <UniversalMediaPlayer
                url={videoUrl}
                title={lesson.title}
                description={lesson.content.video.description}
                fileType={lesson.content.video.type}
              />
            </div>
          )
        }
        
        // Handle direct video files
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg">
              <video
                controls
                className="w-full h-full rounded-lg"
                src={videoUrl}
                poster={lesson.content.video.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            {lesson.content.video.description && (
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-slate-300">{lesson.content.video.description}</p>
              </div>
            )}
          </div>
        )
      }
      
      if (lesson.content.video_url) {
        const videoUrl = lesson.content.video_url
        
        // Check if it's a YouTube URL
        const isYouTubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('youtube-nocookie.com')
        
        if (isYouTubeUrl) {
          return (
            <UniversalMediaPlayer
              url={videoUrl}
              title={lesson.title}
              description={lesson.content.description}
              fileType={lesson.content.video_type}
            />
          )
        }
        
        // Handle direct video files
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg">
              <video
                controls
                className="w-full h-full rounded-lg"
                src={videoUrl}
                poster={lesson.content.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            {lesson.content.description && (
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-slate-300">{lesson.content.description}</p>
              </div>
            )}
          </div>
        )
      }
      
      if (lesson.content.text_content) {
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-lg">
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content.text_content }} />
              </div>
            </div>
          </div>
        )
      }
      
      if (lesson.content.file_url || lesson.content.file?.url || lesson.content.files) {
        // Handle single file
        if (lesson.content.file_url || lesson.content.file?.url) {
          const fileUrl = lesson.content.file?.url || lesson.content.file_url
          const fileName = lesson.content.file?.name || lesson.title
          const fileType = lesson.content.file?.type || 'application/pdf'
          const fileSize = lesson.content.file?.size || 0
          
          return (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Document: {lesson.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentDocument({
                        id: lesson.id,
                        name: fileName,
                        type: fileType,
                        size: fileSize,
                        url: fileUrl
                      })
                      setDocumentViewerOpen(true)
                    }}
                    className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
                  >
                    View Document
                  </Button>
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    Open in New Tab
                  </a>
                </div>
                {lesson.content.description && (
                  <p className="text-slate-300 text-sm">{lesson.content.description}</p>
                )}
              </div>
            </div>
          )
        }
        
        // Handle multiple files
        if (lesson.content.files && Array.isArray(lesson.content.files)) {
          return (
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Documents: {lesson.title}</h3>
                <div className="space-y-3">
                  {lesson.content.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="text-white font-medium text-sm">{file.name || `Document ${index + 1}`}</div>
                          <div className="text-slate-400 text-xs">
                            {file.type || 'Document'} • {file.size ? Math.round(file.size / 1024) + ' KB' : 'Unknown size'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentDocument({
                              id: `${lesson.id}-${index}`,
                              name: file.name || `Document ${index + 1}`,
                              type: file.type || 'application/pdf',
                              size: file.size || 0,
                              url: file.url
                            })
                            setDocumentViewerOpen(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
                        >
                          View
                        </Button>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-sm"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {lesson.content.description && (
                  <p className="text-slate-300 text-sm mt-4">{lesson.content.description}</p>
                )}
              </div>
            </div>
          )
        }
      }
      
      if (lesson.content.quiz?.questions) {
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="text-white font-medium mb-4">Quiz: {lesson.title}</h3>
              <div className="space-y-4">
                {lesson.content.quiz.questions.map((question: any, index: number) => (
                  <div key={index} className="border border-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">{question.question}</h4>
                    <div className="space-y-2">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            onChange={(e) => {
                              setQuizAnswers(prev => ({
                                ...prev,
                                [`${lesson.id}-${index}`]: e.target.value
                              }))
                            }}
                            className="text-blue-500"
                          />
                          <span className="text-slate-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      
      if (lesson.content.quiz_questions) {
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="text-white font-medium mb-4">Quiz: {lesson.title}</h3>
              <div className="space-y-4">
                {lesson.content.quiz_questions.map((question: any, index: number) => (
                  <div key={index} className="border border-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">{question.question}</h4>
                    <div className="space-y-2">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            onChange={(e) => {
                              setQuizAnswers(prev => ({
                                ...prev,
                                [`${lesson.id}-${index}`]: e.target.value
                              }))
                            }}
                            className="text-blue-500"
                          />
                          <span className="text-slate-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      
      if (lesson.content.poll?.options) {
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-lg">
              <h3 className="text-white font-medium mb-4">Poll: {lesson.title}</h3>
              <div className="space-y-4">
                <p className="text-slate-300 mb-4">{lesson.content.poll.question}</p>
                <div className="space-y-2">
                  {lesson.content.poll.options.map((option: string, optionIndex: number) => (
                    <label key={optionIndex} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`poll-${lesson.id}`}
                        value={optionIndex}
                        onChange={(e) => {
                          setQuizAnswers(prev => ({
                            ...prev,
                            [`poll-${lesson.id}`]: e.target.value
                          }))
                        }}
                        className="text-blue-500"
                      />
                      <span className="text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
    }

    // Fallback for different lesson types
    switch (lesson.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p>No video content available</p>
                <p className="text-sm">Title: {lesson.title}</p>
                {lesson.description && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <p className="text-slate-300">{lesson.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Quiz: {lesson.title}</h3>
              <p className="text-slate-300 text-sm">No quiz content available</p>
              {lesson.description && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-slate-300">{lesson.description}</p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'file':
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">File: {lesson.title}</h3>
              <p className="text-slate-300 text-sm">No file content available</p>
              {lesson.description && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-slate-300">{lesson.description}</p>
                </div>
              )}
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">{lesson.title}</h3>
              <p className="text-slate-300 text-sm">No content available for this lesson</p>
              {lesson.description && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-slate-300">{lesson.description}</p>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-slate-300">Loading study area...</span>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-red-300">Error loading study area: {error}</div>
      </GlassCard>
    )
  }

  if (!course) {
    return (
      <GlassCard className="p-6">
        <div className="text-slate-300">Course not found.</div>
      </GlassCard>
    )
  }

  const totalModules = course?.modules?.length || 0
  const totalLessons = currentModule?.lessons?.length || 0

  const goToNext = () => {
    handleNextLesson()
  }

  const goToPrevious = () => {
    handlePreviousLesson()
  }

  const canGoNext = canAccessNextLesson()
  const canGoPrevious = currentLessonIndex > 0 || currentModuleIndex > 0

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="text-slate-400">
                {course?.title} • {currentModule?.title} • {selectedLesson?.title}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Course Progress */}
              <div className="text-right">
                <div className="text-sm text-slate-400">Course Progress</div>
                <div className="text-lg font-bold text-white">{getCourseProgress()}%</div>
                <Progress value={getCourseProgress()} className="w-24 h-2" />
              </div>
              
              {/* Study Timer */}
              <div className="text-center">
                <div className="text-sm text-slate-400">Study Time</div>
                <div className="text-lg font-bold text-white">{formatTime(studyTimer)}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="text-slate-400 hover:text-white"
                >
                  {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Lesson Completion Status */}
              <div className="text-center">
                <div className="text-sm text-slate-400">Lesson Status</div>
                {lessonCompleted ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <GlassCard className="h-full p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-white/10">
                <TabsTrigger value="content" className="text-white">Content</TabsTrigger>
                <TabsTrigger value="notes" className="text-white">Notes</TabsTrigger>
                <TabsTrigger value="goals" className="text-white">Goals</TabsTrigger>
                <TabsTrigger value="discussions" className="text-white">Discussions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="flex-1 overflow-y-auto p-6">
                {selectedLesson ? (
                  <div className="space-y-6">
                    {/* Lesson Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {selectedLesson.duration || 0} minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {selectedLesson.points || 0} points
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {selectedLesson.type}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Completion Button */}
                      {!lessonCompleted ? (
                        <Button
                          onClick={handleMarkAsComplete}
                          disabled={markingComplete || !canCompleteLesson(selectedLesson)}
                          className={`${
                            canCompleteLesson(selectedLesson) 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-gray-600 cursor-not-allowed'
                          } text-white`}
                        >
                          {markingComplete ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Marking Complete...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {canCompleteLesson(selectedLesson) ? 'Mark as Complete' : 'Complete Requirements'}
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Completed</span>
                        </div>
                      )}

                      {/* Course Completion Button */}
                      {lessonCompleted && isCourseCompleted() && (
                        <Button
                          onClick={() => {
                            toast({
                              title: "🎉 Course Completed!",
                              description: "Congratulations! You've completed the entire course.",
                            })
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white ml-2"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Course Complete!
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Lesson Progress</span>
                        <span className="text-white">{getLessonProgress()}%</span>
                      </div>
                      <Progress value={getLessonProgress()} className="h-3 bg-white/10" />
                    </div>

                    {/* Lesson Content */}
                    <div className="space-y-4">
                      {renderLessonContent(selectedLesson)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a lesson to start studying</p>
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Study Notes</h3>
                    <Button
                      size="sm"
                      onClick={() => setNotes('')}
                      variant="outline"
                      className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    >
                      Clear
                    </Button>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Take notes about this lesson..."
                    className="w-full h-64 bg-white/5 border border-white/10 text-white rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Study Goals</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newGoal.trim() && !studyGoals.includes(newGoal.trim())) {
                          setStudyGoals(prev => [...prev, newGoal.trim()])
                          setNewGoal("")
                        }
                      }}
                      className="bg-blue-600/80 hover:bg-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Goal
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add a study goal..."
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newGoal.trim() && !studyGoals.includes(newGoal.trim())) {
                          setStudyGoals(prev => [...prev, newGoal.trim()])
                          setNewGoal("")
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {studyGoals.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No study goals yet</p>
                        <p className="text-sm">Add goals to track your learning objectives</p>
                      </div>
                    ) : (
                      studyGoals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white">{goal}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeGoal(goal)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Discussions Tab */}
              <TabsContent value="discussions" className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Course Discussions</h3>
                    <Button
                      size="sm"
                      onClick={() => setDiscussionEnabled(!discussionEnabled)}
                      variant="outline"
                      className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    >
                      {discussionEnabled ? 'Disable' : 'Enable'} Discussions
                    </Button>
                  </div>
                  
                  {discussionEnabled ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Add a discussion topic..."
                          value={newDiscussion}
                          onChange={(e) => setNewDiscussion(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newDiscussion.trim()) {
                              setDiscussions(prev => [...prev, {
                                id: Date.now(),
                                topic: newDiscussion.trim(),
                                author: user?.email || 'Student',
                                timestamp: new Date().toISOString(),
                                replies: []
                              }])
                              setNewDiscussion("")
                            }
                          }}
                          className="flex-1 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                        />
                        <Button
                          onClick={() => {
                            if (newDiscussion.trim()) {
                              setDiscussions(prev => [...prev, {
                                id: Date.now(),
                                topic: newDiscussion.trim(),
                                author: user?.email || 'Student',
                                timestamp: new Date().toISOString(),
                                replies: []
                              }])
                              setNewDiscussion("")
                            }
                          }}
                          className="bg-blue-600/80 hover:bg-blue-600"
                        >
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {discussions.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No discussions yet</p>
                          </div>
                        ) : (
                          discussions.map((discussion) => (
                            <div key={discussion.id} className="p-3 border border-white/10 rounded-lg bg-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{discussion.topic}</span>
                                <span className="text-xs text-slate-400">
                                  {new Date(discussion.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm text-slate-300">by {discussion.author}</div>
                              {discussion.replies.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400">
                                  {discussion.replies.length} replies
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Discussions are currently disabled</p>
                      <p className="text-sm">Enable discussions to start conversations with classmates</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </GlassCard>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <Button
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            variant="outline"
            className="bg-white/10 text-white hover:bg-white/20 border-white/20 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-slate-400">
            Module {currentModuleIndex + 1} of {totalModules} • Lesson {currentLessonIndex + 1} of {totalLessons}
          </div>
          
          <Button
            onClick={goToNext}
            disabled={!canGoNext}
            className="bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Enhanced Sidebar - Now on the RIGHT */}
      {showSidebar && (
        <div className="w-96 border-l border-white/10">
          <GlassCard className="h-full p-0">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Course Navigation</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSidebar(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* Course Progress Overview */}
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Course Progress
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Overall Progress</span>
                        <span className="text-white">{getCourseProgress()}%</span>
                      </div>
                      <Progress value={getCourseProgress()} className="h-2 bg-white/10" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white/5 rounded">
                        <div className="text-white font-medium">{courseProgress?.courseCompletion?.completed_lessons || 0}</div>
                        <div className="text-slate-400">Lessons Done</div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded">
                        <div className="text-white font-medium">{courseProgress?.courseCompletion?.total_lessons || 0}</div>
                        <div className="text-slate-400">Total Lessons</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Course Modules
                  </h4>
                  <div className="space-y-2">
                    {course?.modules?.map((module: any, moduleIndex: number) => (
                      <div key={module.id} className="space-y-1">
                        <div 
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            moduleIndex === currentModuleIndex 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                          onClick={() => {
                            setCurrentModuleIndex(moduleIndex)
                            setCurrentLessonIndex(0)
                          }}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span className="font-medium text-sm">{module.title}</span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {module.lessons?.length || 0} lessons
                          </span>
                        </div>
                        
                        {module.lessons && (
                          <div className="ml-6 space-y-1">
                            {module.lessons.map((lesson: any, lessonIndex: number) => {
                              const isCompleted = courseProgress?.detailedProgress?.some((p: any) => 
                                p.lesson_id === lesson.id && p.status === 'completed'
                              )
                              
                              return (
                                <div
                                  key={lesson.id}
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors ${
                                    moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                      : 'text-slate-400 hover:bg-white/5'
                                  }`}
                                  onClick={() => {
                                    setCurrentModuleIndex(moduleIndex)
                                    setCurrentLessonIndex(lessonIndex)
                                  }}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="h-3 w-3 text-green-400" />
                                  ) : lesson.type === 'video' ? (
                                    <Video className="h-3 w-3" />
                                  ) : lesson.type === 'quiz' ? (
                                    <ClipboardList className="h-3 w-3" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="truncate">{lesson.title}</span>
                                  <span className="text-xs text-slate-500 ml-auto">
                                    {lesson.duration || 0}m
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Study Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Modules:</span>
                      <span className="text-white">{totalModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Lessons:</span>
                      <span className="text-white">{totalLessons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Completed:</span>
                      <span className="text-green-400">{courseProgress?.courseCompletion?.completed_lessons || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Study Goals:</span>
                      <span className="text-white">{studyGoals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Study Time:</span>
                      <span className="text-white">{formatTime(studyTimer)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Show Sidebar Button when hidden */}
      {!showSidebar && (
        <Button
          onClick={() => setShowSidebar(true)}
          className="fixed top-4 right-4 bg-blue-600/80 hover:bg-blue-600"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Show Navigation
        </Button>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        title="Study Document"
      />

      {/* Lesson Document Viewer Modal */}
      <DocumentViewer
        document={currentDocument}
        isOpen={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        title="Lesson Document"
        subtitle={currentDocument?.name}
      />

      {/* Presentation Viewer Modal */}
      <PresentationViewer
        presentation={viewingPresentation}
        isOpen={!!viewingPresentation}
        onClose={() => setViewingPresentation(null)}
        title="Study Presentation"
      />
    </div>
  )
}
