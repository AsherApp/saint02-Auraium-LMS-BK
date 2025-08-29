"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Award, 
  BarChart3, 
  Download, 
  Upload,
  Eye,
  MessageSquare,
  Star,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react"

interface Submission {
  id: string
  assignment_id: string
  student_email: string
  status: string
  payload: any
  grade: number | null
  feedback: string | null
  graded_by: string | null
  graded_at: string | null
  submitted_at: string
  updated_at: string
  students: {
    email: string
    name: string
    student_code: string
  }
}

interface GradingStats {
  total_submissions: number
  graded_submissions: number
  pending_grading: number
  average_grade: number
  grade_distribution: Record<string, number>
}

interface AssignmentGradingProps {
  assignmentId: string
  courseId: string
  assignmentTitle: string
}

export function AssignmentGrading({ assignmentId, courseId, assignmentTitle }: AssignmentGradingProps) {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<GradingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [bulkGradeDialogOpen, setBulkGradeDialogOpen] = useState(false)
  const [currentGrade, setCurrentGrade] = useState("")
  const [currentFeedback, setCurrentFeedback] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("submitted_at")

  // Fetch submissions and stats
  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch detailed submissions
      const submissionsResponse = await http<any>(`/api/assignments/${assignmentId}/submissions/detailed`)
      setSubmissions(submissionsResponse.items || [])
      
      // Fetch grading statistics
      const statsResponse = await http<any>(`/api/assignments/${assignmentId}/grading-stats`)
      setStats(statsResponse)
    } catch (error: any) {
      toast({ 
        title: "Error loading submissions", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async () => {
    if (!selectedSubmission) return
    
    try {
      await http(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        body: {
          submission_id: selectedSubmission.id,
          grade: parseInt(currentGrade),
          feedback: currentFeedback.trim() || null
        }
      })
      
      toast({ title: "Grade saved successfully" })
      setGradeDialogOpen(false)
      setSelectedSubmission(null)
      setCurrentGrade("")
      setCurrentFeedback("")
      fetchData() // Refresh data
    } catch (error: any) {
      toast({ 
        title: "Error saving grade", 
        description: error.message, 
        variant: "destructive" 
      })
    }
  }

  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setCurrentGrade(submission.grade?.toString() || "")
    setCurrentFeedback(submission.feedback || "")
    setGradeDialogOpen(true)
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500"
    if (grade >= 80) return "text-blue-500"
    if (grade >= 70) return "text-orange-500"
    if (grade >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getGradeLetter = (grade: number) => {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus === "all") return true
    if (filterStatus === "graded") return sub.grade !== null
    if (filterStatus === "ungraded") return sub.grade === null
    if (filterStatus === "submitted") return sub.status === "submitted"
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case "submitted_at":
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      case "grade":
        return (b.grade || 0) - (a.grade || 0)
      case "student_name":
        return (a.students.name || "").localeCompare(b.students.name || "")
      default:
        return 0
    }
  })

  const exportGrades = () => {
    const csvContent = [
      ['Student Name', 'Student Email', 'Student Code', 'Status', 'Grade', 'Letter Grade', 'Feedback', 'Submitted At', 'Graded At'],
      ...filteredSubmissions.map(sub => [
        sub.students.name || 'Unknown',
        sub.students.email,
        sub.students.student_code || 'N/A',
        sub.status,
        sub.grade || 'Not graded',
        sub.grade ? getGradeLetter(sub.grade) : 'N/A',
        sub.feedback || '',
        new Date(sub.submitted_at).toLocaleString(),
        sub.graded_at ? new Date(sub.graded_at).toLocaleString() : 'Not graded'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${assignmentTitle}-grades-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-slate-300">Loading submissions...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grading Statistics */}
      {stats && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grading Statistics
            </h3>
            <Button onClick={exportGrades} className="bg-blue-600/80 hover:bg-blue-600 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Grades
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total_submissions}</div>
              <div className="text-sm text-slate-400">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.graded_submissions}</div>
              <div className="text-sm text-slate-400">Graded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.pending_grading}</div>
              <div className="text-sm text-slate-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.average_grade}%</div>
              <div className="text-sm text-slate-400">Average Grade</div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Grade Distribution</h4>
            {Object.entries(stats.grade_distribution).map(([range, count]) => (
              <div key={range} className="flex items-center gap-3">
                <div className="w-20 text-sm text-slate-300">{range}</div>
                <div className="flex-1">
                  <Progress value={(count / stats.total_submissions) * 100} className="h-2" />
                </div>
                <div className="w-8 text-sm text-slate-400">{count}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Submissions Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Student Submissions ({filteredSubmissions.length})
          </h3>
          
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20 text-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="ungraded">Ungraded</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20 text-white">
                <SelectItem value="submitted_at">Submitted Date</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
                <SelectItem value="student_name">Student Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300 border-b border-white/10">
                <th className="py-3 pr-4 font-medium">Student</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Submitted</th>
                <th className="py-3 pr-4 font-medium">Grade</th>
                <th className="py-3 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4">
                    <div>
                      <div className="text-white font-medium">{submission.students.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{submission.students.email}</div>
                      {submission.students.student_code && (
                        <div className="text-xs text-blue-400">{submission.students.student_code}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {submission.status === "submitted" ? (
                      <Badge className="bg-green-600/30 text-green-100 border-white/10">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    ) : submission.status === "draft" ? (
                      <Badge className="bg-orange-600/30 text-orange-100 border-white/10">
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </Badge>
                    ) : (
                      <Badge className="bg-red-600/30 text-red-100 border-white/10">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                    <div className="text-xs text-slate-400">
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {submission.grade !== null ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getGradeColor(submission.grade)}`}>
                          {submission.grade}%
                        </span>
                        <Badge variant="outline" className="text-xs border-white/10">
                          {getGradeLetter(submission.grade)}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not graded</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openGradeDialog(submission)}
                        className="bg-white/10 text-white hover:bg-white/20"
                      >
                        {submission.grade !== null ? (
                          <>
                            <Award className="h-3 w-3 mr-1" />
                            Regrade
                          </>
                        ) : (
                          <>
                            <Star className="h-3 w-3 mr-1" />
                            Grade
                          </>
                        )}
                      </Button>
                      
                      {submission.feedback && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/10 text-white hover:bg-white/20"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Grade Submission</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Student</div>
                    <div className="text-white font-medium">{selectedSubmission.students.name || 'Unknown'}</div>
                    <div className="text-sm text-slate-300">{selectedSubmission.students.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Submitted</div>
                    <div className="text-white">{new Date(selectedSubmission.submitted_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white">Submission Content</h4>
                <div className="rounded-md border border-white/10 bg-white/5 p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap">
                    {JSON.stringify(selectedSubmission.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Grading Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="0-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Letter Grade</Label>
                    <div className="h-10 flex items-center px-3 bg-white/5 border border-white/10 rounded-md text-white">
                      {currentGrade ? getGradeLetter(parseInt(currentGrade)) : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea
                    value={currentFeedback}
                    onChange={(e) => setCurrentFeedback(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-32"
                    placeholder="Provide detailed feedback for the student..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="secondary"
                  onClick={() => setGradeDialogOpen(false)}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGrade}
                  disabled={!currentGrade.trim()}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Save Grade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
