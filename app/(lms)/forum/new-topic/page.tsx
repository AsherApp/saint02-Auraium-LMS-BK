"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MessageCircle, BookOpen, Star, Pin } from "lucide-react"

interface ForumCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

interface Course {
  id: string
  title: string
  description: string
}

export default function NewTopicPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    course_id: "",
    is_announcement: false,
    tags: [] as string[]
  })

  useEffect(() => {
    fetchCategories()
    if (user?.role === "teacher") {
      fetchCourses()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const response = await http<ForumCategory[]>('/api/forum/categories')
      setCategories(response)
      if (response.length > 0) {
        setFormData(prev => ({ ...prev, category_id: response[0].id }))
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await http<Course[]>('/api/courses')
      setCourses(response)
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await http('/api/forum/topics', {
        method: 'POST',
        body: {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category_id: formData.category_id,
          course_id: formData.course_id || null,
          is_announcement: formData.is_announcement && user?.role === "teacher",
          tags: formData.tags
        }
      })

      toast({
        title: "Topic created successfully",
        description: "Your topic has been posted to the forum",
      })

      router.push(`/forum/topic/${response.id}`)
    } catch (error: any) {
      toast({
        title: "Failed to create topic",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/forum">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
        </Link>
        <div>
          <h1 className="text-white text-2xl font-semibold">Create New Topic</h1>
          <p className="text-slate-400 mt-1">Start a new discussion in the forum</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Topic Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a clear, descriptive title for your topic..."
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                maxLength={200}
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                Category *
              </label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Selection (Teachers only) */}
            {user?.role === "teacher" && courses.length > 0 && (
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-white mb-2">
                  Related Course (Optional)
                </label>
                <Select 
                  value={formData.course_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Announcement Checkbox (Teachers only) */}
            {user?.role === "teacher" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="announcement"
                  checked={formData.is_announcement}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_announcement: checked as boolean }))
                  }
                />
                <label 
                  htmlFor="announcement" 
                  className="text-sm font-medium text-white flex items-center gap-2"
                >
                  <Star className="h-4 w-4 text-yellow-400" />
                  Mark as announcement
                </label>
              </div>
            )}

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
                Topic Content *
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your topic content here. Be clear and specific to encourage good discussions..."
                className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.content.length}/5000 characters
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Forum Guidelines
              </h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Be respectful and constructive in your discussions</li>
                <li>• Use clear, descriptive titles for better discoverability</li>
                <li>• Provide context and details in your content</li>
                <li>• Choose the appropriate category for your topic</li>
                {user?.role === "teacher" && (
                  <li>• Use announcements sparingly for important updates</li>
                )}
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim() || !formData.category_id}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Creating..." : "Create Topic"}
              </Button>
              <Link href="/forum">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </form>
    </div>
  )
}
