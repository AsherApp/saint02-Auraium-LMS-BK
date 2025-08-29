"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
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
  ThumbsDown
} from "lucide-react"

interface Discussion {
  id: string
  title: string
  content: string
  course_id: string
  lesson_id?: string
  created_by: string
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

interface Course {
  id: string
  title: string
  description: string
}

export default function ForumPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("latest")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Fetch courses and discussions
  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courses.length > 0) {
      fetchDiscussions()
    }
  }, [selectedCourse, sortBy, searchQuery, courses])

  const fetchCourses = async () => {
    try {
      const response = await http<{ items: Course[] }>('/api/courses')
      setCourses(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      let discussionsData: Discussion[] = []
      
      if (selectedCourse === "all") {
        // Fetch discussions from all courses
        const promises = courses.map(course => 
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

      // Apply search filter
      if (searchQuery) {
        discussionsData = discussionsData.filter(discussion => 
          discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          discussion.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Apply sorting
      discussionsData.sort((a, b) => {
        switch (sortBy) {
          case "latest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case "most_replies":
            return (b.posts_count || 0) - (a.posts_count || 0)
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })

      setDiscussions(discussionsData)
    } catch (error: any) {
      toast({
        title: "Error loading discussions",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const filteredDiscussions = discussions.filter(discussion => {
    if (activeTab === "pinned" && !discussion.is_pinned) return false
    if (activeTab === "locked" && !discussion.is_locked) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Discussion Forum</h1>
          <p className="text-slate-400 mt-1">Connect, discuss, and learn with your community</p>
        </div>
        {user?.role === 'teacher' && (
          <Link href="/forum/new-topic">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </Link>
        )}
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
              <p className="text-slate-400 text-sm">View all discussions</p>
            </div>
          </div>
        </GlassCard>

        {courses.map((course) => (
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
              placeholder="Search discussions..."
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

      {/* Discussions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/10">
            All Discussions
          </TabsTrigger>
          <TabsTrigger value="pinned" className="text-white data-[state=active]:bg-white/10">
            <Pin className="h-4 w-4 mr-2" />
            Pinned
          </TabsTrigger>
          <TabsTrigger value="locked" className="text-white data-[state=active]:bg-white/10">
            Locked
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
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
                  : "Be the first to start a discussion!"
                }
              </p>
              {user?.role === 'teacher' && (
                <Link href="/forum/new-topic">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Discussion
                  </Button>
                </Link>
              )}
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredDiscussions.map((discussion) => (
                <GlassCard key={discussion.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/forum/discussion/${discussion.id}`}>
                          <h3 className="text-white font-medium hover:text-blue-400 transition-colors">
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
                          <span>By {discussion.created_by}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
