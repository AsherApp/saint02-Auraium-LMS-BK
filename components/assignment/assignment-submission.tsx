"use client"

import { useState, useEffect, useRef } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { AssignmentAPI, type Assignment, type Submission } from "@/services/assignments/api"
import { 
  FileText, 
  Upload, 
  Code, 
  MessageSquare, 
  Presentation, 
  Users, 
  BookOpen,
  Save, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Download,
  Trash2,
  Plus,
  File,
  Image,
  Video,
  Music,
  Archive,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flag,
  Share2,
  Copy,
  Edit,
  Settings,
  HelpCircle,
  Info,
  ExternalLink,
  Github,
  Link,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react"

interface AssignmentSubmissionProps {
  assignment: MockAssignment
  submission?: MockSubmission | null
  onSave?: (data: any) => void
  onSubmit?: (data: any) => void
  onCancel?: () => void
  readOnly?: boolean
}

export function AssignmentSubmission({ 
  assignment, 
  submission, 
  onSave, 
  onSubmit, 
  onCancel, 
  readOnly = false 
}: AssignmentSubmissionProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("submission")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Content state based on assignment type
  const [content, setContent] = useState<any>({})
  
  // File upload state
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  
  // Discussion state
  const [discussionPost, setDiscussionPost] = useState("")
  const [replies, setReplies] = useState<any[]>([])
  
  // Presentation state
  const [presentationUrl, setPresentationUrl] = useState("")
  const [presentationFiles, setPresentationFiles] = useState<File[]>([])
  
  // Code submission state
  const [codeContent, setCodeContent] = useState("")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [demoUrl, setDemoUrl] = useState("")
  
  // Peer review state
  const [reviewTarget, setReviewTarget] = useState("")
  const [reviewCriteria, setReviewCriteria] = useState<Record<string, number>>({})
  const [reviewFeedback, setReviewFeedback] = useState("")

  useEffect(() => {
    if (submission?.content) {
      setContent(submission.content)
      // Initialize specific content based on assignment type
      switch (assignment.type) {
        case 'essay':
          setContent(submission.content.essay || "")
          break
        case 'quiz':
          setQuizAnswers(submission.content.quiz || {})
          break
        case 'discussion':
          setDiscussionPost(submission.content.discussion_post || "")
          setReplies(submission.content.replies || [])
          break
        case 'presentation':
          setPresentationUrl(submission.content.presentation_url || "")
          break
        case 'code_submission':
          setCodeContent(submission.content.code || "")
          setRepositoryUrl(submission.content.repository_url || "")
          setDemoUrl(submission.content.demo_url || "")
          break
        case 'peer_review':
          setReviewTarget(submission.content.reviewed_student || "")
          setReviewCriteria(submission.content.review_criteria || {})
          setReviewFeedback(submission.content.detailed_feedback || "")
          break
      }
    }
  }, [submission, assignment.type])

  const handleSave = async () => {
    if (readOnly) return
    
    setSaving(true)
    try {
      const submissionData = {
        assignment_id: assignment.id,
        content: getSubmissionContent(),
        status: 'draft'
      }
      
      if (onSave) {
        onSave(submissionData)
      } else {
        await AssignmentAPI.createSubmission(assignment.id, {
          content: submissionData.content,
          status: 'draft'
        })
      }
      
      setLastSaved(new Date())
      toast({
        title: "Draft saved",
        description: "Your work has been saved as a draft.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your work. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (readOnly) return
    
    setSubmitting(true)
    try {
      const submissionData = {
        assignment_id: assignment.id,
        content: getSubmissionContent(),
        status: 'submitted'
      }
      
      if (onSubmit) {
        onSubmit(submissionData)
      } else {
        await AssignmentAPI.createSubmission(assignment.id, {
          content: submissionData.content,
          status: 'submitted'
        })
      }
      
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      })
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit your assignment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionContent = () => {
    switch (assignment.type) {
      case 'essay':
        return { essay: content }
      case 'file_upload':
        return { files: content.files || [] }
      case 'quiz':
        return { quiz: quizAnswers }
      case 'project':
        return { 
          description: content.description || "",
          files: content.files || []
        }
      case 'discussion':
        return { 
          discussion_post: discussionPost,
          replies: replies
        }
      case 'presentation':
        return { 
          presentation_url: presentationUrl,
          files: presentationFiles
        }
      case 'code_submission':
        return { 
          code: codeContent,
          repository_url: repositoryUrl,
          demo_url: demoUrl
        }
      case 'peer_review':
        return { 
          reviewed_student: reviewTarget,
          review_criteria: reviewCriteria,
          detailed_feedback: reviewFeedback
        }
      default:
        return content
    }
  }

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'essay': return <FileText className="h-5 w-5 text-blue-400" />
      case 'file_upload': return <Upload className="h-5 w-5 text-green-400" />
      case 'quiz': return <FileText className="h-5 w-5 text-purple-400" />
      case 'project': return <BookOpen className="h-5 w-5 text-orange-400" />
      case 'discussion': return <MessageSquare className="h-5 w-5 text-cyan-400" />
      case 'presentation': return <Presentation className="h-5 w-5 text-pink-400" />
      case 'code_submission': return <Code className="h-5 w-5 text-emerald-400" />
      case 'peer_review': return <Users className="h-5 w-5 text-indigo-400" />
      default: return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const renderSubmissionInterface = () => {
    switch (assignment.type) {
      case 'essay':
        return <EssaySubmission content={content} setContent={setContent} readOnly={readOnly} />
      case 'file_upload':
        return <FileUploadSubmission content={content} setContent={setContent} readOnly={readOnly} />
      case 'quiz':
        return <QuizSubmission answers={quizAnswers} setAnswers={setQuizAnswers} readOnly={readOnly} />
      case 'project':
        return <ProjectSubmission content={content} setContent={setContent} readOnly={readOnly} />
      case 'discussion':
        return <DiscussionSubmission 
          post={discussionPost} 
          setPost={setDiscussionPost}
          replies={replies}
          setReplies={setReplies}
          readOnly={readOnly} 
        />
      case 'presentation':
        return <PresentationSubmission 
          url={presentationUrl}
          setUrl={setPresentationUrl}
          files={presentationFiles}
          setFiles={setPresentationFiles}
          readOnly={readOnly} 
        />
      case 'code_submission':
        return <CodeSubmission 
          code={codeContent}
          setCode={setCodeContent}
          repositoryUrl={repositoryUrl}
          setRepositoryUrl={setRepositoryUrl}
          demoUrl={demoUrl}
          setDemoUrl={setDemoUrl}
          readOnly={readOnly} 
        />
      case 'peer_review':
        return <PeerReviewSubmission 
          target={reviewTarget}
          setTarget={setReviewTarget}
          criteria={reviewCriteria}
          setCriteria={setReviewCriteria}
          feedback={reviewFeedback}
          setFeedback={setReviewFeedback}
          readOnly={readOnly} 
        />
      default:
        return <div className="text-center text-slate-400">Unknown assignment type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/10 rounded-lg">
                {getAssignmentIcon(assignment.type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
                <p className="text-slate-400 capitalize">{assignment.type.replace('_', ' ')}</p>
              </div>
            </div>
            
            {assignment.description && (
              <p className="text-slate-300 mb-4">{assignment.description}</p>
            )}
            
            {assignment.instructions && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-4">
                <h3 className="text-blue-400 font-medium mb-2">Instructions</h3>
                <p className="text-blue-200 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due {new Date(assignment.due_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>{assignment.points} points</span>
              </div>
              {submission?.status && (
                <Badge className={
                  submission.status === 'graded' ? 'bg-green-500/20 text-green-400' :
                  submission.status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }>
                  {submission.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Submission Interface */}
      <GlassCard className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-transparent">
            <TabsTrigger 
              value="submission" 
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              {readOnly ? 'View Submission' : 'Submit Work'}
            </TabsTrigger>
            <TabsTrigger 
              value="viewer" 
              className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submission" className="space-y-6 mt-6">
            {renderSubmissionInterface()}
          </TabsContent>

          <TabsContent value="viewer" className="space-y-6 mt-6">
            <AssignmentViewer 
              assignment={assignment} 
              submission={submission} 
              content={getSubmissionContent()}
            />
          </TabsContent>
        </Tabs>
      </GlassCard>

      {/* Action Buttons */}
      {!readOnly && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
            
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={saving}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                {submitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// Individual submission components will be imported from separate files
import { EssaySubmission } from "./submissions/essay-submission"
import { FileUploadSubmission } from "./submissions/file-upload-submission"
import { QuizSubmission } from "./submissions/quiz-submission"
import { ProjectSubmission } from "./submissions/project-submission"
import { DiscussionSubmission } from "./submissions/discussion-submission"
import { PresentationSubmission } from "./submissions/presentation-submission"
import { CodeSubmission } from "./submissions/code-submission"
import { PeerReviewSubmission } from "./submissions/peer-review-submission"
import { AssignmentViewer } from "./assignment-viewer"
