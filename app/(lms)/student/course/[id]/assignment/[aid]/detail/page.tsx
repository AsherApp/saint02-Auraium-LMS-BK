"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useCourseStore } from "@/store/course-store"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentProAPI, type Assignment, type Submission } from "@/services/assignment-pro/api"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { 
  ArrowLeft,
  Play,
  FileText,
  Calendar,
  Clock,
  Target,
  Award,
  CheckCircle2,
  AlertTriangle,
  Users,
  BookOpen,
  Video,
  Code,
  MessageSquare,
  Presentation,
  ClipboardList,
  Eye,
  Download,
  RefreshCw,
  Loader2
} from "lucide-react"

export default function StudentAssignmentDetailPage() {
  const params = useParams<{ id: string; aid: string }>()
  const router = useRouter()
  const course = useCourseStore((s) => s.getById(params.id))
  const { user } = useAuthStore()
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Document viewers
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [viewingPresentation, setViewingPresentation] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!params.aid || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignment details
        const assignmentData = await AssignmentProAPI.getAssignment(params.aid)
        setAssignment(assignmentData)

        // Fetch existing submission
        try {
          const submissionData = await AssignmentProAPI.getSubmission(params.aid)
          if (submissionData) {
            setSubmission(submissionData)
          }
        } catch (submissionError) {
          // No existing submission - that's okay for detail view
          console.log('No existing submission found')
        }
      } catch (err: any) {
        console.error('Failed to fetch assignment:', err)
        setError(err.message || 'Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.aid, user?.email])

  // Calculate assignment status
  const getAssignmentStatus = () => {
    if (!assignment) return 'unknown'
    
    const now = Date.now()
    const dueDate = assignment.due_at ? new Date(assignment.due_at).getTime() : null
    const isOverdue = !!dueDate && dueDate < now
    
    if (submission) {
      if (submission.grade !== null) return 'graded'
      if (submission.status === 'submitted') return 'submitted'
      return 'in_progress'
    }
    
    if (isOverdue) return 'overdue'
    return 'not_started'
  }

  const getStatusInfo = () => {
    const status = getAssignmentStatus()
    switch (status) {
      case 'graded':
        return {
          badge: <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Award className="h-3 w-3 mr-1" />Graded</Badge>,
          canStart: false,
          buttonText: 'View Submission & Grade',
          message: 'Assignment completed and graded'
        }
      case 'submitted':
        return {
          badge: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Submitted</Badge>,
          canStart: assignment?.max_attempts && submission && submission.attempt_number < assignment.max_attempts,
          buttonText: 'View Submission',
          message: 'Assignment submitted, waiting for grade'
        }
      case 'in_progress':
        return {
          badge: <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>,
          canStart: true,
          buttonText: 'Continue Assignment',
          message: 'Continue working on your assignment'
        }
      case 'overdue':
        return {
          badge: <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>,
          canStart: assignment?.allow_late_submissions,
          buttonText: assignment?.allow_late_submissions ? 'Start Assignment (Late)' : 'Assignment Overdue',
          message: assignment?.allow_late_submissions 
            ? `Late submissions allowed with ${assignment.late_penalty_percent}% penalty`
            : 'This assignment is overdue and no longer accepts submissions'
        }
      default:
        return {
          badge: <Badge variant="outline" className="border-slate-500 text-slate-300"><Play className="h-3 w-3 mr-1" />Ready to Start</Badge>,
          canStart: true,
          buttonText: 'Start Assignment',
          message: 'Ready to begin working on this assignment'
        }
    }
  }

  const getAssignmentIcon = (type: string) => {
    const icons = {
      essay: FileText,
      file_upload: FileText,
      quiz: ClipboardList,
      project: BookOpen,
      discussion: MessageSquare,
      presentation: Presentation,
      code_submission: Code,
      peer_review: Users,
      video: Video
    }
    const Icon = icons[type as keyof typeof icons] || FileText
    return <Icon className="h-5 w-5" />
  }

  const handleStartAssignment = () => {
    // Navigate to the general assignment detail page for simplicity
    router.push(`/student/assignment/${params.aid}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
            <span className="text-slate-300">Loading assignment...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error || !assignment || !course) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Assignment Not Found</h3>
            <p className="text-slate-400 mb-4">{error || 'Assignment not found or you don\'t have access to it.'}</p>
            <Button 
              onClick={() => router.push('/student/assignments')}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  const statusInfo = getStatusInfo()
  const progress = submission ? 75 : 0 // Mock progress based on submission status

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/student/assignments')}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-2 mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-400">{course.title}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3">{assignment.title}</h1>
            
            {assignment.description && (
              <p className="text-slate-300 mb-4">{assignment.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                {getAssignmentIcon(assignment.type)}
                <span className="text-slate-300 capitalize">
                  {assignment.type.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-slate-400">
                <Target className="h-4 w-4" />
                <span>{assignment.points} points</span>
              </div>
              
              {assignment.due_at && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                </div>
              )}
              
              {assignment.time_limit_minutes && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{assignment.time_limit_minutes} minutes</span>
                </div>
              )}
            </div>

            {/* Status and Progress */}
            <div className="flex items-center gap-4 mb-4">
              {statusInfo.badge}
              
              {submission?.grade !== null && (
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium">
                    Grade: {submission.grade}/{assignment.points} ({Math.round((submission.grade / assignment.points) * 100)}%)
                  </span>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Progress</span>
                <span className="text-white">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <p className="text-slate-300 text-sm mb-4">{statusInfo.message}</p>
          </div>
        </div>
      </GlassCard>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          {assignment.instructions && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-slate-300 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            </GlassCard>
          )}

          {/* Resources */}
          {assignment.resources && assignment.resources.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Resources</h3>
              <div className="space-y-3">
                {assignment.resources.map((resource) => {
                  const isDocument = resource.type?.includes('pdf') || 
                                   resource.type?.includes('text') || 
                                   resource.name.toLowerCase().match(/\.(pdf|txt|md|doc|docx)$/)
                  const isPresentation = resource.name.toLowerCase().match(/\.(ppt|pptx|key|odp)$/) ||
                                        resource.type?.includes('presentation')
                  
                  return (
                    <div key={resource.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        {isPresentation ? (
                          <Presentation className="h-5 w-5 text-purple-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-400" />
                        )}
                        <div>
                          <h4 className="text-white font-medium">{resource.name}</h4>
                          {resource.description && (
                            <p className="text-slate-400 text-sm">{resource.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(isDocument || isPresentation) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const resourceFile = {
                                id: resource.id,
                                name: resource.name,
                                type: resource.type || '',
                                size: resource.size || 0,
                                url: resource.url
                              }
                              if (isPresentation) {
                                setViewingPresentation(resourceFile)
                              } else {
                                setViewingDocument(resourceFile)
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = resource.url
                            link.download = resource.name
                            link.click()
                          }}
                          className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Rubric (if available) */}
          {assignment.rubric && assignment.rubric.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Grading Rubric</h3>
              <div className="space-y-3">
                {assignment.rubric.map((criterion) => (
                  <div key={criterion.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{criterion.name}</h4>
                      <span className="text-slate-400 text-sm">{criterion.max_points} points</span>
                    </div>
                    {criterion.description && (
                      <p className="text-slate-300 text-sm">{criterion.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Action</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={handleStartAssignment}
                  disabled={!statusInfo.canStart}
                  className={`w-full ${statusInfo.canStart 
                    ? 'bg-green-600/80 hover:bg-green-600' 
                    : 'bg-slate-600/50 cursor-not-allowed'} text-white`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {statusInfo.buttonText}
                </Button>
              </div>
              
              {submission && (
                <div className="text-center pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-sm mb-2">Last worked on:</p>
                  <p className="text-white text-sm">
                    {new Date(submission.updated_at || submission.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Assignment Info */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Info</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-white capitalize">{assignment.type.replace('_', ' ')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Points:</span>
                <span className="text-white">{assignment.points}</span>
              </div>
              
              {assignment.max_attempts > 1 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Attempts:</span>
                  <span className="text-white">
                    {submission?.attempt_number || 0}/{assignment.max_attempts}
                  </span>
                </div>
              )}
              
              {assignment.time_limit_minutes && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Limit:</span>
                  <span className="text-white">{assignment.time_limit_minutes} minutes</span>
                </div>
              )}
              
              {assignment.due_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="text-white">
                    {new Date(assignment.due_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {assignment.allow_late_submissions && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Late Penalty:</span>
                  <span className="text-white">{assignment.late_penalty_percent}%</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Grade Info (if graded) */}
          {submission?.grade !== null && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Grade</h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-400">
                  {submission.grade}/{assignment.points}
                </div>
                <div className="text-slate-400 text-sm">
                  {Math.round((submission.grade / assignment.points) * 100)}%
                </div>
              </div>
              
              {submission.feedback && (
                <div>
                  <h4 className="text-white font-medium mb-2">Feedback</h4>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        title="Assignment Resource"
        subtitle={assignment.title}
      />

      {/* Presentation Viewer */}
      <PresentationViewer
        presentation={viewingPresentation}
        isOpen={!!viewingPresentation}
        onClose={() => setViewingPresentation(null)}
        title="Assignment Resource"
        subtitle={assignment.title}
      />
    </div>
  )
}