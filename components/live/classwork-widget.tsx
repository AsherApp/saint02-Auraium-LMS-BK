"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Eye,
  Upload,
  Download
} from "lucide-react"

export function ClassworkWidget({ sessionId, isHost = false }: { sessionId: string; isHost?: boolean }) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [classwork, setClasswork] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState<string | null>(null)
  const [selectedClasswork, setSelectedClasswork] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])

  const [newClasswork, setNewClasswork] = useState({
    title: "",
    description: "",
    type: "assignment",
    content: "",
    due_at: ""
  })

  const [submission, setSubmission] = useState({
    content: "",
    attachments: []
  })

  // Fetch classwork
  useEffect(() => {
    const fetchClasswork = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/classwork`)
        setClasswork(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to load classwork")
        setClasswork([])
      } finally {
        setLoading(false)
      }
    }

    fetchClasswork()
  }, [sessionId])

  async function createClasswork() {
    if (!newClasswork.title.trim()) return
    
    try {
      await http(`/api/live/${sessionId}/classwork`, {
        method: 'POST',
        body: newClasswork
      })
      
      // Refresh classwork
      const response = await http<any>(`/api/live/${sessionId}/classwork`)
      setClasswork(response.items || [])
      
      setNewClasswork({ title: "", description: "", type: "assignment", content: "", due_at: "" })
      setCreateOpen(false)
      toast({ title: "Classwork created successfully" })
    } catch (err: any) {
      toast({ title: "Failed to create classwork", description: err.message, variant: "destructive" })
    }
  }

  async function submitClasswork(classworkId: string) {
    if (!submission.content.trim()) return
    
    try {
      await http(`/api/live/${sessionId}/classwork/${classworkId}/submit`, {
        method: 'POST',
        body: submission
      })
      
      setSubmission({ content: "", attachments: [] })
      setSubmitOpen(null)
      toast({ title: "Classwork submitted successfully" })
    } catch (err: any) {
      toast({ title: "Failed to submit classwork", description: err.message, variant: "destructive" })
    }
  }

  async function loadSubmissions(classworkId: string) {
    try {
      const response = await http<any>(`/api/live/${sessionId}/classwork/${classworkId}/submissions`)
      setSubmissions(response.items || [])
    } catch (err: any) {
      console.error('Failed to load submissions:', err)
      setSubmissions([])
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assignment": return <FileText className="h-4 w-4" />
      case "quiz": return <BookOpen className="h-4 w-4" />
      case "discussion": return <Edit className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assignment": return "bg-blue-500/20 text-blue-400"
      case "quiz": return "bg-purple-500/20 text-purple-400"
      case "discussion": return "bg-green-500/20 text-green-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="font-roboto">
      <div className="text-xs text-slate-300 mb-2 font-roboto">Live Classwork</div>
      {isHost && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" aria-label="Create classwork" className="bg-blue-600/80 hover:bg-blue-600 text-white mb-3 w-full focus:ring-2 focus:ring-blue-400">
              <Plus className="mr-2 h-4 w-4" />
              Create Classwork
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-exo">Create Live Classwork</DialogTitle>
              <DialogDescription className="font-roboto">Create engaging assignments, quizzes, or discussions for your students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Title *
                  </label>
                  <Input
                    value={newClasswork.title}
                    onChange={(e) => setNewClasswork(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g., Chapter 5 Quiz, Essay Assignment"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Type *
                  </label>
                  <Select value={newClasswork.type} onValueChange={(value) => setNewClasswork(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/10 border-white/20 text-white">
                      <SelectItem value="assignment">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Assignment
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Quiz
                        </div>
                      </SelectItem>
                      <SelectItem value="discussion">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Discussion
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newClasswork.description}
                  onChange={(e) => setNewClasswork(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white min-h-20 focus:ring-2 focus:ring-blue-400"
                  placeholder="Provide a brief description of what students need to do..."
                />
              </div>
              {/* Content based on type */}
              {newClasswork.type === 'quiz' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400">Quiz Setup</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm">Question</label>
                      <Input
                        value={newClasswork.content}
                        onChange={(e) => setNewClasswork(prev => ({ ...prev, content: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter your quiz question..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Options (one per line)</label>
                      <Textarea
                        className="bg-white/5 border-white/10 text-white min-h-20 focus:ring-2 focus:ring-blue-400"
                        placeholder="Option A\nOption B\nOption C\nOption D"
                      />
                    </div>
                  </div>
                </div>
              )}
              {newClasswork.type === 'assignment' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium text-green-400">Assignment Instructions</h4>
                  <Textarea
                    value={newClasswork.content}
                    onChange={(e) => setNewClasswork(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-32 focus:ring-2 focus:ring-blue-400"
                    placeholder="Provide detailed instructions for the assignment...\n\nExample:\n• Write a 500-word essay on...\n• Include at least 3 sources\n• Submit in PDF format"
                  />
                </div>
              )}
              {newClasswork.type === 'discussion' && (
                <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-400">Discussion Topic</h4>
                  <Textarea
                    value={newClasswork.content}
                    onChange={(e) => setNewClasswork(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white min-h-32 focus:ring-2 focus:ring-blue-400"
                    placeholder="Present the discussion topic and any specific points students should address...\n\nExample:\nDiscuss the impact of technology on education. Consider both positive and negative aspects."
                  />
                </div>
              )}
              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Due Date (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={newClasswork.due_at}
                  onChange={(e) => setNewClasswork(prev => ({ ...prev, due_at: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-slate-400">Leave empty for no due date</p>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <Button 
                  variant="secondary" 
                  aria-label="Cancel classwork creation"
                  onClick={() => setCreateOpen(false)} 
                  className="bg-white/10 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-400"
                >
                  Cancel
                </Button>
                <Button 
                  aria-label="Create classwork"
                  onClick={createClasswork} 
                  disabled={!newClasswork.title.trim()}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-400"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Classwork
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-slate-400 text-sm font-roboto">Loading classwork...</div>
        ) : error ? (
          <div className="text-red-300 text-sm font-roboto">Error loading classwork</div>
        ) : classwork.length === 0 ? (
          <div className="text-slate-400 text-sm font-roboto">No classwork yet.</div>
        ) : (
          classwork.map((cw) => (
            <div key={cw.id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(cw.type)}
                  <span className="text-slate-100 text-sm font-medium font-exo">{cw.title}</span>
                  <Badge variant="secondary" className={`${getTypeColor(cw.type)} border-white/10 text-xs font-roboto`}>
                    {cw.type}
                  </Badge>
                </div>
                {cw.due_at && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(cw.due_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {cw.description && (
                <p className="text-slate-300 text-xs mb-2">{cw.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHost ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedClasswork(cw)
                        loadSubmissions(cw.id)
                      }}
                      className="bg-white/10 text-white hover:bg-white/20"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Submissions
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedClasswork(cw)
                        setSubmitOpen(cw.id)
                      }}
                      className="bg-white/10 text-white hover:bg-white/20"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Classwork Dialog */}
      <Dialog open={!!submitOpen} onOpenChange={(open) => !open && setSubmitOpen(null)}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Classwork</DialogTitle>
            <DialogDescription>Submit your work for: {selectedClasswork?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Submission</label>
              <Textarea
                value={submission.content}
                onChange={(e) => setSubmission(prev => ({ ...prev, content: e.target.value }))}
                className="bg-white/5 border-white/10 text-white min-h-32"
                placeholder="Enter your submission content..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setSubmitOpen(null)} className="bg-white/10 text-white hover:bg-white/20">
                Cancel
              </Button>
              <Button 
                onClick={() => submitClasswork(selectedClasswork?.id)} 
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
                disabled={!submission.content.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={!!selectedClasswork && isHost} onOpenChange={(open) => !open && setSelectedClasswork(null)}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Submissions for: {selectedClasswork?.title}</DialogTitle>
            <DialogDescription>Review and grade student submissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="text-slate-400 text-sm">No submissions yet.</div>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-200 text-sm font-medium">{sub.student_email}</span>
                    <span className="text-slate-400 text-xs">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="bg-white/5 p-2 rounded text-sm text-slate-300 mb-2">
                    {sub.content}
                  </div>
                  
                  {sub.grade !== null ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Grade:</span>
                      <span className="text-green-400">{sub.grade}</span>
                      {sub.feedback && (
                        <span className="text-slate-300">- {sub.feedback}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Not graded yet</div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
