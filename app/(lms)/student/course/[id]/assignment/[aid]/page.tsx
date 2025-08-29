"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { AssignmentProAPI, type Assignment, type Submission } from "@/services/assignment-pro/api"
import { ArrowLeft, FileText, Upload, Save, Send, Clock, AlertTriangle, CheckCircle } from "lucide-react"

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
    file_upload?: string[]
    quiz?: any[]
    project?: string
    discussion?: string
    presentation?: string
    code_submission?: string
  }>({})

  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId || !user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch assignment details
        const assignmentData = await AssignmentProAPI.getAssignment(assignmentId)
        setAssignment(assignmentData)
        
        // Try to fetch existing submission
        try {
          const submissions = await AssignmentProAPI.getStudentSubmissions(assignmentId)
          if (submissions.length > 0) {
            const latestSubmission = submissions[0] // Most recent submission
            setSubmission(latestSubmission)
            if (latestSubmission?.content) {
              setContent(latestSubmission.content)
            }
          }
        } catch (err) {
          // No existing submission, that's fine
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
  }, [assignmentId, user?.email])

  const handleSave = async () => {
    if (!assignment || !user?.email) return
    
    setSaving(true)
    try {
      const submissionData = {
        content,
        status: 'draft' as const,
        timeSpentMinutes: 0
      }
      
      if (submission) {
        // Update existing submission
        const updatedSubmission = await AssignmentProAPI.updateSubmission(submission.id, submissionData)
        setSubmission(updatedSubmission)
      } else {
        // Create new submission
        const newSubmission = await AssignmentProAPI.createSubmission(assignmentId, submissionData)
        setSubmission(newSubmission)
      }
    } catch (err: any) {
      console.error('Failed to save submission:', err)
      setError('Failed to save your work. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignment || !user?.email) return
    
    setSubmitting(true)
    try {
      const submissionData = {
        content,
        status: 'submitted' as const,
        timeSpentMinutes: 0
      }
      
      if (submission) {
        // Update existing submission
        const updatedSubmission = await AssignmentProAPI.updateSubmission(submission.id, submissionData)
        setSubmission(updatedSubmission)
      } else {
        // Create new submission
        const newSubmission = await AssignmentProAPI.createSubmission(assignmentId, submissionData)
        setSubmission(newSubmission)
      }
      
      // Redirect to assignment detail page
      router.push(`/student/assignment/${assignmentId}`)
    } catch (err: any) {
      console.error('Failed to submit assignment:', err)
      setError('Failed to submit your assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderContentEditor = () => {
    if (!assignment) return null

    switch (assignment.type) {
      case 'essay':
        return (
          <div className="space-y-4">
            <Label htmlFor="essay" className="text-white">Your Essay</Label>
            <Textarea
              id="essay"
              value={content.essay || ''}
              onChange={(e) => setContent({ ...content, essay: e.target.value })}
              placeholder="Write your essay here..."
              className="min-h-[400px] bg-white/5 border-white/10 text-white placeholder-slate-400"
            />
          </div>
        )
      
      case 'file_upload':
        return (
          <div className="space-y-4">
            <Label className="text-white">Upload Files</Label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 mb-2">Drag and drop files here or click to browse</p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setContent({ ...content, file_upload: files.map(f => f.name) })
                }}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose Files
              </Button>
            </div>
            {content.file_upload && content.file_upload.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white">Selected Files:</Label>
                <div className="space-y-1">
                  {content.file_upload.map((fileName, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-slate-300 text-sm">{fileName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newFiles = content.file_upload?.filter((_, i) => i !== index) || []
                          setContent({ ...content, file_upload: newFiles })
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      
      case 'project':
        return (
          <div className="space-y-4">
            <Label htmlFor="project" className="text-white">Project Description</Label>
            <Textarea
              id="project"
              value={content.project || ''}
              onChange={(e) => setContent({ ...content, project: e.target.value })}
              placeholder="Describe your project..."
              className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder-slate-400"
            />
          </div>
        )
      
      case 'discussion':
        return (
          <div className="space-y-4">
            <Label htmlFor="discussion" className="text-white">Your Response</Label>
            <Textarea
              id="discussion"
              value={content.discussion || ''}
              onChange={(e) => setContent({ ...content, discussion: e.target.value })}
              placeholder="Share your thoughts on the discussion topic..."
              className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder-slate-400"
            />
          </div>
        )
      
      case 'presentation':
        return (
          <div className="space-y-4">
            <Label htmlFor="presentation" className="text-white">Presentation Notes</Label>
            <Textarea
              id="presentation"
              value={content.presentation || ''}
              onChange={(e) => setContent({ ...content, presentation: e.target.value })}
              placeholder="Add your presentation notes or description..."
              className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder-slate-400"
            />
          </div>
        )
      
      case 'code_submission':
        return (
          <div className="space-y-4">
            <Label htmlFor="code" className="text-white">Your Code</Label>
            <Textarea
              id="code"
              value={content.code_submission || ''}
              onChange={(e) => setContent({ ...content, code_submission: e.target.value })}
              placeholder="Write your code here..."
              className="min-h-[400px] bg-white/5 border-white/10 text-white placeholder-slate-400 font-mono"
            />
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8">
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

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignment
        </Button>
        <div className="flex items-center gap-2">
          {submission?.status === 'submitted' && (
            <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Submitted
            </Badge>
          )}
          {submission?.status === 'graded' && (
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
              <CheckCircle className="h-3 w-3 mr-1" />
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
                <FileText className="h-5 w-5 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
              </div>
              {assignment.description && (
                <p className="text-slate-300">{assignment.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{assignment.points} points</span>
                {assignment.due_at && (
                  <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                )}
                <span className="capitalize">{assignment.type.replace('_', ' ')}</span>
              </div>
            </div>
          </GlassCard>

          {/* Instructions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
            <div className="text-slate-300 whitespace-pre-wrap bg-white/5 p-4 rounded-lg">
              {assignment.instructions}
            </div>
          </GlassCard>

          {/* Content Editor */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Work</h3>
            {renderContentEditor()}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress & Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                variant="outline" 
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || submission?.status === 'submitted'}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : submission?.status === 'submitted' ? 'Already Submitted' : 'Submit Assignment'}
              </Button>
            </div>
          </GlassCard>

          {/* Assignment Settings */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
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
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
