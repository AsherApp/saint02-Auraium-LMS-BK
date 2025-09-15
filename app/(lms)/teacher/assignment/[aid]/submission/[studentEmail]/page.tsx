"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAssignment } from "@/services/assignments/hook"
import { useSubmission, useSubmissionManagement } from "@/services/submissions/hook"
import { http } from "@/services/http"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Award,
  Download,
  Eye,
  Save,
  Send
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileList } from "@/components/shared/file-list"
import { QuizViewer } from "@/components/assignment/quiz-viewer"
import { CodeViewer } from "@/components/shared/code-viewer"
import { PeerReviewViewer } from "@/components/shared/peer-review-viewer"
import { FileUploadViewer } from "@/components/shared/file-upload-viewer"

export default function TeacherSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Extract parameters from the URL
  const assignmentId = params.aid as string
  const submissionId = params.studentEmail as string // This is actually submission ID
  
  const { assignment, loading: assignmentLoading } = useAssignment(assignmentId)
  const { submission, loading: submissionLoading, error: submissionError } = useSubmission(submissionId)
  const { gradeSubmission, loading: grading } = useSubmissionManagement()
  
  // Grading state
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [requestResubmission, setRequestResubmission] = useState(false)

  // Update grading state when submission loads
  useEffect(() => {
    if (submission) {
      setGrade(submission.grade || 0)
      setFeedback(submission.feedback || "")
    }
  }, [submission])

  const handleGradeSubmission = async () => {
    if (!submission) return
    
    try {
      await gradeSubmission(submission.id, {
        grade,
        feedback,
        requestResubmission
      })
      
      toast({
        title: requestResubmission ? "Submission returned for resubmission" : "Submission graded successfully",
        description: `Grade: ${grade}/${assignment?.points}`,
      })
      
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to grade submission:', error)
      toast({
        title: "Failed to grade submission",
        description: error.message || "Please try again",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case 'returned':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Returned for Resubmission
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-400">
            {status}
          </Badge>
        )
    }
  }

  if (assignmentLoading || submissionLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading submission...</div>
        </GlassCard>
      </div>
    )
  }

  if (submissionError || !assignment || !submission) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Submission Not Found</h3>
            <p className="text-slate-400 mb-4">
              {submissionError || "This submission doesn't exist or you don't have access to it."}
            </p>
            <Button 
              onClick={() => router.push(`/teacher/assignment/${assignmentId}`)}
              className="bg-blue-600/80 hover:bg-blue-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignment
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/teacher/assignment/${assignmentId}`)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">{assignment.title}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3">Student Submission Review</h1>
            <p className="text-slate-400">Review and grade student submission</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(submission.status)}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Submission */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{submission?.student_name || 'Unknown Student'}</h3>
                <p className="text-sm text-slate-400">{submission?.student_email || 'Unknown Email'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Submitted:</span>
                <span className="text-white">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Status:</span>
                <span className="text-white capitalize">{submission.status}</span>
              </div>
            </div>
          </GlassCard>

          {/* Submission Content */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Student Response</h3>
            
            {submission.response ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Student Response</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{submission.response}</p>
                </div>
              </div>
            ) : submission.content && Object.keys(submission.content).length > 0 ? (
              <div className="space-y-4">
                {/* Debug: Show the actual content structure */}
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="font-medium text-yellow-400 mb-2">Debug: Content Structure</h4>
                  <pre className="text-xs text-slate-300 overflow-auto">
                    {JSON.stringify(submission.content, null, 2)}
                  </pre>
                </div>

                {/* Handle different content types safely */}
                {submission.content.essay && typeof submission.content.essay === 'string' && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Essay Response</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.essay}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.project && typeof submission.content.project === 'string' && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Project Description</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.project}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.discussion && typeof submission.content.discussion === 'string' && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Discussion Response</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.discussion}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.quiz && assignment?.settings?.quiz_questions && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Quiz Response</h4>
                    <QuizViewer
                      questions={assignment.settings.quiz_questions}
                      submission={submission.content.quiz}
                      showResults={true}
                      isTeacherView={true}
                    />
                  </div>
                )}
                
                {submission.content.code_submission && typeof submission.content.code_submission === 'string' && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Code Submission</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <pre className="text-slate-300 whitespace-pre-wrap">{submission.content.code_submission}</pre>
                    </div>
                  </div>
                )}

                {submission.content.peer_review && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Peer Review</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <pre className="text-slate-300 whitespace-pre-wrap text-xs overflow-auto">
                        {JSON.stringify(submission.content.peer_review, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {submission.content.file_upload && (
                  <div>
                    <h4 className="font-medium text-white mb-2">File Upload</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <pre className="text-slate-300 whitespace-pre-wrap text-xs overflow-auto">
                        {JSON.stringify(submission.content.file_upload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {submission.content.presentation && typeof submission.content.presentation === 'string' && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Presentation Notes</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div 
                        className="text-slate-300 whitespace-pre-wrap prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: submission.content.presentation }}
                      />
                    </div>
                  </div>
                )}

                {submission.content.files && Array.isArray(submission.content.files) && submission.content.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Uploaded Files</h4>
                    <div className="space-y-2">
                      {submission.content.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-300">{file.name || `File ${index + 1}`}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Handle any other content types that might exist */}
                {Object.entries(submission.content).map(([key, value]) => {
                  // Skip already handled fields
                  if (['essay', 'project', 'discussion', 'quiz', 'code_submission', 'peer_review', 'file_upload', 'presentation', 'files'].includes(key)) {
                    return null
                  }
                  
                  // Handle unknown fields safely
                  return (
                    <div key={key}>
                      <h4 className="font-medium text-white mb-2">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        {typeof value === 'string' ? (
                          <p className="text-slate-300 whitespace-pre-wrap">{value}</p>
                        ) : (
                          <pre className="text-slate-300 whitespace-pre-wrap text-xs overflow-auto">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No response provided</p>
              </div>
            )}
          </GlassCard>

          {/* Attachments */}
          {submission.files && submission.files.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
              <div className="space-y-2">
                {submission.files.map((file: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">{file.name || `File ${index + 1}`}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Grading Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Grading</h3>
            
            <div className="space-y-4">
              {/* Grade Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Grade (out of {assignment.points})
                </label>
                <Input
                  type="number"
                  min="0"
                  max={assignment.points}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter grade"
                />
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Feedback
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-white/5 border-white/10 text-white min-h-[120px]"
                  placeholder="Provide feedback to the student..."
                />
              </div>

              {/* Request Resubmission Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requestResubmission"
                  checked={requestResubmission}
                  onChange={(e) => setRequestResubmission(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requestResubmission" className="text-sm text-slate-300">
                  Request resubmission
                </label>
              </div>

              {/* Current Grade Display */}
              {submission.grade !== null && submission.grade !== undefined && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">
                      Current Grade: {submission.grade}/{assignment.points}
                    </span>
                  </div>
                  {submission.feedback && (
                    <p className="text-sm text-slate-300 mt-2">{submission.feedback}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Submit Grade Button */}
                <Button
                  onClick={handleGradeSubmission}
                  disabled={grading}
                  className="w-full bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  {grading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Grading...
                    </>
                  ) : submission.status === 'graded' ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Grade
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {requestResubmission ? 'Return for Resubmission' : 'Submit Grade'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Assignment Details */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Type:</span>
                <span className="text-white capitalize">{assignment.type.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Points:</span>
                <span className="text-white">{assignment.points}</span>
              </div>
              
              {assignment.due_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">Due:</span>
                  <span className="text-white">{new Date(assignment.due_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
