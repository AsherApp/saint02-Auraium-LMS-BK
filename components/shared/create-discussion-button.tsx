"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Plus } from "lucide-react"

interface CreateDiscussionButtonProps {
  courseId: string
  moduleId?: string
  lessonId?: string
  assignmentId?: string
  context?: string
  onDiscussionCreated?: () => void
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function CreateDiscussionButton({
  courseId,
  moduleId,
  lessonId,
  assignmentId,
  context = "assignment",
  onDiscussionCreated,
  variant = "outline",
  size = "sm",
  className = ""
}: CreateDiscussionButtonProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    allow_student_posts: true,
    require_approval: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a discussion title",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await http('/api/discussions', {
        method: 'POST',
        body: {
          course_id: courseId,
          module_id: moduleId,
          lesson_id: lessonId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          allow_student_posts: formData.allow_student_posts,
          require_approval: formData.require_approval
        }
      })

      toast({
        title: "Success",
        description: "Discussion created successfully"
      })

      setOpen(false)
      setFormData({
        title: "",
        description: "",
        allow_student_posts: true,
        require_approval: false
      })

      if (onDiscussionCreated) {
        onDiscussionCreated()
      }
    } catch (error: any) {
      console.error('Failed to create discussion:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create discussion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getContextTitle = () => {
    switch (context) {
      case "assignment":
        return "Create Discussion for Assignment"
      case "module":
        return "Create Discussion for Module"
      case "lesson":
        return "Create Discussion for Lesson"
      default:
        return "Create Discussion"
    }
  }

  const getDefaultTitle = () => {
    switch (context) {
      case "assignment":
        return "Assignment Discussion"
      case "module":
        return "Module Discussion"
      case "lesson":
        return "Lesson Discussion"
      default:
        return "Course Discussion"
    }
  }

  const getDefaultDescription = () => {
    switch (context) {
      case "assignment":
        return "Discuss questions, share ideas, and collaborate on this assignment."
      case "module":
        return "Share thoughts, ask questions, and discuss topics related to this module."
      case "lesson":
        return "Discuss the lesson content, ask questions, and share insights."
      default:
        return "Share thoughts, ask questions, and discuss course-related topics."
    }
  }

  if (user?.role !== 'teacher') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`text-blue-400 border-blue-400/30 hover:bg-blue-400/10 ${className}`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Create Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900/95 border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            {getContextTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white font-medium">Discussion Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={getDefaultTitle()}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={getDefaultDescription()}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_student_posts"
                checked={formData.allow_student_posts}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_student_posts: e.target.checked }))}
                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
              />
              <Label htmlFor="allow_student_posts" className="text-white text-sm">
                Allow student posts
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_approval"
                checked={formData.require_approval}
                onChange={(e) => setFormData(prev => ({ ...prev, require_approval: e.target.checked }))}
                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
              />
              <Label htmlFor="require_approval" className="text-white text-sm">
                Require approval for posts
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Discussion
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
