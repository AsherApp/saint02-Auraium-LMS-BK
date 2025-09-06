"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentProAPI, type Assignment, type Submission } from "@/services/assignment-pro/api"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Save, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  X,
  File,
  Image,
  Video,
  Music,
  Archive,
  Code,
  BookOpen,
  MessageSquare,
  Presentation,
  Users,
  Target,
  Calendar,
  Award,
  Eye,
  Download,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Timer,
  BarChart3,
  Edit,
  Settings
} from "lucide-react"

export default function StudentAssignmentWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const assignmentId = params.aid as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Submission content based on assignment type
  const [content, setContent] = useState<{
    essay?: string
    file_upload?: File[]
    quiz?: Record<string, number | number[]>
    project?: string
    discussion?: string
    presentation?: string
    code_submission?: string
  }>({})

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | number[]>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({})

  // File upload state
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Timer state for time-limited assignments
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const [assignmentData, submissionData] = await Promise.all([
          AssignmentProAPI.getAssignment(assignmentId),
          AssignmentProAPI.getSubmission(assignmentId, user?.email || '')
        ])
        
        setAssignment(assignmentData)
        if (submissionData) {
          setSubmission(submissionData)
          // Initialize content from existing submission
          if (submissionData.content) {
            setContent(submissionData.content)
            if (submissionData.content.quiz) {
              setQuizAnswers(submissionData.content.quiz)
            }
          }
        }

        // Initialize timer if assignment has time limit
        if (assignmentData.time_limit_minutes && !submissionData?.status) {
          setTimeRemaining(assignmentData.time_limit_minutes * 60) // Convert to seconds
          setTimerActive(true)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }

    if (assignmentId && user?.email) {
      fetchAssignment()
      
      // Set up polling for grade updates every 30 seconds
      const interval = setInterval(fetchAssignment, 30000)
      
      return () => clearInterval(interval)
    }
  }, [assignmentId, user?.email])

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Only auto-save if there's content and no existing submission or it's a draft
    if (Object.keys(content).length > 0 && (!submission || submission.status === 'draft')) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        await handleAutoSave()
      }, 3000) // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content])

  // Timer effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          setTimerActive(false)
          // Auto-submit when time runs out
          if (submission?.status !== 'submitted') {
            handleSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timeRemaining, submission?.status])

  const handleAutoSave = async () => {
    if (!assignment || !user?.email || submission?.status === 'submitted') return
    
    setIsAutoSaving(true)
    try {
      const submissionData = {
        assignment_id: assignmentId,
        student_email: user.email,
        content,
        status: 'draft'
      }
      
      if (submission) {
        await AssignmentProAPI.updateSubmission(submission.id, submissionData)
      } else {
        const newSubmission = await AssignmentProAPI.createSubmission(submissionData)
        setSubmission(newSubmission)
      }
      setLastSaved(new Date())
    } catch (err: any) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsAutoSaving(false)
    }
  }

  const handleSave = async () => {
    if (!assignment || !user?.email) return
    
    setSaving(true)
    try {
      const submissionData = {
        assignment_id: assignmentId,
        student_email: user.email,
        content,
        status: 'draft'
      }
      
      if (submission) {
        await AssignmentProAPI.updateSubmission(submission.id, submissionData)
      } else {
        const newSubmission = await AssignmentProAPI.createSubmission(submissionData)
        setSubmission(newSubmission)
      }
      setLastSaved(new Date())
    } catch (err: any) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignment || !user?.email) return
    
    setSubmitting(true)
    try {
      const submissionData = {
        assignment_id: assignmentId,
        student_email: user.email,
        content,
        status: 'submitted'
      }
      
      if (submission) {
        await AssignmentProAPI.updateSubmission(submission.id, submissionData)
        setSubmission({ ...submission, status: 'submitted' })
      } else {
        const newSubmission = await AssignmentProAPI.createSubmission(submissionData)
        setSubmission(newSubmission)
      }
    } catch (err: any) {
      console.error('Failed to submit:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    setContent(prev => ({
      ...prev,
      file_upload: [...(prev.file_upload || []), ...fileArray]
    }))
  }

  const removeFile = (index: number) => {
    setContent(prev => ({
      ...prev,
      file_upload: prev.file_upload?.filter((_, i) => i !== index) || []
    }))
  }

  const handleQuizAnswer = (questionId: string, answer: number | number[], isMultiSelect = false) => {
    if (isMultiSelect) {
      const currentAnswers = (quizAnswers[questionId] as number[]) || []
      const newAnswers = currentAnswers.includes(answer as number)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer as number]
      setQuizAnswers(prev => ({ ...prev, [questionId]: newAnswers }))
      setContent(prev => ({ ...prev, quiz: { ...prev.quiz, [questionId]: newAnswers } }))
    } else {
      setQuizAnswers(prev => ({ ...prev, [questionId]: answer }))
      setContent(prev => ({ ...prev, quiz: { ...prev.quiz, [questionId]: answer } }))
    }
  }

  const submitQuiz = () => {
    if (!assignment?.settings?.quiz_questions) return
    
    const results: Record<string, boolean> = {}
    assignment.settings.quiz_questions.forEach(question => {
      if (question.type === 'multi-select') {
        const studentAnswer = (quizAnswers[question.id] as number[]) || []
        const correctAnswer = question.correctIndexes || []
        results[question.id] = studentAnswer.length === correctAnswer.length && 
          studentAnswer.every(ans => correctAnswer.includes(ans))
      } else {
        results[question.id] = quizAnswers[question.id] === question.correctIndex
      }
    })
    
    setQuizResults(results)
    setQuizSubmitted(true)
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    if (type.includes('pdf') || type.includes('document')) return FileText
    if (type.includes('code') || type.includes('text')) return Code
    if (type.includes('archive') || type.includes('zip')) return Archive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getWordCount = (text: string) => {
    if (!text) return 0
    // Remove HTML tags and count words
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return cleanText.split(' ').filter(word => word.length > 0).length
  }

  const getCharacterCount = (text: string) => {
    if (!text) return 0
    // Remove HTML tags and count characters
    return text.replace(/<[^>]*>/g, '').length
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const renderContentEditor = () => {
    if (!assignment) return null

    switch (assignment.type) {
      case 'essay':
        return (
          <div className="space-y-4">
            <Label className="text-white">Your Essay</Label>
            <RichTextEditor
              value={content.essay || ''}
              onChange={(value) => setContent({ ...content, essay: value })}
              placeholder="Write your essay here..."
              className="min-h-[400px]"
            />
          </div>
        )
      
      case 'file_upload':
        return (
          <div className="space-y-4">
            <Label className="text-white">Upload Files</Label>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/30 transition-colors">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-2 text-lg">Drag and drop files here or click to browse</p>
              <p className="text-slate-400 mb-4 text-sm">Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>

            {/* Uploaded Files List */}
            {content.file_upload && content.file_upload.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-white font-medium">Uploaded Files ({content.file_upload.length})</h4>
                {content.file_upload.map((file, index) => {
                  const Icon = getFileIcon(file)
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-slate-400 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      
      case 'quiz':
        if (!assignment.settings?.quiz_questions) {
          return (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No quiz questions available for this assignment.</p>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-white text-lg">Quiz Questions</Label>
              {!quizSubmitted && (
                <Button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < assignment.settings.quiz_questions.length}
                  className=""
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Quiz
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {assignment.settings.quiz_questions.map((question, index) => {
                const studentAnswer = quizAnswers[question.id]
                const isCorrect = quizSubmitted ? quizResults[question.id] : undefined
                
                return (
                  <div key={question.id} className="border border-white/10 rounded-lg p-6 bg-white/5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2">{question.question}</h4>
                        {question.type === 'multi-select' && (
                          <p className="text-slate-400 text-sm">Select all that apply</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {question.options?.map((option, optionIndex) => {
                        const isSelected = question.type === 'multi-select'
                          ? (studentAnswer as number[])?.includes(optionIndex)
                          : studentAnswer === optionIndex
                        
                        return (
                          <label key={optionIndex} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                            <input
                              type={question.type === 'multi-select' ? 'checkbox' : 'radio'}
                              name={`question-${question.id}`}
                              checked={isSelected}
                              onChange={() => handleQuizAnswer(question.id, optionIndex, question.type === 'multi-select')}
                              disabled={quizSubmitted}
                              className="text-blue-500"
                            />
                            <span className={`flex-1 ${
                              quizSubmitted
                                ? optionIndex === (question.type === 'multi-select' ? question.correctIndexes?.[0] : question.correctIndex)
                                  ? 'text-green-400'
                                  : isSelected && optionIndex !== (question.type === 'multi-select' ? question.correctIndexes?.[0] : question.correctIndex)
                                  ? 'text-red-400'
                                  : 'text-slate-400'
                                : 'text-slate-300'
                            }`}>
                              {option}
                            </span>
                            {quizSubmitted && (
                              <>
                                {optionIndex === (question.type === 'multi-select' ? question.correctIndexes?.[0] : question.correctIndex) && (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                )}
                                {isSelected && optionIndex !== (question.type === 'multi-select' ? question.correctIndexes?.[0] : question.correctIndex) && (
                                  <XCircle className="h-5 w-5 text-red-400" />
                                )}
                              </>
                            )}
                          </label>
                        )
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        isCorrect ? 'bg-green-600/20 border border-green-600/30' : 'bg-red-600/20 border border-red-600/30'
                      }`}>
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            isCorrect ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {quizSubmitted && (
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-4">Quiz Results</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {Object.values(quizResults).filter(Boolean).length}
                    </div>
                    <div className="text-slate-400 text-sm">Correct Answers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {Math.round((Object.values(quizResults).filter(Boolean).length / assignment.settings.quiz_questions.length) * 100)}%
                    </div>
                    <div className="text-slate-400 text-sm">Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'project':
        return (
          <div className="space-y-4">
            <Label className="text-white">Project Description</Label>
            <RichTextEditor
              value={content.project || ''}
              onChange={(value) => setContent({ ...content, project: value })}
              placeholder="Describe your project..."
              className="min-h-[400px]"
            />
          </div>
        )
      
      case 'discussion':
        return (
          <div className="space-y-4">
            <Label className="text-white">Your Response</Label>
            <RichTextEditor
              value={content.discussion || ''}
              onChange={(value) => setContent({ ...content, discussion: value })}
              placeholder="Share your thoughts on the discussion topic..."
              className="min-h-[400px]"
            />
          </div>
        )
      
      case 'presentation':
        return (
          <div className="space-y-4">
            <Label className="text-white">Presentation Notes</Label>
            <RichTextEditor
              value={content.presentation || ''}
              onChange={(value) => setContent({ ...content, presentation: value })}
              placeholder="Add your presentation notes or description..."
              className="min-h-[400px]"
            />
          </div>
        )
      
      case 'code_submission':
        return (
          <div className="space-y-4">
            <Label className="text-white">Your Code</Label>
            <div className="relative">
              <Textarea
                value={content.code_submission || ''}
                onChange={(e) => setContent({ ...content, code_submission: e.target.value })}
                placeholder="Write your code here..."
                className="min-h-[500px] bg-slate-900 border-white/10 text-green-400 font-mono text-sm leading-relaxed"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-slate-800/80 text-slate-300 border-slate-700">
                  <Code className="h-3 w-3 mr-1" />
                  Code Editor
                </Badge>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">Assignment type not supported yet.</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <GlassCard className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Loading workspace...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="w-full space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <GlassCard className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-white mb-2">Assignment Not Found</h3>
            <p className="text-slate-400">{error || 'This assignment could not be loaded.'}</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return FileText
      case 'file_upload': return Upload
      case 'quiz': return Target
      case 'project': return BookOpen
      case 'discussion': return MessageSquare
      case 'presentation': return Presentation
      case 'code_submission': return Code
      default: return FileText
    }
  }

  const AssignmentIcon = getAssignmentIcon(assignment.type)

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignment
        </Button>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          {isAutoSaving && (
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
              <Save className="h-3 w-3 mr-1 animate-pulse" />
              Auto-saving...
            </Badge>
          )}
          {lastSaved && !isAutoSaving && (
            <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-green-600/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
          
          {/* Timer */}
          {timeRemaining !== null && timerActive && (
            <Badge className={`${
              timeRemaining < 300 ? 'bg-red-600/20 text-red-300 border-red-600/30' : 
              timeRemaining < 600 ? 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30' :
              'bg-blue-600/20 text-blue-300 border-blue-600/30'
            }`}>
              <Timer className="h-3 w-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
          
          {/* Submission status */}
          {submission?.status === 'submitted' && (
            <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Submitted
            </Badge>
          )}
          {submission?.status === 'graded' && (
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
              <Award className="h-3 w-3 mr-1" />
              Graded
            </Badge>
          )}
          {!submission && (
            <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-600/30">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {/* Assignment Info */}
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <AssignmentIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
                  {assignment.description && (
                    <p className="text-slate-300 mt-1">{assignment.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>{assignment.points} points</span>
                </div>
                {assignment.due_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <AssignmentIcon className="h-4 w-4" />
                  <span className="capitalize">{assignment.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Instructions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-400" />
              Instructions
            </h3>
            <div className="text-slate-300 whitespace-pre-wrap bg-white/5 p-4 rounded-lg border border-white/10">
              {assignment.instructions}
            </div>
          </GlassCard>

          {/* Content Editor */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-400" />
                Your Work
              </h3>
              {/* Word/Character count for text-based assignments */}
              {(assignment.type === 'essay' || assignment.type === 'project' || assignment.type === 'discussion' || assignment.type === 'presentation') && (
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  {(() => {
                    const text = content[assignment.type as keyof typeof content] as string || ''
                    const wordCount = getWordCount(text)
                    const charCount = getCharacterCount(text)
                    return (
                      <>
                        <span>{wordCount} words</span>
                        <span>{charCount} characters</span>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
            {renderContentEditor()}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress & Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Actions
            </h3>
            <div className="space-y-3">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                variant="outline" 
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || submission?.status === 'submitted'}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : submission?.status === 'submitted' ? 'Already Submitted' : 'Submit Assignment'}
              </Button>
            </div>
          </GlassCard>

          {/* Assignment Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Settings
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Max Attempts</span>
                <span className="text-white">{assignment.max_attempts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Time Limit</span>
                <span className="text-white">
                  {assignment.time_limit_minutes ? `${assignment.time_limit_minutes} min` : 'No limit'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Late Submissions</span>
                <span className="text-white">
                  {assignment.allow_late_submissions ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
              {assignment.late_penalty_percent > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Late Penalty</span>
                  <span className="text-red-400">{assignment.late_penalty_percent}%</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Time Warning */}
          {timeRemaining !== null && timeRemaining < 300 && timerActive && (
            <GlassCard className="p-6 border-red-600/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <h4 className="text-red-400 font-medium">Time Running Out!</h4>
                  <p className="text-slate-300 text-sm">
                    {timeRemaining < 60 
                      ? `Only ${timeRemaining} seconds remaining!` 
                      : `Only ${Math.ceil(timeRemaining / 60)} minutes remaining!`
                    }
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Progress Indicator */}
          {assignment.type === 'quiz' && assignment.settings?.quiz_questions && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Quiz Progress
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Questions Answered</span>
                  <span className="text-white">
                    {Object.keys(quizAnswers).length} / {assignment.settings.quiz_questions.length}
                  </span>
                </div>
                <Progress 
                  value={(Object.keys(quizAnswers).length / assignment.settings.quiz_questions.length) * 100} 
                  className="h-2"
                />
                {quizSubmitted && (
                  <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                    <div className="text-green-400 font-medium">
                      Score: {Object.values(quizResults).filter(Boolean).length} / {assignment.settings.quiz_questions.length}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
