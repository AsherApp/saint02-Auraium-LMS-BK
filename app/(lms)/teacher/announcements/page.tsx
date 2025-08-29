"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { notificationService } from "@/services/notification-service"
import { Bell, Plus, Search, Calendar, Users, Edit, Trash2 } from "lucide-react"

export default function TeacherAnnouncements() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { courses } = useCoursesFn()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    course_id: "",
    priority: "normal"
  })

  // Fetch announcements
  useEffect(() => {
    if (!user?.email) return
    
    setLoading(true)
    setError(null)
    
    const fetchAnnouncements = async () => {
      try {
        const response = await http<any>('/api/announcements')
        setAnnouncements(response.items || [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch announcements")
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [user?.email])

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message || !newAnnouncement.course_id) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await http('/api/announcements', {
        method: 'POST',
        body: {
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          course_id: newAnnouncement.course_id,
          priority: newAnnouncement.priority
        }
      })

      toast({ title: "Announcement created successfully" })
      
      // Trigger notification for new announcement
      const selectedCourse = courses.find(c => c.id === newAnnouncement.course_id)
      notificationService.newAnnouncement(newAnnouncement, selectedCourse?.title)
      
      setCreateOpen(false)
      setNewAnnouncement({ title: "", message: "", course_id: "", priority: "normal" })
      
      // Refresh announcements
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Failed to create announcement", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await http(`/api/announcements/${id}`, { method: 'DELETE' })
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast({ title: "Announcement deleted" })
    } catch (err: any) {
      toast({ title: "Failed to delete announcement", description: err.message, variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Announcements</h1>
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading announcements...</div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">Announcements</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Announcements</h1>
          <p className="text-slate-400 mt-1">Post updates and announcements for your students</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900/95 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Title:</label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                  className="mt-1 bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Course:</label>
                <select
                  value={newAnnouncement.course_id}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, course_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Priority:</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Message:</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your announcement message..."
                  className="mt-1 w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateAnnouncement} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAnnouncements.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Announcements</h3>
            <p className="text-slate-400">
              {searchQuery ? "No announcements match your search." : "You haven't created any announcements yet."}
            </p>
          </GlassCard>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <GlassCard key={announcement.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold">{announcement.title}</h3>
                    <Badge 
                      variant={announcement.priority === 'urgent' ? 'destructive' : announcement.priority === 'important' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-slate-300 mb-3">{announcement.message}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {announcement.course_title || "All Courses"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
} 