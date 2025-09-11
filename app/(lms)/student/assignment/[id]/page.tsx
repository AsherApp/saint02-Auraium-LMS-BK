"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { useAssignment, useMySubmission } from "@/services/assignments/hook"
import { type Assignment } from "@/services/assignments/api"
import { ArrowLeft, FileText, Award, Calendar, Clock, AlertTriangle, CheckCircle, Settings, BookOpen, Users, Star, Download, Link as LinkIcon, Layers, FolderOpen, BookMarked, Edit } from "lucide-react"

export default function StudentAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const assignmentId = params.id as string
  
  const { assignment, loading, error } = useAssignment(assignmentId)
  const { submission } = useMySubmission(assignmentId)
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [moduleInfo, setModuleInfo] = useState<any>(null)
  const [lessonInfo, setLessonInfo] = useState<any>(null)

  // Update course info when assignment loads
  useEffect(() => {
    if (assignment) {
      setCourseInfo({
        id: assignment.course_id,
        title: `Course ${assignment.course_id}`
      })
      
      if (assignment.scope?.moduleId) {
        setModuleInfo({
          id: assignment.scope.moduleId,
          title: `Module ${assignment.scope.moduleId}`
        })
      }
      
      if (assignment.scope?.lessonId) {
        setLessonInfo({
          id: assignment.scope.lessonId,
          title: `Lesson ${assignment.scope.lessonId}`
        })
      }
    }
  }, [assignment])

  const handleStartAssignment = () => {
    // Navigate to the existing comprehensive workspace
    router.push(`/student/course/${assignment?.course_id}/assignment/${assignmentId}`)
  }

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-6 w-6 text-blue-400" />
      case 'project': return <BarChart3 className="h-6 w-6 text-green-400" />
      case 'quiz': return <CheckCircle className="h-6 w-6 text-purple-400" />
      case 'discussion': return <Users className="h-6 w-6 text-orange-400" />
      case 'presentation': return <Eye className="h-6 w-6 text-indigo-400" />
      case 'code_submission': return <FileText className="h-6 w-6 text-emerald-400" />
      case 'peer_review': return <Users className="h-6 w-6 text-pink-400" />
      case 'file_upload': return <FileText className="h-6 w-6 text-cyan-400" />
      default: return <FileText className="h-6 w-6 text-slate-400" />
    }
  }

  const getStatusBadge = () => {
    if (!submission) {
      if (assignment?.due_at && new Date(assignment.due_at) < new Date()) {
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
      }
      return <Badge variant="outline" className="border-slate-500 text-slate-400">Not Started</Badge>
    }

    switch (submission.status) {
      case 'graded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Submitted</Badge>
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft</Badge>
      case 'returned':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Returned for Resubmission</Badge>
      default:
        return <Badge variant="outline" className="border-slate-500 text-slate-400">{submission.status}</Badge>
    }
  }

  const getActionButton = () => {
    if (!submission) {
      return (
        <Button onClick={handleStartAssignment} className="bg-blue-600/80 hover:bg-blue-600 text-white">
          Start Assignment
        </Button>
      )
    }

    switch (submission.status) {
      case 'graded':
        return (
          <Button onClick={handleStartAssignment} className="bg-green-600/80 hover:bg-green-600 text-white">
            View Result
          </Button>
        )
      case 'submitted':
        return (
          <Button onClick={handleStartAssignment} className="bg-blue-600/80 hover:bg-blue-600 text-white">
            View Submission
          </Button>
        )
      case 'draft':
        return (
          <Button onClick={handleStartAssignment} className="bg-yellow-600/80 hover:bg-yellow-600 text-white">
            Continue Assignment
          </Button>
        )
      case 'returned':
        return (
          <Button onClick={handleStartAssignment} className="bg-orange-600/80 hover:bg-orange-600 text-white">
            Resubmit Assignment
          </Button>
        )
      default:
        return (
          <Button onClick={handleStartAssignment} className="bg-blue-600/80 hover:bg-blue-600 text-white">
            View Assignment
          </Button>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading assignment</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{assignment.title}</h1>
            <p className="text-slate-400">Assignment Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {getActionButton()}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Overview */}
          <GlassCard className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-white/10 rounded-lg">
                {getAssignmentIcon(assignment.type)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">{assignment.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(assignment.created_at).toLocaleDateString()}</span>
                  </div>
                  {assignment.due_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{assignment.points} points</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                <p className="text-slate-300">{assignment.description}</p>
              </div>

              {assignment.instructions && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Instructions</h3>
                  <div className="text-slate-300 whitespace-pre-wrap">{assignment.instructions}</div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Submission Status */}
          {submission && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Your Submission</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  {getStatusBadge()}
                </div>
                {submission.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Submitted:</span>
                    <span className="text-white">{new Date(submission.submitted_at).toLocaleString()}</span>
                  </div>
                )}
                {submission.grade !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grade:</span>
                    <span className="text-white font-semibold">{submission.grade}%</span>
                  </div>
                )}
                {submission.feedback && (
                  <div>
                    <span className="text-slate-400">Feedback:</span>
                    <p className="text-slate-300 mt-1">{submission.feedback}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Assignment Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <Badge variant="outline" className="border-slate-500 text-slate-300 capitalize">
                  {assignment.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Points:</span>
                <span className="text-white">{assignment.points}</span>
              </div>
              {assignment.due_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="text-white">{new Date(assignment.due_at).toLocaleDateString()}</span>
                </div>
              )}
              {assignment.max_attempts > 1 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Attempts:</span>
                  <span className="text-white">{assignment.max_attempts}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Course Info */}
          {courseInfo && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Course</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{courseInfo.title}</p>
                  <p className="text-slate-400 text-sm">Course</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Module Info */}
          {moduleInfo && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Module</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Layers className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{moduleInfo.title}</p>
                  <p className="text-slate-400 text-sm">Module</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Lesson Info */}
          {lessonInfo && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Lesson</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BookMarked className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{lessonInfo.title}</p>
                  <p className="text-slate-400 text-sm">Lesson</p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}