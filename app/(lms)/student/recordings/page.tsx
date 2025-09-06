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
import { dateUtils } from "@/utils/date-utils"
import { 
  Search, 
  Filter, 
  Play, 
  Download, 
  Clock, 
  User, 
  BookOpen, 
  Calendar, 
  Eye, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  Video,
  FileVideo,
  CalendarDays,
  Users2,
  Clock3,
  ExternalLink,
  ThumbsUp,
  MessageSquare
} from "lucide-react"

interface Recording {
  id: string
  title: string
  description?: string
  session_id: string
  course_id: string
  course_title: string
  teacher_email: string
  teacher_name?: string
  duration: number
  file_size: number
  file_url: string
  thumbnail_url?: string
  recorded_at: string
  created_at: string
  view_count: number
  is_bookmarked?: boolean
  tags?: string[]
  quality: 'low' | 'medium' | 'high'
  format: 'mp4' | 'webm' | 'mov'
}

export default function StudentRecordingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterQuality, setFilterQuality] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [bookmarkedRecordings, setBookmarkedRecordings] = useState<string[]>([])

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true)
        const response = await http<Recording[]>('/api/recordings/student')
        setRecordings(response)
        
        // Extract bookmarked recordings
        const bookmarkedIds = response.filter(r => r.is_bookmarked).map(r => r.id)
        setBookmarkedRecordings(bookmarkedIds)
      } catch (err: any) {
        console.error('Error fetching recordings:', err)
        // If it's a 404, it means no recordings exist yet, which is fine
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          setRecordings([])
          setError(null)
        } else {
          setError(err.message || "Failed to fetch recordings")
          toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      } finally {
        setLoading(false)
      }
    }

    if (user?.email) {
      fetchRecordings()
    }
  }, [user?.email]) // Remove toast from dependencies to prevent infinite loop

  // Filter and sort recordings
  const filteredRecordings = useMemo(() => {
    let filtered = recordings

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(recording => 
        recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.course_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply course filter
    if (filterCourse !== "all") {
      filtered = filtered.filter(recording => recording.course_id === filterCourse)
    }

    // Apply quality filter
    if (filterQuality !== "all") {
      filtered = filtered.filter(recording => recording.quality === filterQuality)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        case "oldest":
          return new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        case "duration":
          return b.duration - a.duration
        case "title":
          return (a.title || "").localeCompare(b.title || "")
        case "popular":
          return b.view_count - a.view_count
        default:
          return 0
      }
    })

    return filtered
  }, [recordings, searchTerm, filterCourse, filterQuality, sortBy])

  const handleToggleBookmark = async (recordingId: string) => {
    try {
      if (bookmarkedRecordings.includes(recordingId)) {
        await http(`/api/recordings/${recordingId}/unbookmark`, { method: 'POST' })
        setBookmarkedRecordings(prev => prev.filter(id => id !== recordingId))
        toast({ title: "Removed from bookmarks" })
      } else {
        await http(`/api/recordings/${recordingId}/bookmark`, { method: 'POST' })
        setBookmarkedRecordings(prev => [...prev, recordingId])
        toast({ title: "Added to bookmarks" })
      }
    } catch (error: any) {
      toast({ title: "Failed to update bookmark", description: error.message, variant: "destructive" })
    }
  }

  const handlePlayRecording = (recording: Recording) => {
    // Open recording in new tab or modal
    window.open(recording.file_url, '_blank')
  }

  const handleDownloadRecording = async (recording: Recording) => {
    try {
      const response = await fetch(recording.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}.${recording.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "Download started" })
    } catch (error: any) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "low":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-white/10 text-slate-300 border-white/20"
    }
  }

  const getUniqueCourses = () => {
    const courses = recordings
      .filter(r => r.course_id && r.course_title)
      .map(r => ({ id: r.course_id!, title: r.course_title! }))
    
    return Array.from(new Map(courses.map(c => [c.id, c])).values())
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading recordings...</div>
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
            <h1 className="text-2xl font-bold text-white">Recorded Sessions</h1>
            <p className="text-slate-400">Access recorded live sessions from your courses</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {recordings.length} Recordings
            </Badge>
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
              {bookmarkedRecordings.length} Bookmarked
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search recordings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
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
            
            <Select value={filterQuality} onValueChange={setFilterQuality}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecordings.length === 0 ? (
          <div className="col-span-full">
            <GlassCard className="p-8 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
              <p className="text-slate-400">No recordings found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
            </GlassCard>
          </div>
        ) : (
          filteredRecordings.map((recording) => (
            <GlassCard key={recording.id} className="p-0 overflow-hidden">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                {recording.thumbnail_url ? (
                  <img 
                    src={recording.thumbnail_url} 
                    alt={recording.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="lg"
                    onClick={() => handlePlayRecording(recording)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>
                
                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                    {formatDuration(recording.duration)}
                  </Badge>
                </div>
                
                {/* Quality Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className={`text-xs ${getQualityColor(recording.quality)}`}>
                    {recording.quality}
                  </Badge>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white line-clamp-2">{recording.title}</h3>
                  {bookmarkedRecordings.includes(recording.id) && (
                    <BookmarkCheck className="h-4 w-4 text-yellow-400 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                {recording.description && (
                  <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                    {recording.description}
                  </p>
                )}
                
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{recording.course_title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{recording.teacher_name || recording.teacher_email?.split('@')[0] || 'Teacher'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{dateUtils.short(recording.recorded_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{recording.view_count} views</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FileVideo className="h-3 w-3" />
                    <span>{formatFileSize(recording.file_size)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => handlePlayRecording(recording)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadRecording(recording)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRecording(recording)
                      setShowDetails(true)
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleBookmark(recording.id)}
                    className={`${
                      bookmarkedRecordings.includes(recording.id)
                        ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                        : 'border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {bookmarkedRecordings.includes(recording.id) ? (
                      <BookmarkCheck className="h-3 w-3" />
                    ) : (
                      <Bookmark className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Recording Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recording Details</DialogTitle>
            <DialogDescription className="text-slate-300">
              View full recording information
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecording && (
            <div className="space-y-4">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg overflow-hidden">
                {selectedRecording.thumbnail_url ? (
                  <img 
                    src={selectedRecording.thumbnail_url} 
                    alt={selectedRecording.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                    {formatDuration(selectedRecording.duration)}
                  </Badge>
                </div>
              </div>
              
              {/* Title and Quality */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{selectedRecording.title}</h3>
                <Badge variant="outline" className={getQualityColor(selectedRecording.quality)}>
                  {selectedRecording.quality}
                </Badge>
              </div>
              
              {/* Description */}
              {selectedRecording.description && (
                <div>
                  <h4 className="font-medium text-white mb-2">Description</h4>
                  <p className="text-slate-300">{selectedRecording.description}</p>
                </div>
              )}
              
              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Course</p>
                  <p className="text-white">{selectedRecording.course_title}</p>
                </div>
                <div>
                  <p className="text-slate-400">Teacher</p>
                  <p className="text-white">{selectedRecording.teacher_name || selectedRecording.teacher_email?.split('@')[0] || 'Teacher'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Recorded</p>
                  <p className="text-white">{dateUtils.full(selectedRecording.recorded_at)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Duration</p>
                  <p className="text-white">{formatDuration(selectedRecording.duration)}</p>
                </div>
                <div>
                  <p className="text-slate-400">File Size</p>
                  <p className="text-white">{formatFileSize(selectedRecording.file_size)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Views</p>
                  <p className="text-white">{selectedRecording.view_count}</p>
                </div>
              </div>
              
              {/* Tags */}
              {selectedRecording.tags && selectedRecording.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecording.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-white/5 text-slate-300 border-white/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePlayRecording(selectedRecording)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Recording
                </Button>
                
                <Button
                  onClick={() => handleDownloadRecording(selectedRecording)}
                  className="bg-green-600/20 text-green-300 hover:bg-green-600/30 border-green-500/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  onClick={() => handleToggleBookmark(selectedRecording.id)}
                  className={`${
                    bookmarkedRecordings.includes(selectedRecording.id)
                      ? 'bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 border-yellow-500/30'
                      : 'bg-slate-600/20 text-slate-300 hover:bg-slate-600/30 border-slate-500/30'
                  }`}
                >
                  {bookmarkedRecordings.includes(selectedRecording.id) ? (
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
