"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentProAPI, type Assignment } from "@/services/assignment-pro/api"
import { ArrowLeft, FileText, Award, Calendar, Clock, AlertTriangle, CheckCircle, Settings, BookOpen, Users, Star, Download, Link as LinkIcon, Layers, FolderOpen, BookMarked } from "lucide-react"
import { http } from "@/services/http"

export default function StudentAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [moduleInfo, setModuleInfo] = useState<any>(null)
  const [lessonInfo, setLessonInfo] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssignmentAndContext = async () => {
      if (!assignmentId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignment
        const assignmentData = await AssignmentProAPI.getAssignment(assignmentId)
        setAssignment(assignmentData)

        // Fetch student's submission for this assignment
        try {
          const submissions = await AssignmentProAPI.getStudentSubmissions(assignmentId)
          if (submissions.length > 0) {
            setSubmission(submissions[0]) // Get the latest submission
          }
        } catch (err) {
          // No submission found, that's fine
          console.log('No submission found for this assignment')
        }

        // Fetch course information
        if (assignmentData.course_id) {
          try {
            const courseResponse = await http<any>(`/api/courses/${assignmentData.course_id}`)
            setCourseInfo(courseResponse)
          } catch (err) {
            console.error('Failed to fetch course info:', err)
          }
        }

        // Fetch module information if assignment is module or lesson scoped
        if (assignmentData.scope?.level === 'module' || assignmentData.scope?.level === 'lesson') {
          if (assignmentData.scope?.moduleId) {
            try {
              const moduleResponse = await http<any>(`/api/courses/${assignmentData.course_id}/modules/${assignmentData.scope.moduleId}`)
              setModuleInfo(moduleResponse)
            } catch (err) {
              console.error('Failed to fetch module info:', err)
            }
          }
        }

        // Fetch lesson information if assignment is lesson scoped
        if (assignmentData.scope?.level === 'lesson') {
          if (assignmentData.scope?.lessonId) {
            try {
              const lessonResponse = await http<any>(`/api/courses/${assignmentData.course_id}/modules/${assignmentData.scope.moduleId}/lessons/${assignmentData.scope.lessonId}`)
              setLessonInfo(lessonResponse)
            } catch (err) {
              console.error('Failed to fetch lesson info:', err)
            }
          }
        }

      } catch (err: any) {
        console.error('Failed to fetch assignment:', err)
        setError(err.message || 'Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignmentAndContext()
  }, [assignmentId, user?.email])

  const handleStartAssignment = () => {
    // Navigate to the existing comprehensive workspace
    router.push(`/student/course/${assignment.course_id}/assignment/${assignmentId}`)
  }

  const getSubmissionStatusBadge = () => {
    if (!submission) {
      return (
        <Badge variant="outline" className="border-slate-500 text-slate-400">
          <Clock className="h-3 w-3 mr-1" />
          Not Started
        </Badge>
      )
    }

    switch (submission.status) {
      case 'graded':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-400">
            {submission.status}
          </Badge>
        )
    }
  }

  const getActionButtonText = () => {
    if (!submission) return 'Start Assignment'
    if (submission.status === 'graded') return 'View Results'
    if (submission.status === 'submitted') return 'View Submission'
    return 'Continue Assignment'
  }

  const getActionButtonIcon = () => {
    if (!submission) return <FileText className="h-5 w-5 mr-2" />
    if (submission.status === 'graded') return <Award className="h-5 w-5 mr-2" />
    if (submission.status === 'submitted') return <CheckCircle className="h-5 w-5 mr-2" />
    return <FileText className="h-5 w-5 mr-2" />
  }

  const getScopeIcon = (level: string) => {
    switch (level) {
      case 'course': return <BookOpen className="h-4 w-4" />
      case 'module': return <FolderOpen className="h-4 w-4" />
      case 'lesson': return <BookMarked className="h-4 w-4" />
      default: return <Layers className="h-4 w-4" />
    }
  }

  const getScopeLabel = (level: string) => {
    switch (level) {
      case 'course': return 'Course Assignment'
      case 'module': return 'Module Assignment'
      case 'lesson': return 'Lesson Assignment'
      default: return 'Assignment'
    }
  }

  const getScopeColor = (level: string) => {
    switch (level) {
      case 'course': return 'bg-blue-600/20 text-blue-300 border-blue-600/30'
      case 'module': return 'bg-purple-600/20 text-purple-300 border-purple-600/30'
      case 'lesson': return 'bg-green-600/20 text-green-300 border-green-600/30'
      default: return 'bg-gray-600/20 text-gray-300 border-gray-600/30'
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
            <span className="ml-3 text-white">Loading assignment...</span>
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

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
        <Badge className={getScopeColor(assignment.scope?.level || 'course')}>
          {getScopeLabel(assignment.scope?.level || 'course')}
        </Badge>
      </div>

      {/* Scope Context Information */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {getScopeIcon(assignment.scope?.level || 'course')}
          <h3 className="text-lg font-semibold text-white">Assignment Context</h3>
        </div>
        <div className="space-y-2">
          {/* Course Context - Always shown */}
          {courseInfo && (
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span className="font-medium">Course:</span>
              <span>{courseInfo.title}</span>
            </div>
          )}

          {/* Module Context - Show if module or lesson scoped */}
          {moduleInfo && (assignment.scope?.level === 'module' || assignment.scope?.level === 'lesson') && (
            <div className="flex items-center gap-2 text-slate-300">
              <FolderOpen className="h-4 w-4 text-purple-400" />
              <span className="font-medium">Module:</span>
              <span>{moduleInfo.title}</span>
            </div>
          )}

          {/* Lesson Context - Show if lesson scoped */}
          {lessonInfo && assignment.scope?.level === 'lesson' && (
            <div className="flex items-center gap-2 text-slate-300">
              <BookMarked className="h-4 w-4 text-green-400" />
              <span className="font-medium">Lesson:</span>
              <span>{lessonInfo.title}</span>
            </div>
          )}

          {/* Scope Level Badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {assignment.scope?.level?.toUpperCase() || 'COURSE'} LEVEL
            </Badge>
            {assignment.scope?.level === 'course' && (
              <span className="text-xs text-slate-400">Available to all students in this course</span>
            )}
            {assignment.scope?.level === 'module' && (
              <span className="text-xs text-slate-400">Specific to this module</span>
            )}
            {assignment.scope?.level === 'lesson' && (
              <span className="text-xs text-slate-400">Specific to this lesson</span>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Overview */}
          <GlassCard className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <Badge variant="outline" className="text-xs">
                    {assignment.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
                {assignment.description && (
                  <p className="text-slate-300 text-lg">{assignment.description}</p>
                )}
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <span>{assignment.points} points</span>
                </div>
                {assignment.due_at && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="h-4 w-4 text-red-400" />
                    <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                  </div>
                )}
                {assignment.available_from && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span>Available: {new Date(assignment.available_from).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Settings className="h-4 w-4 text-purple-400" />
                  <span>Max {assignment.max_attempts} attempt{assignment.max_attempts !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  Instructions
                </h3>
                <div className="text-slate-300 whitespace-pre-wrap bg-white/5 p-4 rounded-lg">
                  {assignment.instructions}
                </div>
              </div>

              {/* Rubric */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Grading Rubric
                  </h3>
                  <div className="space-y-3">
                    {assignment.rubric.map((criteria: any, index: number) => (
                      <div key={index} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{criteria.title}</h4>
                          <span className="text-slate-400">{criteria.points} points</span>
                        </div>
                        <p className="text-slate-300 text-sm">{criteria.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {assignment.resources && assignment.resources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-400" />
                    Resources
                  </h3>
                  <div className="space-y-2">
                    {assignment.resources.map((resource: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                        <LinkIcon className="h-4 w-4 text-blue-400" />
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          {resource.title || resource.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Assignment Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Late Submissions</span>
                <Badge variant={assignment.allow_late_submissions ? "default" : "secondary"}>
                  {assignment.allow_late_submissions ? 'Allowed' : 'Not Allowed'}
                </Badge>
              </div>
              {assignment.allow_late_submissions && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Late Penalty</span>
                  <span className="text-white">{assignment.late_penalty_percent}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Time Limit</span>
                <span className="text-white">
                  {assignment.time_limit_minutes ? `${assignment.time_limit_minutes} min` : 'No limit'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Comments</span>
                <Badge variant={assignment.settings?.allow_comments ? "default" : "secondary"}>
                  {assignment.settings?.allow_comments ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Anonymous Grading</span>
                <Badge variant={assignment.settings?.anonymous_grading ? "default" : "secondary"}>
                  {assignment.settings?.anonymous_grading ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </GlassCard>

          {/* Submission Status & Action */}
          <GlassCard className="p-6">
            <div className="space-y-4">
              {/* Submission Status */}
              <div className="text-center">
                <div className="mb-3">
                  {getSubmissionStatusBadge()}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {submission ? 'Your Submission' : 'Ready to Start?'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {submission 
                    ? submission.status === 'graded' 
                      ? 'Your assignment has been graded'
                      : submission.status === 'submitted'
                      ? 'Your assignment has been submitted'
                      : 'Continue working on your assignment'
                    : 'Click below to begin working on your assignment'
                  }
                </p>
              </div>

              {/* Grade Display */}
              {submission?.status === 'graded' && submission?.grade !== null && submission?.grade !== undefined && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Award className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-bold text-lg">
                      {submission.grade}/{assignment.points}
                    </span>
                  </div>
                  <div className="text-green-400 text-sm">
                    {((submission.grade / assignment.points) * 100).toFixed(1)}%
                  </div>
                  {submission.feedback && (
                    <div className="mt-2 text-slate-300 text-sm">
                      <p className="font-medium">Feedback:</p>
                      <p className="mt-1">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submission Details */}
              {submission && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Submitted:</span>
                    <span className="text-white">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Attempt:</span>
                    <span className="text-white">{submission.attemptNumber}</span>
                  </div>
                  {submission.lateSubmission && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-orange-400">Late Submission</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={handleStartAssignment} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                {getActionButtonIcon()}
                {getActionButtonText()}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
