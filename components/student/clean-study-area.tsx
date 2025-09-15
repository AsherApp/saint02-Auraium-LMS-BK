"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { CourseProgressBar, EnhancedProgress } from "@/components/ui/enhanced-progress"
import { InlineNotes } from "@/components/student/inline-notes"
import { RestrictedVideoPlayer } from "@/components/shared/restricted-video-player"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { useSequentialNavigation } from "@/hooks/use-sequential-navigation"
import { useContentCompletion } from "@/hooks/use-content-completion"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { useCongratulations } from "@/hooks/use-congratulations"
import { CongratulationBalloon } from "@/components/shared/congratulation-balloon"
import { QuizWithTimer } from "@/components/student/quiz-with-timer"
import { getViewerType, canPreviewFile, contentToFileInfo, getPreviewButtonText, type FileInfo } from "@/utils/file-viewer-utils"
import {
  BookOpen,
  Video,
  FileText,
  ClipboardList,
  CheckCircle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  Award,
  Download,
  ExternalLink
} from "lucide-react"

interface CleanStudyAreaProps {
  courseId: string
  title?: string
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

export function CleanStudyArea({ courseId, title = "Study Area" }: CleanStudyAreaProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { showCongratulations, currentMessage, closeCurrentMessage } = useCongratulations()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNavigation, setShowNavigation] = useState(false)
  
  // Viewer states
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [presentationViewerOpen, setPresentationViewerOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<any>(null)
  const [currentPresentation, setCurrentPresentation] = useState<any>(null)

  // Use our new hooks
  const {
    currentModuleIndex,
    currentLessonIndex,
    completedLessons,
    accessibleLessons,
    isAutoAdvancing,
    courseProgress,
    loading: progressLoading,
    navigateToLesson,
    navigateToNext,
    navigateToPrevious,
    markLessonCompleted,
    getCurrentLesson,
    isLessonAccessible,
    isLessonCompleted,
    hasNextLesson,
    hasPreviousLesson,
    getCourseCompletionPercentage
  } = useSequentialNavigation(course, courseId, user?.email || '')

  const {
    updateVideoProgress,
    markVideoCompleted,
    submitQuiz,
    resetQuiz,
    updateContentReadTime,
    markContentRead,
    updateFileViewTime,
    markFileViewed,
    resetCompletion,
    isContentCompleted,
    getCompletionRequirements,
    quizAttempts,
    quizCompleted,
    maxQuizAttempts
  } = useContentCompletion({
    onContentCompleted: (type, score) => {
      const currentModule = course?.modules[currentModuleIndex]
      const currentLesson = currentModule?.lessons[currentLessonIndex]
      
      if (currentLesson) {
        let title = ""
        let message = ""
        
        switch (type) {
          case 'video':
            title = "🎬 Video Completed!"
            message = `Great job! You've completed "${currentLesson.title}". You can now proceed to the next lesson.`
            break
          case 'quiz':
            if (score && score >= 70) {
              title = "🎯 Quiz Passed!"
              message = `Excellent work! You scored ${score}% on "${currentLesson.title}". You can now proceed to the next lesson.`
            } else {
              title = "📝 Quiz Completed"
              message = `You completed "${currentLesson.title}" with a score of ${score}%. ${score && score < 70 ? 'You can retry if needed.' : ''}`
            }
            break
          case 'text':
            title = "📖 Content Read!"
            message = `Well done! You've read through "${currentLesson.title}". You can now proceed to the next lesson.`
            break
          case 'file':
            title = "📄 File Viewed!"
            message = `Perfect! You've reviewed "${currentLesson.title}". You can now proceed to the next lesson.`
            break
        }
        
        showCongratulations(title, message, type === 'quiz' ? 'exam' : 'module', score)
      }
    }
  })

  // Check for course completion
  useEffect(() => {
    const checkCourseCompletion = async () => {
      if (!course || !user?.email) return

      try {
        const response = await http<any>(`/api/student-progress/course/${courseId}`)
        const { courseCompletion } = response

        if (courseCompletion && courseCompletion.completion_percentage >= 100 && !courseCompletion.completed_at) {
          // Course just completed
          showCongratulations(
            "🎓 Course Completed!",
            `Congratulations! You have successfully completed "${course.title}"! Your certificate is now available for download.`,
            'course'
          )
        }
      } catch (error) {
        console.error('Error checking course completion:', error)
      }
    }

    // Check course completion when course data changes
    if (course) {
      checkCourseCompletion()
    }
  }, [course, courseId, user?.email, showCongratulations])

  // Fetch course data
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
        
        setCourse(courseData)
      } catch (err: any) {
        setError(err.message || "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [courseId, user?.email])

  // Reset completion state when lesson changes
  useEffect(() => {
    resetCompletion()
  }, [currentModuleIndex, currentLessonIndex, resetCompletion])

  const currentLesson = getCurrentLesson()
  const currentModule = course?.modules?.[currentModuleIndex]

  // Handle lesson completion
  const handleLessonCompletion = async () => {
    if (!currentLesson) return

    const isCompleted = isContentCompleted(currentLesson.type, currentLesson.content)
    if (!isCompleted) {
      toast({
        title: "Complete Requirements",
        description: "Please complete all lesson requirements before proceeding.",
        variant: "destructive"
      })
      return
    }

    const success = await markLessonCompleted(currentLesson.id, 0)
    if (success) {
      toast({
        title: "Lesson Completed! 🎉",
        description: `Great job completing "${currentLesson.title}"`,
      })

      // Auto-advance to next lesson after a short delay
      setTimeout(() => {
        if (hasNextLesson()) {
          navigateToNext()
          toast({
            title: "Moving to Next Lesson",
            description: "Automatically advancing to the next lesson...",
          })
        } else {
          toast({
            title: "Course Completed! 🏆",
            description: "Congratulations! You've completed the entire course.",
          })
        }
      }, 2000)
    }
  }

  const handleMarkCourseComplete = async () => {
    if (!isAllLessonsCompleted) return

    try {
      const response = await http<any>(`/api/students/me/courses/${courseId}/complete`, {
        method: 'POST'
      })

      if (response.success) {
        toast({
          title: "Course Completed! 🎓",
          description: `Congratulations! You've successfully completed "${course?.title}". Your certificate is now available for download.`,
        })

        // Show congratulations balloon
        showCongratulations(
          "🎓 Course Completed!",
          `Congratulations! You have successfully completed "${course?.title}"! Your certificate is now available for download.`,
          'course'
        )

        // Redirect to certificates page after a delay
        setTimeout(() => {
          window.location.href = '/student/certificates'
        }, 3000)
      }
    } catch (error: any) {
      console.error('Error marking course complete:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark course complete. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle quiz submission
  const handleQuizSubmission = (answers: { [key: string]: string }, timeTaken: number = 0) => {
    if (!currentLesson?.content?.quiz?.questions && !currentLesson?.content?.quiz_questions) return

    const questions = currentLesson.content.quiz?.questions || currentLesson.content.quiz_questions
    let correctAnswers = 0
    let totalQuestions = questions.length

    questions.forEach((question: any, index: number) => {
      const answerKey = `${currentLesson.id}-${index}`
      const selectedAnswer = answers[answerKey]
      if (selectedAnswer === question.correct_answer?.toString()) {
        correctAnswers++
      }
    })

    const result = submitQuiz(correctAnswers, totalQuestions, timeTaken)
    
    if (result.passed) {
      toast({
        title: "Quiz Passed! ✅",
        description: `You scored ${Math.round(result.score)}% on the quiz.`,
      })
    } else if (result.canRetry) {
      toast({
        title: "Quiz Failed",
        description: `You scored ${Math.round(result.score)}%. You have ${result.attemptsRemaining} attempt(s) remaining.`,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Quiz Failed",
        description: `You've used all ${maxQuizAttempts} attempts. Please review the material and try again later.`,
        variant: "destructive"
      })
    }
  }

  // Render lesson content based on type
  const renderLessonContent = () => {
    if (!currentLesson) return null

    const { content } = currentLesson

    // Enhanced Video content
    if (content?.video?.url || content?.video_url) {
      const videoUrl = content.video?.url || content.video_url
      return (
        <div className="space-y-6">
          {/* Enhanced Video Player Container */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <RestrictedVideoPlayer
              src={videoUrl}
              poster={content.video?.thumbnail}
              title={currentLesson.title}
              onTimeUpdate={(currentTime, duration) => {
                updateVideoProgress(currentTime, duration)
              }}
              onComplete={() => {
                markVideoCompleted()
              }}
              onWatchTimeUpdate={(watchTime) => {
                updateVideoProgress(watchTime, content.video?.duration || 0)
              }}
              className="aspect-video rounded-lg overflow-hidden"
            />
          </div>
          
          {content.video?.description && (
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Video className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Video Description</h4>
                  <p className="text-slate-300 leading-relaxed">{content.video.description}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Inline Notes for Video */}
          <InlineNotes
            courseId={courseId}
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            className="mt-6"
          />
        </div>
      )
    }

    // Quiz content
    if (content?.quiz?.questions || content?.quiz_questions) {
      const questions = content.quiz?.questions || content.quiz_questions
      const quizData = {
        id: currentLesson.id,
        title: currentLesson.title,
        description: currentLesson.description,
        questions: questions.map((q: any, index: number) => ({
          id: `${currentLesson.id}-${index}`,
          question: q.question,
          type: q.type || 'multiple_choice',
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points || 1
        })),
        time_limit_minutes: content.quiz?.time_limit_minutes,
        passing_score: content.quiz?.passing_score || 70,
        max_attempts: content.quiz?.max_attempts || 2
      }

      return (
        <div className="space-y-6">
          {/* Enhanced Quiz Container */}
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ClipboardList className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">Quiz: {currentLesson.title}</h4>
                <p className="text-slate-400 text-sm">
                  {questions.length} questions • {content.quiz?.time_limit_minutes ? `${content.quiz.time_limit_minutes} min time limit` : 'No time limit'}
                </p>
              </div>
            </div>
            
            <QuizWithTimer
              quiz={quizData}
              onComplete={(score, total, timeTaken) => {
                // The QuizWithTimer component handles the quiz logic internally
                // We just need to update our local state
                const result = submitQuiz(score, total, timeTaken)
                
                if (result.passed) {
                  toast({
                    title: "Quiz Passed! ✅",
                    description: `You scored ${score}% on the quiz.`,
                  })
                } else if (result.canRetry) {
                  toast({
                    title: "Quiz Failed",
                    description: `You scored ${score}%. You have ${result.attemptsRemaining} attempt(s) remaining.`,
                    variant: "destructive"
                  })
                } else {
                  toast({
                    title: "Quiz Failed",
                    description: `You've used all ${maxQuizAttempts} attempts. Please review the material and try again later.`,
                    variant: "destructive"
                  })
                }
              }}
              onTimeExpired={() => {
                // Handle time expiration - submit with current answers
                toast({
                  title: "Time's Up! ⏰",
                  description: "Your quiz has been automatically submitted.",
                  variant: "destructive"
                })
              }}
            />
          </div>
          
          {/* Enhanced Inline Notes for Quiz */}
          <InlineNotes
            courseId={courseId}
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            className="mt-6"
          />
        </div>
      )
    }

    // Text content
    if (content?.text_content) {
      return (
        <div className="space-y-4">
          <div 
            className="bg-white/5 p-6 rounded-lg prose prose-invert max-w-none"
            onMouseEnter={() => {
              const startTime = Date.now()
              const interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000
                updateContentReadTime(elapsed)
                if (elapsed >= 30) {
                  clearInterval(interval)
                  markContentRead()
                }
              }, 1000)
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: content.text_content }} />
          </div>
          {/* Inline Notes for Text Content */}
          <InlineNotes
            courseId={courseId}
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            className="mt-4"
          />
        </div>
      )
    }

    // File content with enhanced viewers
    if (content?.file_url || content?.file?.url || content?.files) {
      const fileUrl = content.file?.url || content.file_url
      const fileName = content.file?.name || currentLesson.title
      const fileType = content.file?.type || 'application/pdf'
      const fileSize = content.file?.size || 0
      
      // Convert to FileInfo for viewer utilities
      const fileInfo: FileInfo = {
        id: currentLesson.id,
        name: fileName,
        type: fileType,
        size: fileSize,
        url: fileUrl,
        uploadedAt: content.file?.uploadedAt
      }
      
      const viewerType = getViewerType(fileInfo)
      const canPreview = canPreviewFile(fileInfo)
      const previewButtonText = getPreviewButtonText(fileInfo)
      
      return (
        <div className="space-y-6">
          {/* Enhanced File Content Card */}
          <div 
            className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            onMouseEnter={() => {
              const startTime = Date.now()
              const interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000
                updateFileViewTime(elapsed)
                if (elapsed >= 10) {
                  clearInterval(interval)
                  markFileViewed()
                }
              }, 1000)
            }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">{currentLesson.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {fileName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentLesson.duration || 0} min read
                  </span>
                  {fileSize > 0 && (
                    <span className="text-slate-500">
                      {(fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
                
                {content.description && (
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">{content.description}</p>
                )}
                
                <div className="flex items-center gap-3">
                  {canPreview ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (viewerType === 'document') {
                          setCurrentDocument(fileInfo)
                          setDocumentViewerOpen(true)
                        } else if (viewerType === 'presentation') {
                          setCurrentPresentation(fileInfo)
                          setPresentationViewerOpen(true)
                        }
                      }}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {previewButtonText}
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(fileUrl, '_blank')
                      }}
                      variant="outline"
                      className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  )}
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = fileUrl
                      link.download = fileName
                      link.click()
                    }}
                    variant="outline"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300 border-slate-400 hover:border-slate-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Inline Notes for File Content */}
          <InlineNotes
            courseId={courseId}
            lessonId={currentLesson.id}
            lessonTitle={currentLesson.title}
            className="mt-6"
          />
        </div>
      )
    }

    return (
      <div className="text-center py-12 text-slate-400">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No content available for this lesson</p>
      </div>
    )
  }

  if (loading || progressLoading) {
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

  const completionRequirements = currentLesson ? getCompletionRequirements(currentLesson.type, currentLesson.content) : []
  const isCurrentLessonCompleted = currentLesson ? isContentCompleted(currentLesson.type, currentLesson.content) : false
  const courseCompletionPercentage = getCourseCompletionPercentage()
  
  // Check if all lessons are completed
  const totalLessons = course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0
  const isAllLessonsCompleted = completedLessons.size >= totalLessons && totalLessons > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header with Perfect Spacing */}
          <GlassCard className="m-6 mb-0 p-8 border-b border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-slate-400">
                  {course?.title} • {currentModule?.title}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Enhanced Course Progress */}
                <div className="min-w-[200px]">
                  <CourseProgressBar
                    value={courseCompletionPercentage}
                    totalLessons={course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0}
                    completedLessons={completedLessons.size}
                    showDetails={true}
                  />
                </div>
                
                {/* Navigation Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavigation(!showNavigation)}
                  className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {showNavigation ? 'Hide' : 'Show'} Navigation
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Enhanced Content Area with Perfect Spacing */}
          <div className="flex-1 overflow-hidden mx-6 mb-6">
            <GlassCard className="h-full p-0 backdrop-blur-sm border border-white/10">
              <div className="h-full flex flex-col">
                {currentLesson ? (
                  <>
                    {/* Enhanced Lesson Header */}
                    <div className="p-8 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {currentLesson.duration || 0} minutes
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {currentLesson.points || 0} points
                            </span>
                            <span className="capitalize text-blue-400">
                              {currentLesson.type}
                            </span>
                          </div>
                        </div>
                        
                        {/* Completion Status */}
                        {isCurrentLessonCompleted ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Ready to Complete</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-sm">
                            Complete requirements to proceed
                          </div>
                        )}
                      </div>

                      {/* Completion Requirements */}
                      {completionRequirements.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {completionRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {req.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-400" />
                              )}
                              <span className={req.completed ? "text-green-400" : "text-slate-400"}>
                                {req.description}
                              </span>
                              {req.progress !== undefined && (
                                <div className="ml-auto w-20">
                                  <EnhancedProgress 
                                    value={req.progress} 
                                    size="sm" 
                                    showPercentage={false}
                                    animated={true}
                                    color="green"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Lesson Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-white/5 to-transparent">
                      <div className="max-w-4xl mx-auto">
                        {renderLessonContent()}
                      </div>
                    </div>

                    {/* Enhanced Action Bar */}
                    <div className="p-8 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                      {isAllLessonsCompleted ? (
                        // Show "Mark Course Complete" button when all lessons are done
                        <div className="text-center">
                          <div className="mb-4">
                            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                              <CheckCircle className="h-6 w-6" />
                              <span className="text-lg font-semibold">All Lessons Completed!</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                              You've successfully completed all lessons in this course. Mark the course as complete to receive your certificate.
                            </p>
                          </div>
                          <Button
                            onClick={handleMarkCourseComplete}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg"
                          >
                            <Award className="h-5 w-5 mr-2" />
                            Mark Course Complete & Get Certificate
                          </Button>
                        </div>
                      ) : (
                        // Show normal lesson navigation
                        <div className="flex items-center justify-between">
                          <Button
                            onClick={navigateToPrevious}
                            disabled={!hasPreviousLesson()}
                            variant="outline"
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20 disabled:opacity-50"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                          
                          <Button
                            onClick={handleLessonCompletion}
                            disabled={!isCurrentLessonCompleted}
                            className={`${
                              isCurrentLessonCompleted 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-600 cursor-not-allowed'
                            } text-white`}
                          >
                            {isCurrentLessonCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Lesson
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Complete Requirements
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={navigateToNext}
                            disabled={!hasNextLesson() || !isCurrentLessonCompleted}
                            className="bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50"
                          >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No lesson available</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Enhanced Navigation Sidebar */}
        {showNavigation && (
          <div className="w-80">
            <GlassCard className="h-full m-6 ml-0 p-0 backdrop-blur-sm border border-white/10">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Course Navigation</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNavigation(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {course?.modules?.map((module: any, moduleIndex: number) => (
                    <div key={module.id} className="space-y-1">
                      <div 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          moduleIndex === currentModuleIndex 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
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
                            const isAccessible = isLessonAccessible(lesson.id)
                            const isCompleted = isLessonCompleted(lesson.id)
                            const isCurrent = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex
                            
                            return (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors ${
                                  isCurrent
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : isAccessible
                                    ? 'text-slate-400 hover:bg-white/5'
                                    : 'text-slate-600 cursor-not-allowed'
                                }`}
                                onClick={() => {
                                  if (isAccessible) {
                                    navigateToLesson(moduleIndex, lessonIndex)
                                  }
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-3 w-3 text-green-400" />
                                ) : isAccessible ? (
                                  lesson.type === 'video' ? (
                                    <Video className="h-3 w-3" />
                                  ) : lesson.type === 'quiz' ? (
                                    <ClipboardList className="h-3 w-3" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )
                                ) : (
                                  <Lock className="h-3 w-3" />
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
            </GlassCard>
          </div>
        )}
      </div>

      {/* Enhanced Viewers */}
      <DocumentViewer
        document={currentDocument}
        isOpen={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false)
          setCurrentDocument(null)
        }}
        title="Document Viewer"
        subtitle={currentDocument?.name}
      />
      
      <PresentationViewer
        presentation={currentPresentation}
        isOpen={presentationViewerOpen}
        onClose={() => {
          setPresentationViewerOpen(false)
          setCurrentPresentation(null)
        }}
        title="Presentation Viewer"
        subtitle={currentPresentation?.name}
      />

      {/* Congratulatory Balloon */}
      <CongratulationBalloon
        isVisible={!!currentMessage}
        onClose={closeCurrentMessage}
        title={currentMessage?.title || ""}
        message={currentMessage?.message || ""}
        type={currentMessage?.type || "module"}
        score={currentMessage?.score}
        autoCloseDelay={6000}
      />
    </div>
  )
}
