"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { useLiveSessionsFn } from "@/services/live/hook"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { dateUtils } from "@/utils/date-utils"
import { 
  ArrowLeft, 
  Play, 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  Settings,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Plus,
  FileText,
  Presentation,
  FolderOpen,
  Download,
  Eye,
  Search,
  Check,
  X,
  Upload,
  BookOpen,
  Activity,
  History,
  PlayCircle,
  FileImage,
  FileVideo,
  File,
  TrendingUp,
  Clock3,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react"

// Attendance Analysis Component
const AttendanceAnalysis = ({ sessionId }: { sessionId: string }) => {
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)
        
        // Fetch attendance report
        const reportResponse = await http.get(`/api/live-attendance/session/${sessionId}`)
        setAttendanceData(reportResponse.data)
        
        // Fetch individual attendance records
        const recordsResponse = await http.get(`/api/live-attendance/session/${sessionId}/records`)
        setAttendanceRecords(recordsResponse.data?.items || [])
        
      } catch (error) {
        console.error('Failed to fetch attendance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!attendanceData) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
          <h3 className="text-white font-semibold mb-2">No Attendance Data</h3>
          <p className="text-slate-400">Attendance data will be available after the session ends.</p>
        </div>
      </GlassCard>
    )
  }

  const attendancePercentage = attendanceData.total_enrolled_students > 0 
    ? Math.round((attendanceData.present_count / attendanceData.total_enrolled_students) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-full flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{attendanceData.present_count}</div>
              <div className="text-xs text-slate-400">Present</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center">
              <Clock3 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{attendanceData.late_count}</div>
              <div className="text-xs text-slate-400">Late</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
              <UserX className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{attendanceData.absent_count}</div>
              <div className="text-xs text-slate-400">Absent</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{attendancePercentage}%</div>
              <div className="text-xs text-slate-400">Attendance Rate</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Session Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Enrolled</span>
              <span className="text-white font-medium">{attendanceData.total_enrolled_students}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Session Duration</span>
              <span className="text-white font-medium">{attendanceData.session_duration_minutes} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Participation Score</span>
              <span className="text-white font-medium">{attendanceData.average_participation_score?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Engagement Score</span>
              <span className="text-white font-medium">{attendanceData.average_engagement_score?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Attendance Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-slate-400 flex-1">Present</span>
              <span className="text-white font-medium">{attendanceData.present_count}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-slate-400 flex-1">Late</span>
              <span className="text-white font-medium">{attendanceData.late_count}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-slate-400 flex-1">Absent</span>
              <span className="text-white font-medium">{attendanceData.absent_count}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-slate-400 flex-1">Excused</span>
              <span className="text-white font-medium">{attendanceData.excused_count || 0}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Individual Records */}
      <GlassCard className="p-6">
        <h3 className="text-white font-semibold mb-4">Individual Attendance Records</h3>
        {attendanceRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No individual attendance records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendanceRecords.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-medium">
                      {record.student_name ? record.student_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{record.student_name || record.student_email?.split('@')[0] || 'Student'}</p>
                    <p className="text-slate-400 text-xs">{record.student_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      record.status === 'present' ? 'border-green-500/30 text-green-400' :
                      record.status === 'late' ? 'border-orange-500/30 text-orange-400' :
                      record.status === 'absent' ? 'border-red-500/30 text-red-400' :
                      'border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {record.status}
                  </Badge>
                  {record.attendance_percentage && (
                    <span className="text-slate-400 text-xs">
                      {record.attendance_percentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

export default function TeacherLiveClassDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [session, setSession] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [recordingsOpen, setRecordingsOpen] = useState(false)
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration: 60
  })
  
  // New state for enhanced features
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [sessionNotes, setSessionNotes] = useState<any[]>([])
  const [sessionResources, setSessionResources] = useState<any[]>([])
  const [sessionRecordings, setSessionRecordings] = useState<any[]>([])
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [newResource, setNewResource] = useState({ title: "", description: "", url: "", type: "link" })
  const [activeTab, setActiveTab] = useState("overview")

  const sessionId = params.id as string

  // Fetch session details
  useEffect(() => {
    if (!sessionId || !user?.email) return
    
    setLoading(true)
    setError(null)
    
    const fetchSessionDetails = async () => {
      try {
        const response = await http<any>(`/api/live/${sessionId}`)
        setSession(response)
        setEditData({
          title: response.title || "",
          description: response.description || "",
          scheduled_at: response.scheduled_at ? new Date(response.scheduled_at).toISOString().slice(0, 16) : "",
          duration: response.duration || 60
        })
      } catch (err: any) {
        setError(err.message || "Failed to fetch session details")
      } finally {
        setLoading(false)
      }
    }

    const fetchParticipants = async () => {
      try {
        const response = await http<any>(`/api/live/${sessionId}/participants`)
        setParticipants(response.items || [])
      } catch (err) {
        console.error("Failed to fetch participants:", err)
        setParticipants([])
      }
    }

    const fetchAvailableStudents = async () => {
      try {
        const response = await http<any>(`/api/students/me`)
        setAvailableStudents(response.items || [])
      } catch (err) {
        console.error("Failed to fetch students:", err)
        setAvailableStudents([])
      }
    }

    const fetchSessionData = async () => {
      try {
        // Fetch session notes
        const notesResponse = await http<any>(`/api/live/${sessionId}/notes`)
        setSessionNotes(notesResponse.items || [])
        
        // Fetch session resources
        const resourcesResponse = await http<any>(`/api/live/${sessionId}/resources`)
        setSessionResources(resourcesResponse.items || [])
        
        // Fetch session recordings
        const recordingsResponse = await http<any>(`/api/recordings/session/${sessionId}`)
        setSessionRecordings(recordingsResponse.items || [])
      } catch (err) {
        console.error("Failed to fetch session data:", err)
      }
    }

    fetchSessionDetails()
    fetchParticipants()
    fetchAvailableStudents()
    fetchSessionData()
  }, [sessionId, user?.email])

  const handleStartSession = async () => {
    try {
      await http(`/api/live/${sessionId}/start`, { method: 'POST' })
      toast({ title: "Session started!" })
      // Navigate to live room
      router.push(`/live/${sessionId}`)
    } catch (err: any) {
      toast({ title: "Failed to start session", description: err.message, variant: "destructive" })
    }
  }

  const handleEndSession = async () => {
    try {
      await http(`/api/live/${sessionId}/end`, { method: 'POST' })
      toast({ title: "Session ended" })
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to end session", description: err.message, variant: "destructive" })
    }
  }

  const handleUpdateSession = async () => {
    try {
      await http(`/api/live/${sessionId}`, {
        method: 'PUT',
        body: editData
      })
      toast({ title: "Session updated successfully" })
      setEditOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to update session", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteSession = async () => {
    if (!confirm("Are you sure you want to delete this session?")) return
    
    try {
      await http(`/api/live/${sessionId}`, { method: 'DELETE' })
      toast({ title: "Session deleted" })
      router.push('/teacher/live-class')
    } catch (err: any) {
      toast({ title: "Failed to delete session", description: err.message, variant: "destructive" })
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/live/${sessionId}`
    navigator.clipboard.writeText(link)
    toast({ title: "Invite link copied to clipboard" })
  }

  // New handler functions for enhanced features
  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Please select students to add", variant: "destructive" })
      return
    }

    try {
      await http(`/api/live/${sessionId}/participants`, {
        method: 'POST',
        body: { student_ids: selectedStudents }
      })
      toast({ title: "Students added successfully" })
      setAddStudentOpen(false)
      setSelectedStudents([])
      // Refresh participants
      const response = await http<any>(`/api/live/${sessionId}/participants`)
      setParticipants(response.items || [])
    } catch (err: any) {
      toast({ title: "Failed to add students", description: err.message, variant: "destructive" })
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.content) {
      toast({ title: "Please fill in all fields", variant: "destructive" })
      return
    }

    try {
      await http(`/api/live/${sessionId}/notes`, {
        method: 'POST',
        body: newNote
      })
      toast({ title: "Note created successfully" })
      setNewNote({ title: "", content: "" })
      setNotesOpen(false)
      // Refresh notes
      const response = await http<any>(`/api/live/${sessionId}/notes`)
      setSessionNotes(response.items || [])
    } catch (err: any) {
      toast({ title: "Failed to create note", description: err.message, variant: "destructive" })
    }
  }

  const handleAddResource = async () => {
    if (!newResource.title || !newResource.url) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await http(`/api/live/${sessionId}/resources`, {
        method: 'POST',
        body: newResource
      })
      toast({ title: "Resource added successfully" })
      setNewResource({ title: "", description: "", url: "", type: "link" })
      setResourcesOpen(false)
      // Refresh resources
      const response = await http<any>(`/api/live/${sessionId}/resources`)
      setSessionResources(response.items || [])
    } catch (err: any) {
      toast({ title: "Failed to add resource", description: err.message, variant: "destructive" })
    }
  }

  const filteredStudents = availableStudents.filter(student => 
    student.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email?.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="text-xs">Scheduled</Badge>
      case 'active':
        return <Badge variant="default" className="text-xs bg-green-600">Live</Badge>
      case 'ended':
        return <Badge variant="outline" className="text-xs">Ended</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-white hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error || "Session not found"}</div>
        </GlassCard>
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
            onClick={() => router.back()}
            className="text-white hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-white text-2xl font-semibold">{session.title}</h1>
            <p className="text-slate-400 mt-1">{session.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(session.status)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {session.status === 'scheduled' && (
          <Button onClick={handleStartSession} variant="success">
            <Play className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}
        
        {session.status === 'active' && (
          <>
            <Button onClick={() => router.push(`/live/${sessionId}`)}>
              <Video className="h-4 w-4 mr-2" />
              Join Room
            </Button>
            <Button onClick={handleEndSession} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
              End Session
            </Button>
          </>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900/95 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Edit Live Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-300">Title:</Label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Description:</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 h-20 bg-white/5 border-white/10 text-white resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Scheduled Date & Time:</Label>
                <Input
                  type="datetime-local"
                  value={editData.scheduled_at}
                  onChange={(e) => setEditData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Duration (minutes):</Label>
                <Input
                  type="number"
                  value={editData.duration}
                  onChange={(e) => setEditData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSession}>
                  Update Session
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          onClick={copyInviteLink}
          variant="outline" 
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>

        <Button 
          onClick={handleDeleteSession}
          variant="outline" 
          className="border-red-500 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Enhanced Tabs Interface */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'overview', 
              label: 'Overview', 
              icon: <BookOpen className="h-4 w-4" />
            },
            { 
              id: 'students', 
              label: 'Students', 
              icon: <Users className="h-4 w-4" />
            },
            { 
              id: 'attendance', 
              label: 'Attendance', 
              icon: <Activity className="h-4 w-4" />
            },
            { 
              id: 'preparation', 
              label: 'Preparation', 
              icon: <FileText className="h-4 w-4" />
            },
            { 
              id: 'resources', 
              label: 'Resources', 
              icon: <FolderOpen className="h-4 w-4" />
            },
            { 
              id: 'history', 
              label: 'History', 
              icon: <History className="h-4 w-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="w-full"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4">Session Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-white text-sm">
                      {dateUtils.short(session.scheduled_at)}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {dateUtils.time(session.scheduled_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-white text-sm">{session.duration} minutes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-slate-400" />
                  <p className="text-white text-sm">{participants.length} participants</p>
                </div>
                {session.course_title && (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <p className="text-white text-sm">Course: {session.course_title}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{sessionNotes.length}</div>
                  <div className="text-xs text-slate-400">Notes</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{sessionResources.length}</div>
                  <div className="text-xs text-slate-400">Resources</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{sessionRecordings.length}</div>
                  <div className="text-xs text-slate-400">Recordings</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-orange-400">{participants.length}</div>
                  <div className="text-xs text-slate-400">Participants</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Manage Students</h3>
              <div className="flex gap-2">
                <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Students
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Existing Students</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Search Students</Label>
                        <Input
                          placeholder="Search by name or email..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                                <span className="text-blue-400 text-sm font-medium">
                                  {student.name ? student.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S'}
                                </span>
                              </div>
                              <div>
                                <p className="text-white text-sm">{student.name || student.email}</p>
                                <p className="text-slate-400 text-xs">{student.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={selectedStudents.includes(student.id) ? "default" : "outline"}
                              onClick={() => {
                                if (selectedStudents.includes(student.id)) {
                                  setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                } else {
                                  setSelectedStudents(prev => [...prev, student.id])
                                }
                              }}
                            >
                              {selectedStudents.includes(student.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddStudents} disabled={selectedStudents.length === 0}>
                          Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                        </Button>
                        <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Copy className="h-4 w-4 mr-2" />
                      Invite Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Invite Participants</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm">
                        Share this link with your students to join the live session:
                      </p>
                      <div className="p-3 bg-white/5 border border-white/10 rounded-md">
                        <code className="text-blue-400 text-sm">
                          {`${window.location.origin}/live/${sessionId}`}
                        </code>
                      </div>
                      <Button onClick={copyInviteLink} className="w-full">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="space-y-2">
              {participants.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No participants yet</p>
                  <p className="text-sm">Add students or share the invite link</p>
                </div>
              ) : (
                participants.map((participant: any) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-medium">
                          {participant.name ? participant.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm">{participant.name || participant.email?.split('@')[0] || 'Student'}</p>
                        <p className="text-slate-400 text-xs">{participant.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {participant.role || 'student'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceAnalysis sessionId={sessionId} />
        </TabsContent>

        {/* Preparation Tab */}
        <TabsContent value="preparation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Session Notes</h3>
                <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Create Session Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newNote.title}
                          onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Note title..."
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={newNote.content}
                          onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Note content..."
                          className="h-32 bg-white/5 border-white/10 text-white resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateNote}>
                          Create Note
                        </Button>
                        <Button variant="outline" onClick={() => setNotesOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-3">
                {sessionNotes.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                ) : (
                  sessionNotes.map((note: any) => (
                    <div key={note.id} className="p-3 bg-white/5 rounded-md">
                      <h4 className="text-white font-medium text-sm mb-1">{note.title}</h4>
                      <p className="text-slate-400 text-xs line-clamp-2">{note.content}</p>
                      <p className="text-slate-500 text-xs mt-2">{dateUtils.short(note.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push(`/live/${sessionId}`)} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Live Room
                </Button>
                
                <Button 
                  onClick={() => setResourcesOpen(true)} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Add Resources
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('resources')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  View All Resources
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('history')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <History className="h-4 w-4 mr-2" />
                  View Past Sessions
                </Button>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Session Resources</h3>
              <Dialog open={resourcesOpen} onOpenChange={setResourcesOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Add Resource</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newResource.title}
                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Resource title..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newResource.description}
                        onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Resource description..."
                        className="h-20 bg-white/5 border-white/10 text-white resize-none"
                      />
                    </div>
                    <div>
                      <Label>URL or File Path</Label>
                      <Input
                        value={newResource.url}
                        onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com or file path..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        value={newResource.type}
                        onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                      >
                        <option value="link">Link</option>
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="image">Image</option>
                        <option value="presentation">Presentation</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddResource}>
                        Add Resource
                      </Button>
                      <Button variant="outline" onClick={() => setResourcesOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-3">
              {sessionResources.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resources yet</p>
                  <p className="text-sm">Add resources to share with your students</p>
                </div>
              ) : (
                sessionResources.map((resource: any) => (
                  <div key={resource.id} className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                        {resource.type === 'video' ? <FileVideo className="h-4 w-4 text-green-400" /> :
                         resource.type === 'image' ? <FileImage className="h-4 w-4 text-green-400" /> :
                         resource.type === 'document' ? <FileText className="h-4 w-4 text-green-400" /> :
                         resource.type === 'presentation' ? <Presentation className="h-4 w-4 text-green-400" /> :
                         <File className="h-4 w-4 text-green-400" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{resource.title}</h4>
                        <p className="text-slate-400 text-xs">{resource.description}</p>
                        <p className="text-slate-500 text-xs">{dateUtils.short(resource.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4">Session Recordings</h3>
              <div className="space-y-3">
                {sessionRecordings.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recordings yet</p>
                  </div>
                ) : (
                  sessionRecordings.map((recording: any) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                          <PlayCircle className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Session Recording</h4>
                          <p className="text-slate-400 text-xs">{dateUtils.full(recording.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4">Session Activities</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Chat Messages</h4>
                      <p className="text-slate-400 text-xs">View chat history from this session</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white/5 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Attendance</h4>
                      <p className="text-slate-400 text-xs">View who attended this session</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white/5 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600/20 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">Session Notes</h4>
                      <p className="text-slate-400 text-xs">View all notes from this session</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 