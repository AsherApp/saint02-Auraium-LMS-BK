"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { 
  Video, 
  Calendar,
  Clock,
  Play,
  Download,
  Plus,
  Settings,
  Users,
  BookOpen,
  ArrowLeft,
  Mic,
  MicOff,
  Eye
} from "lucide-react"
import Link from "next/link"

export default function RecordingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [recordings, setRecordings] = useState<any[]>([])
  const [scheduledSessions, setScheduledSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60
  })

  // Fetch recordings and scheduled sessions
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch scheduled sessions
        const response = await http<any>(`/api/live/scheduled`)
        setScheduledSessions(response.items || [])
        
        // For now, we'll use mock recordings until we implement the recordings API
        const mockRecordings = [
          {
            id: '1',
            title: 'Introduction to React - Session 1',
            duration: '45:30',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            size: '125MB',
            participants: 12,
            session_id: 'session-1'
          },
          {
            id: '2',
            title: 'Advanced JavaScript Concepts',
            duration: '52:15',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            size: '145MB',
            participants: 15,
            session_id: 'session-2'
          }
        ]
        setRecordings(mockRecordings)
      } catch (err: any) {
        setError(err.message || "Failed to load data")
        setRecordings([])
        setScheduledSessions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.email])

  async function scheduleSession() {
    if (!newSession.title.trim() || !newSession.scheduled_at) return
    
    try {
      await http(`/api/live/schedule`, {
        method: 'POST',
        body: newSession
      })
      
      // Refresh scheduled sessions
      const response = await http<any>(`/api/live/scheduled`)
      setScheduledSessions(response.items || [])
      
      setNewSession({ title: "", description: "", scheduled_at: "", duration_minutes: 60 })
      setScheduleOpen(false)
      toast({ title: "Session scheduled successfully" })
    } catch (err: any) {
      toast({ title: "Failed to schedule session", description: err.message, variant: "destructive" })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/live-class">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Live Classes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Recordings & Schedule</h1>
            <p className="text-slate-300">
              Manage your live session recordings and schedule upcoming classes.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Schedule Next Class */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Schedule Next Class</h2>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Schedule New Live Session</DialogTitle>
                <DialogDescription>Create a new live class session for your students.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white font-medium">Session Title *</label>
                  <Input
                    value={newSession.title}
                    onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                    placeholder="e.g., Advanced React Hooks"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-white font-medium">Description</label>
                  <Textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                    placeholder="Brief description of what will be covered..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-medium">Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={newSession.scheduled_at}
                      onChange={(e) => setNewSession(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={newSession.duration_minutes}
                      onChange={(e) => setNewSession(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                      className="bg-white/5 border-white/10 text-white"
                      min="15"
                      max="180"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={scheduleSession}
                    disabled={!newSession.title || !newSession.scheduled_at}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setScheduleOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </GlassCard>

      {/* Previous Recordings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Previous Recordings</h2>
        </div>
        
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No recordings available yet.</p>
            <p className="text-sm text-slate-500">Recordings will appear here after your live sessions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h3 className="text-white font-medium">{recording.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recording.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recording.participants} participants
                    </span>
                    <span>{formatDate(recording.created_at)}</span>
                    <span>{recording.size}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Scheduled Sessions */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Scheduled Sessions</h2>
        </div>
        
        {scheduledSessions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No scheduled sessions.</p>
            <p className="text-sm text-slate-500">Schedule your first session to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h3 className="text-white font-medium">{session.title}</h3>
                  {session.description && (
                    <p className="text-slate-400 text-sm mt-1">{session.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(session.start_at)}
                    </span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                      Scheduled
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/teacher/live-class/${session.id}`}>
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </Link>
                  <Link href={`/live/${session.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
