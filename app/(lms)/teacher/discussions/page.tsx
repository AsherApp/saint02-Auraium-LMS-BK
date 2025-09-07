"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { useCoursesFn } from "@/services/courses/hook"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { notificationService } from "@/services/notification-service"
import { AnimationWrapper, StaggeredAnimationWrapper } from "@/components/shared/animation-wrapper"
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Eye, 
  MessageSquare,
  Pin,
  Star,
  Users,
  BookOpen,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Edit,
  Trash2
} from "lucide-react"
import { NewTopicModal } from "@/components/forum/new-topic-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

interface Discussion {
  id: string
  title: string
  description: string
  course_id: string
  lesson_id?: string
  created_by: string
  creator_name?: string
  creator_email?: string
  is_pinned: boolean
  is_locked: boolean
  allow_student_posts: boolean
  require_approval: boolean
  created_at: string
  updated_at: string
  posts_count?: number
  courses?: {
    title: string
  }
}

interface Announcement {
  id: string
  title: string
  message: string
  course_id: string
  priority: string
  created_at: string
  courses?: {
    title: string
  }
}

interface Course {
  id: string
  title: string
  description: string
}

function TeacherDiscussionsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { courses } = useCoursesFn()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [coursesList, setCoursesList] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("latest")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("discussions")
  const [newTopicModalOpen, setNewTopicModalOpen] = useState(false)
  const [createAnnouncementOpen, setCreateAnnouncementOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    course_id: "",
    priority: "normal"
  })

  // Fetch courses, discussions, and announcements
  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (coursesList.length > 0) {
      fetchDiscussions()
      fetchAnnouncements()
    }
  }, [selectedCourse, sortBy, searchQuery, coursesList])

  const fetchCourses = async () => {
    try {
      const response = await http<{ items: Course[] }>('/api/courses')
      setCoursesList(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const handleTopicCreated = () => {
    fetchDiscussions()
  }

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      let discussionsData: Discussion[] = []
      
      if (selectedCourse === "all") {
        // Fetch discussions from all courses
        const promises = (coursesList || []).map(course => 
          http<{ items: Discussion[] }>(`/api/discussions/course/${course.id}`)
            .then(response => response.items || [])
            .catch(() => [])
        )
        
        const results = await Promise.all(promises)
        discussionsData = results.flat()
      } else {
        // Fetch discussions from specific course
        const response = await http<{ items: Discussion[] }>(`/api/discussions/course/${selectedCourse}`)
        discussionsData = response.items || []
      }

      // Sort discussions
      discussionsData.sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'most_replies':
            return (b.posts_count || 0) - (a.posts_count || 0)
          default:
            return 0
        }
      })

      setDiscussions(discussionsData)
    } catch (error: any) {
      console.error('Failed to fetch discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await http<any>('/api/announcements')
      setAnnouncements(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
    }
  }

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
      const selectedCourse = (coursesList || []).find(c => c.id === newAnnouncement.course_id)
      notificationService.newAnnouncement(newAnnouncement, selectedCourse?.title)
      
      setCreateAnnouncementOpen(false)
      setNewAnnouncement({ title: "", message: "", course_id: "", priority: "normal" })
      
      // Refresh announcements
      fetchAnnouncements()
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

  const filteredDiscussions = discussions.filter(discussion =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-600 text-white text-xs">High Priority</Badge>
      case 'normal':
        return <Badge className="bg-blue-600 text-white text-xs">Normal</Badge>
      case 'low':
        return <Badge className="bg-gray-600 text-white text-xs">Low Priority</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown"
    
    try {
      const now = new Date()
      const date = new Date(dateString)
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return "1 day ago"
      if (diffDays < 30) return `${diffDays} days ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      return `${Math.floor(diffDays / 365)} years ago`
    } catch (error) {
      return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimationWrapper>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-semibold">Discussions & Announcements</h1>
            <p className="text-slate-400 mt-1">Manage course discussions and announcements</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default"
              onClick={() => setNewTopicModalOpen(true)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
            <Button 
              variant="outline"
              onClick={() => setCreateAnnouncementOpen(true)}
              className="border-white/20 text-white hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <Bell className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </div>
      </AnimationWrapper>

      {/* Course Filter */}
      <StaggeredAnimationWrapper delay={0.1} stagger={0.1}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard 
            className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:scale-105 ${
              selectedCourse === "all" ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedCourse("all")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">All Courses</h3>
                <p className="text-slate-400 text-sm">View all content</p>
              </div>
            </div>
          </GlassCard>

          {(coursesList || []).map((course) => (
            <GlassCard 
              key={course.id} 
              className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:scale-105 ${
                selectedCourse === course.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCourse(course.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <BookOpen className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{course.title}</h3>
                  <p className="text-slate-400 text-sm">{course.description}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </StaggeredAnimationWrapper>

      {/* Filters and Search */}
      <AnimationWrapper delay={0.2}>
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search discussions and announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most_replies">Most Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>
      </AnimationWrapper>

      {/* Main Navigation Tabs */}
      <AnimationWrapper delay={0.3}>
        <div className="w-full flex justify-center py-4">
          <FluidTabs
            tabs={[
              { 
                id: 'discussions', 
                label: 'Discussions', 
                icon: <MessageCircle className="h-4 w-4" />, 
                badge: discussions?.length || 0 
              },
              { 
                id: 'announcements', 
                label: 'Announcements', 
                icon: <Bell className="h-4 w-4" />, 
                badge: announcements?.length || 0 
              }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
            width="wide"
          />
        </div>
      </AnimationWrapper>

      {/* Discussions Tab Content */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          {loading ? (
            <AnimationWrapper delay={0.4}>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </AnimationWrapper>
          ) : filteredDiscussions.length === 0 ? (
            <AnimationWrapper delay={0.4}>
              <GlassCard className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No discussions found</h3>
                <p className="text-slate-400 mb-4">
                  {searchQuery 
                    ? "No discussions match your search criteria."
                    : "Create your first discussion to get started!"
                  }
                </p>
                <Button 
                  variant="default"
                  onClick={() => setNewTopicModalOpen(true)}
                  className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Discussion
                </Button>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <StaggeredAnimationWrapper delay={0.4} stagger={0.1}>
              <div className="space-y-4">
                {(filteredDiscussions || []).map((discussion) => (
                  <GlassCard key={discussion.id} className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/teacher/discussions/${discussion.id}`}>
                          <h3 className="text-white font-medium hover:text-blue-400 transition-colors cursor-pointer">
                            {discussion.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2">
                          {discussion.is_pinned && (
                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          {discussion.is_locked && (
                            <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                              Locked
                            </Badge>
                          )}
                          {!discussion.allow_student_posts && (
                            <Badge className="bg-red-600/20 text-red-400 border-red-600/30">
                              Teachers Only
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 mb-3">{discussion.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        {discussion.courses?.title && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {discussion.courses.title}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {discussion.posts_count || 0} replies
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>By {discussion.creator_name || discussion.created_by}</span>
                          <span>•</span>
                          <span>{formatDate(discussion.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </GlassCard>
                ))}
              </div>
            </StaggeredAnimationWrapper>
          )}
        </div>
      )}

      {/* Announcements Tab Content */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {loading ? (
            <AnimationWrapper delay={0.4}>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </AnimationWrapper>
          ) : filteredAnnouncements.length === 0 ? (
            <AnimationWrapper delay={0.4}>
              <GlassCard className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">No announcements found</h3>
                <p className="text-slate-400 mb-4">
                  {searchQuery 
                    ? "No announcements match your search criteria."
                    : "Create your first announcement to communicate with students!"
                  }
                </p>
                <Button 
                  variant="default"
                  onClick={() => setCreateAnnouncementOpen(true)}
                  className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Create First Announcement
                </Button>
              </GlassCard>
            </AnimationWrapper>
          ) : (
            <StaggeredAnimationWrapper delay={0.4} stagger={0.1}>
              <div className="space-y-4">
                {(filteredAnnouncements || []).map((announcement) => (
                  <GlassCard key={announcement.id} className="p-6 hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      
                      <p className="text-slate-300 mb-3">{announcement.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        {announcement.courses?.title && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {announcement.courses.title}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(announcement.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 hover:scale-110"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  </GlassCard>
                ))}
              </div>
            </StaggeredAnimationWrapper>
          )}
        </div>
      )}

      {/* New Topic Modal */}
      <NewTopicModal
        open={newTopicModalOpen}
        onOpenChange={setNewTopicModalOpen}
        onTopicCreated={handleTopicCreated}
      />

      {/* New Announcement Modal */}
      <Dialog open={createAnnouncementOpen} onOpenChange={setCreateAnnouncementOpen}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              Create New Announcement
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Title *
              </label>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter announcement title"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Course *
              </label>
              <Select
                value={newAnnouncement.course_id}
                onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, course_id: value }))}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/10">
                  {(coursesList || []).map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Priority
              </label>
              <Select
                value={newAnnouncement.priority}
                onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/10">
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Message *
              </label>
              <textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter announcement message..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-400 rounded-md p-3 min-h-[120px]"
                maxLength={500}
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                {newAnnouncement.message.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setCreateAnnouncementOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnnouncement}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default dynamic(() => Promise.resolve(TeacherDiscussionsPage), {
  ssr: false
})
