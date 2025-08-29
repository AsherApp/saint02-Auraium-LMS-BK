"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AssignmentProAPI, type Assignment, type Submission } from "@/services/assignment-pro/api"
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

export default function TeacherSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Extract parameters from the URL
  const assignmentId = params.aid as string
  const submissionId = params.sid as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grading, setGrading] = useState(false)
  
  // Grading state
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [rubricScores, setRubricScores] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      console.log('Route params:', params)
      console.log('Extracted IDs:', { assignmentId, submissionId })
      
      if (!assignmentId || !submissionId) {
        console.error('Missing parameters:', { assignmentId, submissionId })
        setError('Missing assignment or submission ID')
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        console.log('Fetching assignment:', assignmentId)
        console.log('Fetching submission:', submissionId)
        
        // Fetch assignment details
        const assignmentData = await AssignmentProAPI.getAssignment(assignmentId)
        setAssignment(assignmentData)
        
        // Fetch submission details
        const submissionData = await AssignmentProAPI.getSubmission(submissionId)
        setSubmission(submissionData)
        
        // Set initial grading values
        if (submissionData) {
          setGrade(submissionData.grade || 0)
          setFeedback(submissionData.feedback || "")
          setRubricScores(submissionData.rubricScores || {})
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError(err.message || 'Failed to load submission')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId, submissionId])

  const handleGradeSubmission = async () => {
    if (!submission || !assignment) return
    
    setGrading(true)
    try {
      await AssignmentProAPI.gradeSubmission(submission.id, {
        grade,
        feedback,
        rubricScores
      })
      
      toast({
        title: "Submission graded successfully",
        description: `Grade: ${grade}/${assignment.points}`,
      })
      
      // Refresh submission data
      const updatedSubmission = await AssignmentProAPI.getSubmission(submissionId)
      setSubmission(updatedSubmission)
    } catch (error: any) {
      console.error('Failed to grade submission:', error)
      toast({
        title: "Failed to grade submission",
        description: error.message || "Please try again",
        variant: "destructive"
      })
    } finally {
      setGrading(false)
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
      case 'draft':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Draft
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

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center text-slate-300">Loading submission...</div>
        </GlassCard>
      </div>
    )
  }

  if (error || !assignment || !submission) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Submission Not Found</h3>
            <p className="text-slate-400 mb-4">
              This submission doesn't exist or you don't have access to it.
            </p>
            <Button 
              onClick={() => router.push(`/teacher/assignments`)}
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
                onClick={() => router.push(`/teacher/assignments`)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">{assignment.courseTitle}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-3">{assignment.title}</h1>
            <p className="text-slate-400">Student Submission Review & Grading</p>
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
                <h3 className="text-lg font-semibold text-white">{submission.studentName}</h3>
                <p className="text-sm text-slate-400">{submission.studentEmail}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Submitted:</span>
                <span className="text-white">{new Date(submission.submittedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Attempt:</span>
                <span className="text-white">{submission.attemptNumber}</span>
              </div>
              {submission.lateSubmission && (
                <div className="flex items-center gap-2 col-span-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-400">Late Submission</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Submission Content */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Student Response</h3>
            
            {submission.content && Object.keys(submission.content).length > 0 ? (
              <div className="space-y-4">
                {submission.content.essay && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Essay Response</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.essay}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.project && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Project Description</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.project}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.discussion && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Discussion Response</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{submission.content.discussion}</p>
                    </div>
                  </div>
                )}
                
                {submission.content.quiz && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Quiz Answers</h4>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <pre className="text-slate-300 text-sm overflow-auto">
                        {JSON.stringify(submission.content.quiz, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No content submitted</p>
              </div>
            )}
          </GlassCard>

          {/* Attachments */}
          {submission.attachments && submission.attachments.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Attachments</h3>
              <div className="space-y-2">
                {submission.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">{attachment.name || `Attachment ${index + 1}`}</span>
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
                    Submit Grade
                  </>
                )}
              </Button>
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
