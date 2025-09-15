"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SimplifiedAssignmentsAPI, Assignment } from "@/services/assignments/simplified-assignments"
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Download,
  Eye
} from "lucide-react"

interface SimplifiedAssignmentCardProps {
  assignment: Assignment
  onSubmissionUpdate?: () => void
}

export function SimplifiedAssignmentCard({ assignment, onSubmissionUpdate }: SimplifiedAssignmentCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState(assignment.student_submission?.response || "")
  const [showSubmission, setShowSubmission] = useState(false)
  const { toast } = useToast()

  const isSubmitted = assignment.is_submitted
  const isGraded = assignment.is_graded
  const submission = assignment.student_submission

  // Use computed fields from backend
  const isOverdue = assignment.is_overdue
  const isLate = assignment.is_late
  const isAvailable = assignment.is_available
  const timeRemaining = assignment.time_remaining

  const handleSubmit = async () => {
    if (!response.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await SimplifiedAssignmentsAPI.submitAssignment(assignment.id, {
        response: response.trim(),
        files: [] // TODO: Add file upload support
      })

      toast({
        title: "Assignment Submitted! ✅",
        description: "Your assignment has been submitted successfully.",
      })

      onSubmissionUpdate?.()
    } catch (error: any) {
      console.error('Error submitting assignment:', error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit assignment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <GlassCard className="p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
            {isGraded && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Graded
              </Badge>
            )}
            {isSubmitted && !isGraded && (
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
            {isLate && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Late
              </Badge>
            )}
            {!isAvailable && (
              <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Not Available
              </Badge>
            )}
            {assignment.type && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {assignment.type}
              </Badge>
            )}
          </div>
          
          {assignment.description && (
            <p className="text-slate-300 text-sm mb-3">{assignment.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Due: {assignment.due_at ? formatDate(assignment.due_at) : 'No due date'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{assignment.points} points</span>
            </div>
            {assignment.available_from && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Available: {formatDate(assignment.available_from)}</span>
              </div>
            )}
            {assignment.max_attempts > 1 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>{assignment.max_attempts} attempts allowed</span>
              </div>
            )}
            {assignment.time_limit_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{assignment.time_limit_minutes} min limit</span>
              </div>
            )}
            {assignment.allow_late_submissions && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>Late penalty: {assignment.late_penalty_percent}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {assignment.instructions && (
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Instructions:</h4>
          <p className="text-slate-400 text-sm whitespace-pre-wrap">{assignment.instructions}</p>
        </div>
      )}

      {/* Resources */}
      {assignment.resources && assignment.resources.length > 0 && (
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Resources:</h4>
          <div className="space-y-2">
            {assignment.resources.map((resource: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400">{resource.name || resource.title || `Resource ${index + 1}`}</span>
                {resource.url && (
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rubric */}
      {assignment.rubric && assignment.rubric.length > 0 && (
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Grading Rubric:</h4>
          <div className="space-y-2">
            {assignment.rubric.map((criteria: any, index: number) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-slate-300 mb-1">
                  {criteria.name || `Criteria ${index + 1}`} ({criteria.points || 0} points)
                </div>
                <p className="text-slate-400 text-xs">{criteria.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form or View */}
      {!isSubmitted ? (
        <div className="space-y-4">
          {/* Availability Check */}
          {!isAvailable ? (
            <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Assignment Not Available</span>
              </div>
              <p className="text-slate-300 text-sm">
                {assignment.available_from && new Date(assignment.available_from) > new Date() 
                  ? `This assignment will be available from ${formatDate(assignment.available_from)}`
                  : assignment.available_until && new Date(assignment.available_until) < new Date()
                  ? `This assignment expired on ${formatDate(assignment.available_until)}`
                  : 'This assignment is currently not available for submission.'
                }
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Response:
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter your response here..."
                  className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  disabled={isSubmitting || !isAvailable}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {assignment.max_attempts > 1 && (
                    <span>Attempts: {assignment.max_attempts} allowed</span>
                  )}
                  {timeRemaining && (
                    <span className="ml-4">Time remaining: {Math.floor(timeRemaining / 60000)} minutes</span>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !response.trim() || !isAvailable}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Submission Details */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-300">Your Submission</h4>
              <span className="text-xs text-slate-400">
                Submitted: {submission?.submitted_at ? formatDate(submission.submitted_at) : 'Unknown'}
              </span>
            </div>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">
              {submission?.response || 'No response provided'}
            </p>
          </div>

          {/* Grade and Feedback */}
          {isGraded && submission?.grade !== undefined && (
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-400">Grade & Feedback</h4>
                <span className="text-lg font-bold text-green-400">
                  {submission.grade}/{assignment.points}
                </span>
              </div>
              {submission.feedback && (
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              )}
              <div className="text-xs text-slate-400 mt-2">
                Graded by: {submission.graded_by} on {submission.graded_at ? formatDate(submission.graded_at) : 'Unknown'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSubmission(!showSubmission)}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showSubmission ? 'Hide' : 'View'} Details
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
