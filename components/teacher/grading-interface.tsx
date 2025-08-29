"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { AssignmentProAPI, type Assignment, type Submission, type RubricCriterion } from "@/services/assignment-pro/api"
import { DocumentViewer } from "@/components/shared/document-viewer"
import { PresentationViewer } from "@/components/shared/presentation-viewer"
import { 
  Save, 
  Send, 
  Download,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  FileText,
  User,
  Calendar,
  Award,
  MessageSquare,
  CheckSquare,
  Square,
  MoreVertical,
  Trash2,
  Mail,
  Star,
  Clock,
  BarChart3,
  Presentation,
  RefreshCw
} from "lucide-react"

interface GradingInterfaceProps {
  assignment: Assignment
  onClose: () => void
}

export function GradingInterface({ assignment, onClose }: GradingInterfaceProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set())
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Grading state
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({})
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded" | "needs_review">("all")
  const [sortBy, setSortBy] = useState<"name" | "submitted_at" | "grade">("submitted_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // Bulk operations
  const [bulkGrade, setBulkGrade] = useState<number>(0)
  const [bulkFeedback, setBulkFeedback] = useState("")
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  
  // Document/presentation viewers
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [viewingPresentation, setViewingPresentation] = useState<any>(null)

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const submissionData = await AssignmentProAPI.listAssignmentSubmissions(assignment.id)
        console.log('Fetched submissions:', submissionData)
        setSubmissions(submissionData)
      } catch (error) {
        console.error("Failed to fetch submissions:", error)
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [assignment.id])

  // Filter and sort submissions
  const filteredSubmissions = submissions
    .filter(submission => {
      switch (statusFilter) {
        case "pending":
          return submission.status === "submitted" && !submission.grade
        case "graded":
          return submission.grade !== null
        case "needs_review":
          return submission.status === "submitted" && submission.grade === null
        default:
          return true
      }
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.student_email.localeCompare(b.student_email)
          break
        case "submitted_at":
          comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          break
        case "grade":
          comparison = (a.grade || 0) - (b.grade || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const handleGradeSubmission = async (submissionId: string) => {
    setSaving(true)
    try {
      const updatedSubmission = await AssignmentProAPI.gradeSubmission(submissionId, {
        grade,
        feedback,
        rubric_scores: rubricScores
      })
      setSubmissions(prev => prev.map(s => s.id === submissionId ? updatedSubmission : s))
      // Move to next ungraded submission
      const nextUngraded = filteredSubmissions.find(s => !s.grade && s.id !== submissionId)
      if (nextUngraded) {
        selectSubmission(nextUngraded)
      }
    } catch (error) {
      console.error("Failed to grade submission:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkGrading = async () => {
    setSaving(true)
    try {
      const updates = Array.from(selectedSubmissions).map(id => 
        AssignmentProAPI.gradeSubmission(id, {
          grade: bulkGrade,
          feedback: bulkFeedback,
          rubric_scores: {}
        })
      )
      const updatedSubmissions = await Promise.all(updates)
      
      setSubmissions(prev => prev.map(s => {
        const updated = updatedSubmissions.find(u => u.id === s.id)
        return updated || s
      }))
      
      setSelectedSubmissions(new Set())
      setShowBulkDialog(false)
      setBulkGrade(0)
      setBulkFeedback("")
    } catch (error) {
      console.error("Failed to bulk grade:", error)
    } finally {
      setSaving(false)
    }
  }

  const selectSubmission = (submission: Submission) => {
    setCurrentSubmission(submission)
    setGrade(submission.grade || 0)
    setFeedback(submission.feedback || "")
    setRubricScores(submission.rubric_scores || {})
  }

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelection = new Set(selectedSubmissions)
    if (newSelection.has(submissionId)) {
      newSelection.delete(submissionId)
    } else {
      newSelection.add(submissionId)
    }
    setSelectedSubmissions(newSelection)
  }

  const selectAllSubmissions = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set())
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)))
    }
  }

  const calculateRubricTotal = () => {
    if (!assignment.rubric || assignment.rubric.length === 0) return 0
    return assignment.rubric.reduce((total, criterion) => {
      return total + (rubricScores[criterion.id] || 0)
    }, 0)
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-300">Loading submissions...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Grading: {assignment.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{submissions.length} submissions</span>
              <span>{submissions.filter(s => !s.grade).length} pending</span>
              <span>{submissions.filter(s => s.grade).length} graded</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters and Controls */}
          <GlassCard className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Submissions</h3>
                {selectedSubmissions.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setShowBulkDialog(true)}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white"
                  >
                    Grade {selectedSubmissions.size}
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted_at">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="grade">Grade</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                  onCheckedChange={selectAllSubmissions}
                />
                <span className="text-slate-400">Select All</span>
              </div>
            </div>
          </GlassCard>

          {/* Submissions */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredSubmissions.map((submission) => (
              <GlassCard 
                key={submission.id}
                className={`p-4 cursor-pointer transition-colors ${
                  currentSubmission?.id === submission.id 
                    ? 'bg-blue-600/20 border-blue-500/50' 
                    : 'hover:bg-white/10'
                }`}
                onClick={() => selectSubmission(submission)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSubmissions.has(submission.id)}
                    onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-white text-sm font-medium truncate">
                        {submission.student_name || submission.student_email.split('@')[0]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {submission.grade !== null ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Award className="h-3 w-3 mr-1" />
                          {submission.grade}/{assignment.points}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                          Pending
                        </Badge>
                      )}
                      
                      {submission.attachments && submission.attachments.length > 0 && (
                        <Badge variant="outline" className="border-slate-500 text-slate-300">
                          {submission.attachments.length} files
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
            
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions found</p>
              </div>
            )}
          </div>
        </div>

        {/* Grading Panel */}
        <div className="lg:col-span-2 space-y-6">
          {currentSubmission ? (
            <>
              {/* Submission Header */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {(currentSubmission.student_name || currentSubmission.student_email.split('@')[0])}'s Submission
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Submitted on {new Date(currentSubmission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentSubmission.grade !== null ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Graded: {currentSubmission.grade}/{assignment.points}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                        Pending Grade
                      </Badge>
                    )}
                  </div>
                </div>
              </GlassCard>

              <Tabs defaultValue="content" className="space-y-6">
                <GlassCard className="p-1">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent">
                    <TabsTrigger 
                      value="content" 
                      className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger 
                      value="grading"
                      className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
                    >
                      Grading
                    </TabsTrigger>
                    <TabsTrigger 
                      value="rubric"
                      className="data-[state=active]:bg-blue-600/80 data-[state=active]:text-white text-slate-300"
                    >
                      Rubric
                    </TabsTrigger>
                  </TabsList>
                </GlassCard>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6">
                  {/* Submission Content */}
                  <GlassCard className="p-6">
                    <h4 className="text-lg font-medium text-white mb-4">Submission Content</h4>
                    
                    {/* Essay Content */}
                    {assignment.type === "essay" && currentSubmission.content.essay && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Essay Response</h5>
                        <div className="text-white whitespace-pre-wrap">
                          {currentSubmission.content.essay}
                        </div>
                      </div>
                    )}

                    {/* Project Content */}
                    {assignment.type === "project" && currentSubmission.content.project && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Project Description</h5>
                        <div className="text-white whitespace-pre-wrap">
                          {currentSubmission.content.project}
                        </div>
                      </div>
                    )}

                    {/* Discussion Content */}
                    {assignment.type === "discussion" && currentSubmission.content.discussion && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Discussion Response</h5>
                        <div className="text-white whitespace-pre-wrap">
                          {currentSubmission.content.discussion}
                        </div>
                      </div>
                    )}

                    {/* Presentation Content */}
                    {assignment.type === "presentation" && currentSubmission.content.presentation && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Presentation Notes</h5>
                        <div className="text-white whitespace-pre-wrap">
                          {currentSubmission.content.presentation}
                        </div>
                      </div>
                    )}

                    {/* Code Submission */}
                    {assignment.type === "code_submission" && currentSubmission.content.code_submission && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Code Submission</h5>
                        <div className="bg-slate-900 rounded-lg p-4">
                          <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                            {currentSubmission.content.code_submission}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* File Upload Content */}
                    {assignment.type === "file_upload" && currentSubmission.content.file_upload && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-2">Uploaded Files</h5>
                        <div className="text-white">
                          {Array.isArray(currentSubmission.content.file_upload) 
                            ? currentSubmission.content.file_upload.join(', ')
                            : currentSubmission.content.file_upload
                          }
                        </div>
                      </div>
                    )}

                    {/* No Content Message */}
                    {!currentSubmission.content.essay && 
                     !currentSubmission.content.project && 
                     !currentSubmission.content.discussion && 
                     !currentSubmission.content.presentation && 
                     !currentSubmission.content.code_submission && 
                     !currentSubmission.content.file_upload && 
                     (!currentSubmission.attachments || currentSubmission.attachments.length === 0) && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <div className="text-slate-400 text-center py-8">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No submission content available</p>
                          <p className="text-sm mt-2">The student may not have submitted any content for this assignment.</p>
                        </div>
                      </div>
                    )}
                    
                    {currentSubmission.attachments && currentSubmission.attachments.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-white font-medium">Attachments</h5>
                        <div className="space-y-2">
                          {currentSubmission.attachments.map((attachment) => {
                            const isDocument = attachment.type.includes('pdf') || 
                                             attachment.type.includes('text') || 
                                             attachment.name.toLowerCase().match(/\.(pdf|txt|md|doc|docx)$/)
                            const isPresentation = attachment.name.toLowerCase().match(/\.(ppt|pptx|key|odp)$/) ||
                                                  attachment.type.includes('presentation')
                            
                            return (
                              <div key={attachment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2">
                                  {isPresentation ? (
                                    <Presentation className="h-4 w-4 text-purple-400" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-blue-400" />
                                  )}
                                  <div>
                                    <p className="text-white font-medium">{attachment.name}</p>
                                    <p className="text-xs text-slate-400">{Math.round(attachment.size / 1024)} KB</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {(isDocument || isPresentation) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        if (isPresentation) {
                                          setViewingPresentation(attachment)
                                        } else {
                                          setViewingDocument(attachment)
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
                                      link.href = attachment.url
                                      link.download = attachment.name
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
                      </div>
                    )}
                  </GlassCard>
                </TabsContent>

                {/* Grading Tab */}
                <TabsContent value="grading" className="space-y-6">
                  <GlassCard className="p-6">
                    <h4 className="text-lg font-medium text-white mb-4">Grade & Feedback</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="grade" className="text-white">
                          Grade (out of {assignment.points})
                        </Label>
                        <Input
                          id="grade"
                          type="number"
                          min="0"
                          max={assignment.points}
                          value={grade}
                          onChange={(e) => setGrade(Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                        <div className="mt-1 text-sm text-slate-400">
                          Percentage: {assignment.points > 0 ? Math.round((grade / assignment.points) * 100) : 0}%
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="feedback" className="text-white">Feedback</Label>
                        <Textarea
                          id="feedback"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide feedback to the student..."
                          className="bg-white/5 border-white/10 text-white mt-1 min-h-[150px]"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGradeSubmission(currentSubmission.id)}
                          disabled={saving}
                          className="bg-green-600/80 hover:bg-green-600 text-white"
                        >
                          {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Grade
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Save & Email Student
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </TabsContent>

                {/* Rubric Tab */}
                <TabsContent value="rubric" className="space-y-6">
                  {assignment.rubric && assignment.rubric.length > 0 ? (
                    <GlassCard className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white">Rubric Assessment</h4>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            {calculateRubricTotal()}/{assignment.rubric.reduce((sum, c) => sum + c.max_points, 0)}
                          </div>
                          <div className="text-sm text-slate-400">Total Points</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {assignment.rubric.map((criterion) => (
                          <div key={criterion.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="text-white font-medium">{criterion.name}</h5>
                                {criterion.description && (
                                  <p className="text-slate-400 text-sm mt-1">{criterion.description}</p>
                                )}
                              </div>
                              <div className="ml-4">
                                <Input
                                  type="number"
                                  min="0"
                                  max={criterion.max_points}
                                  value={rubricScores[criterion.id] || 0}
                                  onChange={(e) => setRubricScores(prev => ({
                                    ...prev,
                                    [criterion.id]: Number(e.target.value)
                                  }))}
                                  className="bg-white/5 border-white/10 text-white w-20"
                                />
                                <div className="text-xs text-slate-400 text-center mt-1">
                                  /{criterion.max_points}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <Progress 
                                value={(rubricScores[criterion.id] || 0) / criterion.max_points * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => setGrade(calculateRubricTotal())}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 mt-4"
                      >
                        Apply Rubric Score to Grade
                      </Button>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-8">
                      <div className="text-center text-slate-400">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No rubric defined for this assignment</p>
                      </div>
                    </GlassCard>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <GlassCard className="p-8">
              <div className="text-center text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a submission to begin grading</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Bulk Grading Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Grade {selectedSubmissions.size} Submissions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-grade" className="text-white">
                Grade (out of {assignment.points})
              </Label>
              <Input
                id="bulk-grade"
                type="number"
                min="0"
                max={assignment.points}
                value={bulkGrade}
                onChange={(e) => setBulkGrade(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="bulk-feedback" className="text-white">Feedback</Label>
              <Textarea
                id="bulk-feedback"
                value={bulkFeedback}
                onChange={(e) => setBulkFeedback(e.target.value)}
                placeholder="Provide feedback for all selected submissions..."
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowBulkDialog(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkGrading}
                disabled={saving}
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4 mr-2" />
                )}
                Grade All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        title="Submission Document"
        subtitle={`${currentSubmission?.student_email} - ${assignment.title}`}
      />

      {/* Presentation Viewer */}
      <PresentationViewer
        presentation={viewingPresentation}
        isOpen={!!viewingPresentation}
        onClose={() => setViewingPresentation(null)}
        title="Submission Presentation"
        subtitle={`${currentSubmission?.student_email} - ${assignment.title}`}
      />
    </div>
  )
}