"use client"

import { useState, useEffect, useMemo } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { Search, Filter, Bell, Clock, User, BookOpen, Calendar, Tag, Eye, EyeOff, Star, Share2, Bookmark, BookmarkCheck } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  teacher_email: string
  teacher_name?: string
  course_id?: string
  course_title?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_published: boolean
  created_at: string
  updated_at: string
  read_by?: string[]
  bookmarked_by?: string[]
}

export default function StudentAnnouncementsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCourse, setFilterCourse] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [bookmarkedAnnouncements, setBookmarkedAnnouncements] = useState<string[]>([])
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([])

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const response = await http<Announcement[]>('/api/announcements/student')
        setAnnouncements(response)
        
        // Extract read and bookmarked announcements
        const readIds = response.filter(a => a.read_by?.includes(user?.email || '')).map(a => a.id)
        const bookmarkedIds = response.filter(a => a.bookmarked_by?.includes(user?.email || '')).map(a => a.id)
        setReadAnnouncements(readIds)
        setBookmarkedAnnouncements(bookmarkedIds)
      } catch (err: any) {
        setError(err.message || "Failed to fetch announcements")
        toast({ title: "Error", description: err.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    if (user?.email) {
      fetchAnnouncements()
    }
  }, [user?.email, toast])

  // Filter and sort announcements
  const filteredAnnouncements = useMemo(() => {
    // Ensure announcements is always an array
    let filtered = Array.isArray(announcements) ? announcements : []

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(announcement => 
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(announcement => announcement.priority === filterPriority)
    }

    // Apply course filter
    if (filterCourse !== "all") {
      filtered = filtered.filter(announcement => announcement.course_id === filterCourse)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        case "title":
          return (a.title || "").localeCompare(b.title || "")
        default:
          return 0
      }
    })

    return filtered
  }, [announcements, searchTerm, filterPriority, filterCourse, sortBy])

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await http(`/api/announcements/${announcementId}/read`, { method: 'POST' })
      setReadAnnouncements(prev => [...prev, announcementId])
      toast({ title: "Marked as read" })
    } catch (error: any) {
      toast({ title: "Failed to mark as read", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleBookmark = async (announcementId: string) => {
    try {
      if (bookmarkedAnnouncements.includes(announcementId)) {
        await http(`/api/announcements/${announcementId}/unbookmark`, { method: 'POST' })
        setBookmarkedAnnouncements(prev => prev.filter(id => id !== announcementId))
        toast({ title: "Removed from bookmarks" })
      } else {
        await http(`/api/announcements/${announcementId}/bookmark`, { method: 'POST' })
        setBookmarkedAnnouncements(prev => [...prev, announcementId])
        toast({ title: "Added to bookmarks" })
      }
    } catch (error: any) {
      toast({ title: "Failed to update bookmark", description: error.message, variant: "destructive" })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "normal":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-white/10 text-slate-300 border-white/20"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Bell className="h-4 w-4 text-red-400" />
      case "high":
        return <Bell className="h-4 w-4 text-orange-400" />
      case "normal":
        return <Bell className="h-4 w-4 text-blue-400" />
      case "low":
        return <Bell className="h-4 w-4 text-green-400" />
      default:
        return <Bell className="h-4 w-4 text-slate-400" />
    }
  }

  const getUniqueCourses = () => {
    const courses = (Array.isArray(announcements) ? announcements : [])
      .filter(a => a.course_id && a.course_title)
      .map(a => ({ id: a.course_id!, title: a.course_title! }))
    
    return Array.from(new Map(courses.map(c => [c.id, c])).values())
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading announcements...</div>
        </GlassCard>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Announcements</h1>
            <p className="text-slate-400">Stay updated with important announcements from your teachers</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {Array.isArray(announcements) ? announcements.length : 0} Total
            </Badge>
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
              {(Array.isArray(announcements) ? announcements.length : 0) - readAnnouncements.length} Unread
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="all">All Courses</SelectItem>
                {getUniqueCourses().map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
            <p className="text-slate-400">No announcements found</p>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </GlassCard>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <GlassCard 
              key={announcement.id} 
              className={`p-4 cursor-pointer transition-all hover:bg-white/5 ${
                !readAnnouncements.includes(announcement.id) ? 'border-l-4 border-l-blue-500 bg-blue-500/5' : ''
              }`}
              onClick={() => {
                setSelectedAnnouncement(announcement)
                setShowDetails(true)
                if (!readAnnouncements.includes(announcement.id)) {
                  handleMarkAsRead(announcement.id)
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(announcement.priority)}
                  {!readAnnouncements.includes(announcement.id) && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white truncate">{announcement.title}</h3>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </Badge>
                    {bookmarkedAnnouncements.includes(announcement.id) && (
                      <BookmarkCheck className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                    {announcement.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{announcement.teacher_name || announcement.teacher_email}</span>
                    </div>
                    
                    {announcement.course_title && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{announcement.course_title}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleBookmark(announcement.id)
                    }}
                    className="text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                  >
                    {bookmarkedAnnouncements.includes(announcement.id) ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (navigator.share) {
                        navigator.share({
                          title: announcement.title,
                          text: announcement.content,
                          url: window.location.href
                        })
                      } else {
                        navigator.clipboard.writeText(`${announcement.title}\n\n${announcement.content}`)
                        toast({ title: "Announcement copied to clipboard" })
                      }
                    }}
                    className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Announcement Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
            <DialogDescription className="text-slate-300">
              View full announcement details
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {selectedAnnouncement.teacher_name?.charAt(0).toUpperCase() || selectedAnnouncement.teacher_email?.charAt(0).toUpperCase() || "T"}
                    </div>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">
                      {selectedAnnouncement.teacher_name || selectedAnnouncement.teacher_email}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(selectedAnnouncement.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getPriorityColor(selectedAnnouncement.priority)}>
                  {selectedAnnouncement.priority}
                </Badge>
              </div>
              
              {selectedAnnouncement.course_title && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <BookOpen className="h-4 w-4" />
                  <span>Course: {selectedAnnouncement.course_title}</span>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-white mb-3 text-lg">{selectedAnnouncement.title}</h3>
                <div className="bg-white/5 p-4 rounded-md">
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleToggleBookmark(selectedAnnouncement.id)}
                  className={`${
                    bookmarkedAnnouncements.includes(selectedAnnouncement.id)
                      ? 'bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 border-yellow-500/30'
                      : 'bg-slate-600/20 text-slate-300 hover:bg-slate-600/30 border-slate-500/30'
                  }`}
                >
                  {bookmarkedAnnouncements.includes(selectedAnnouncement.id) ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                      Remove Bookmark
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Add Bookmark
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: selectedAnnouncement.title,
                        text: selectedAnnouncement.content,
                        url: window.location.href
                      })
                    } else {
                      navigator.clipboard.writeText(`${selectedAnnouncement.title}\n\n${selectedAnnouncement.content}`)
                      toast({ title: "Announcement copied to clipboard" })
                    }
                  }}
                  className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border-blue-500/30"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
