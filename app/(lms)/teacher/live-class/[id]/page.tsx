"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { useLiveSessionsFn } from "@/services/live/hook"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
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
  Mail
} from "lucide-react"

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
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration: 60
  })

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

    fetchSessionDetails()
    fetchParticipants()
  }, [sessionId, user?.email])

  const handleStartSession = async () => {
    try {
      await http(`/api/live/${sessionId}/status`, {
        method: 'POST',
        body: { status: 'active' }
      })
      toast({ title: "Session started!" })
      // Navigate to live room
      router.push(`/live/${sessionId}`)
    } catch (err: any) {
      toast({ title: "Failed to start session", description: err.message, variant: "destructive" })
    }
  }

  const handleEndSession = async () => {
    try {
      await http(`/api/live/${sessionId}/status`, {
        method: 'POST',
        body: { status: 'ended', end_at: new Date().toISOString() }
      })
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
      <div className="flex items-center gap-3">
        {session.status === 'scheduled' && (
          <Button onClick={handleStartSession} className="bg-green-600 hover:bg-green-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}
        
        {session.status === 'active' && (
          <>
            <Button onClick={() => router.push(`/live/${sessionId}`)} className="bg-blue-600 hover:bg-blue-700 text-white">
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
                <label className="text-sm font-medium text-slate-300">Title:</label>
                <input
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Description:</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Scheduled Date & Time:</label>
                <input
                  type="datetime-local"
                  value={editData.scheduled_at}
                  onChange={(e) => setEditData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Duration (minutes):</label>
                <input
                  type="number"
                  value={editData.duration}
                  onChange={(e) => setEditData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateSession} className="bg-blue-600 hover:bg-blue-700 text-white">
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

      {/* Session Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Session Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-white text-sm">
                  {new Date(session.scheduled_at).toLocaleDateString()}
                </p>
                <p className="text-slate-400 text-xs">
                  {new Date(session.scheduled_at).toLocaleTimeString()}
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

        {/* Participants */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Participants</h3>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
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
                  <Button onClick={copyInviteLink} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-slate-400 text-sm">No participants yet</p>
            ) : (
              participants.map((participant: any) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <Mail className="h-3 w-3 text-blue-400" />
                    </div>
                    <span className="text-white text-sm">{participant.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {participant.role || 'student'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      {session.status === 'active' && (
        <GlassCard className="p-6">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push(`/live/${sessionId}`)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Video className="h-4 w-4 mr-2" />
              Join Live Room
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Chat History
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Settings className="h-4 w-4 mr-2" />
              Session Settings
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
} 