"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
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
  BookOpen
} from "lucide-react"

export function RecordingsWidget({ sessionId, isHost = false }: { sessionId: string; isHost?: boolean }) {
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
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch recordings from the backend
        const recordingsResponse = await http<any>(`/api/live/${sessionId}/recordings`)
        setRecordings(recordingsResponse.items || [])

        // Fetch scheduled sessions
        const response = await http<any>(`/api/live/scheduled`)
        setScheduledSessions(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to load data")
        setRecordings([])
        setScheduledSessions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

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

  return (
    <div>
      <div className="text-xs text-slate-300 mb-2">Recordings & Schedule</div>
      
      {isHost && (
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white mb-3 w-full">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Next Class
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Schedule Next Class</DialogTitle>
              <DialogDescription>Schedule a future live class session for your students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class Title *</label>
                <Input
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., Advanced React Hooks"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white min-h-20"
                  placeholder="Brief description of what will be covered..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={newSession.scheduled_at}
                    onChange={(e) => setNewSession(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
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
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <Button 
                  variant="secondary" 
                  onClick={() => setScheduleOpen(false)} 
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={scheduleSession} 
                  disabled={!newSession.title.trim() || !newSession.scheduled_at}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Class
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Previous Recordings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Video className="h-4 w-4" />
          Previous Recordings
        </h4>
        <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading recordings...</div>
          ) : error ? (
            <div className="text-red-300 text-sm">Error loading recordings</div>
          ) : recordings.length === 0 ? (
            <div className="text-slate-400 text-sm">No recordings available.</div>
          ) : (
            recordings.map((recording) => (
              <div key={recording.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-100 text-sm font-medium">{recording.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {recording.duration}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>{formatDate(recording.created_at)}</span>
                    <span>{recording.size}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recording.participants}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-400 hover:text-green-300">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scheduled Sessions */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Scheduled Sessions
        </h4>
        <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading scheduled sessions...</div>
          ) : error ? (
            <div className="text-red-300 text-sm">Error loading scheduled sessions</div>
          ) : scheduledSessions.length === 0 ? (
            <div className="text-slate-400 text-sm">No scheduled sessions.</div>
          ) : (
            scheduledSessions.map((session) => (
              <div key={session.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-400" />
                    <span className="text-slate-100 text-sm font-medium">{session.title}</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-white/10 text-xs">
                      Scheduled
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.duration_minutes || 60)}
                  </div>
                </div>
                
                {session.description && (
                  <p className="text-slate-300 text-xs mb-2">{session.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatDate(session.scheduled_at)}</span>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1">
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
