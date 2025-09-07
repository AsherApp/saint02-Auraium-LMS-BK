"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { 
  MessageCircle, 
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
  teachers?: {
    name: string
    first_name?: string
    last_name?: string
  }
}

interface Course {
  id: string
  title: string
  description: string
}

export default function StudentDiscussionsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [coursesList, setCoursesList] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("latest")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("announcements")

  // Fetch courses, discussions, and announcements
  useEffect(() => {
    fetchStudentData()
  }, [])

  useEffect(() => {
    if (coursesList.length > 0) {
      fetchDiscussions()
      fetchAnnouncements()
    }
  }, [selectedCourse, sortBy, searchQuery, coursesList])

  const fetchStudentData = async () => {
    try {
      // Get enrolled courses
      const coursesResponse = await http<any>(`/api/students/me/courses`)
      const enrolledCourses = coursesResponse.items || []
      setCoursesList(enrolledCourses.map((enrollment: any) => enrollment.courses).filter(Boolean))
    } catch (error: any) {
      console.error('Failed to fetch student data:', error)
    }
  }

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      let discussionsData: Discussion[] = []
      
      if (selectedCourse === "all") {
        // Fetch discussions from all enrolled courses
        const promises = coursesList.map(course => 
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
      const response = await http<any>('/api/announcements/student')
      setAnnouncements(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Discussions & Announcements</h1>
          <p className="text-slate-400 mt-1">Stay updated with course discussions and announcements</p>
        </div>
      </div>

      {/* Course Filter */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard 
          className={`p-4 cursor-pointer transition-all hover:bg-white/10 ${
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

        {coursesList.map((course) => (
          <GlassCard 
            key={course.id} 
            className={`p-4 cursor-pointer transition-all hover:bg-white/10 ${
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

      {/* Filters and Search */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search discussions and announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
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

      {/* Main Navigation Tabs */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'announcements', 
              label: 'Announcements', 
              icon: <Bell className="h-4 w-4" />, 
              badge: announcements?.length || 0 
            },
            { 
              id: 'discussions', 
              label: 'Discussions', 
              icon: <MessageCircle className="h-4 w-4" />, 
              badge: discussions?.length || 0 
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      {/* Announcements Tab Content - Default for Students */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No announcements found</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery 
                  ? "No announcements match your search criteria."
                  : "No announcements have been posted yet."
                }
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <GlassCard key={announcement.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      
                      <p className="text-slate-300 mb-3">{announcement.message}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        {announcement.teachers?.name && (
                          <div className="flex items-center gap-1">
                            <span>From: {announcement.teachers.name}</span>
                          </div>
                        )}
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
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discussions Tab Content */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No discussions found</h3>
              <p className="text-slate-400 mb-4">
                {searchQuery 
                  ? "No discussions match your search criteria."
                  : "No discussions have been created yet."
                }
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredDiscussions.map((discussion) => (
                <GlassCard key={discussion.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/student/discussions/${discussion.id}`}>
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
          )}
        </div>
      )}
    </div>
  )
}
