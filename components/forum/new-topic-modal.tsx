"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Tag, MessageCircle, BookOpen } from "lucide-react"

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

interface NewTopicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopicCreated?: () => void
}

export function NewTopicModal({ open, onOpenChange, onTopicCreated }: NewTopicModalProps) {
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
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (open) {
      fetchCategories()
      if (user?.role === "teacher") {
        fetchCourses()
      }
    }
  }, [open, user])

  const fetchCategories = async () => {
    try {
      const response = await http<ForumCategory[]>('/api/forum/categories')
      setCategories(response)
      if (response.length > 0) {
        setFormData(prev => ({ ...prev, category_id: response[0].id }))
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error)
      toast({
        title: "Error",
        description: "Failed to load forum categories",
        variant: "destructive"
      })
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await http<{ items: Course[] }>('/api/courses')
      setCourses(response.items || [])
    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      })
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
      const response = await http<any>('/api/forum/topics', {
        method: 'POST',
        body: {
          title: formData.title.trim(),
          content: formData.content.trim(),
          category_id: formData.category_id,
          course_id: formData.course_id || null,
          tags: formData.tags
        }
      })

      toast({
        title: "Topic created successfully",
        description: "Your discussion topic has been posted to the forum",
        duration: 3000
      })

      // Reset form
      setFormData({
        title: "",
        content: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        course_id: "",
        tags: []
      })
      setTagInput("")

      // Close modal and refresh
      onOpenChange(false)
      if (onTopicCreated) {
        onTopicCreated()
      }
    } catch (error: any) {
      console.error('Failed to create topic:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create topic",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Create New Discussion Topic
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Topic Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, descriptive title for your discussion"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
              maxLength={100}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Category *
            </label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              required
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white border-white/10">
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
          {user?.role === "teacher" && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Related Course (Optional)
              </label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a course (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/10">
                  <SelectItem value="">No specific course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-400" />
                        {course.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Tags (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags to help others find your topic"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 flex-1"
                maxLength={20}
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 5}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Display tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-blue-600/20 text-blue-300 border-blue-500/30"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {formData.tags.length}/5 tags maximum
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Discussion Content *
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, questions, or start a discussion..."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 min-h-[200px]"
              maxLength={2000}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.content.length}/2000 characters
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Create Topic
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
