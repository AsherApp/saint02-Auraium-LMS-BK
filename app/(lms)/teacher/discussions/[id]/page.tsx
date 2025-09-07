"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  MessageSquare, 
  Pin, 
  Lock, 
  Users, 
  Calendar, 
  Clock,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface DiscussionPost {
  id: string
  discussion_id: string
  content: string
  author_email: string
  author_name?: string
  author_role: string
  parent_post_id?: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

export default function DiscussionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newPost, setNewPost] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchDiscussion()
    }
  }, [params.id])

  const fetchDiscussion = async () => {
    try {
      setLoading(true)
      const response = await http<{ discussion: Discussion; posts: DiscussionPost[] }>(`/api/discussions/${params.id}`)
      setDiscussion(response.discussion)
      setPosts(response.posts || [])
    } catch (error: any) {
      console.error('Failed to fetch discussion:', error)
      toast({
        title: "Error",
        description: "Failed to load discussion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePostReply = async (parentPostId?: string) => {
    if (!newPost.trim() && !replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      })
      return
    }

    setPosting(true)
    try {
      const content = parentPostId ? replyContent : newPost
      await http(`/api/discussions/${params.id}/posts`, {
        method: 'POST',
        body: {
          content: content.trim(),
          parent_post_id: parentPostId
        }
      })

      toast({
        title: "Success",
        description: "Reply posted successfully"
      })

      // Clear form and refresh
      setNewPost("")
      setReplyContent("")
      setReplyingTo(null)
      fetchDiscussion()
    } catch (error: any) {
      console.error('Failed to post reply:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive"
      })
    } finally {
      setPosting(false)
    }
  }

  const handleApprovePost = async (postId: string, approved: boolean) => {
    try {
      await http(`/api/discussions/posts/${postId}/approve`, {
        method: 'POST',
        body: { is_approved: approved }
      })

      toast({
        title: "Success",
        description: `Post ${approved ? 'approved' : 'rejected'}`
      })

      fetchDiscussion()
    } catch (error: any) {
      console.error('Failed to approve post:', error)
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getReplies = (postId: string) => {
    return posts.filter(post => post.parent_post_id === postId)
  }

  const getMainPosts = () => {
    return posts.filter(post => !post.parent_post_id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Discussion Not Found</h2>
          <p className="text-slate-400 mb-4">The discussion you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{discussion.title}</h1>
            <p className="text-slate-400">{discussion.courses?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {discussion.is_pinned && (
            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
              <Pin className="h-3 w-3 mr-1" />
              Pinned
            </Badge>
          )}
          {discussion.is_locked && (
            <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
              <Lock className="h-3 w-3 mr-1" />
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

      {/* Discussion Description */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-300 mb-3">{discussion.description}</p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {posts.length} posts
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(discussion.created_at)}
              </div>
                    <div className="flex items-center gap-1">
                      <span>By {discussion.creator_name || discussion.created_by}</span>
                    </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Posts */}
      <div className="space-y-4">
        {getMainPosts().map((post) => (
          <div key={post.id}>
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-medium">
                      {post.author_email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{post.author_name || post.author_email}</span>
                      <Badge variant="outline" className="text-xs">
                        {post.author_role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
                
                {user?.role === 'teacher' && !post.is_approved && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprovePost(post.id, true)}
                      className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprovePost(post.id, false)}
                      className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-slate-300 mb-4">
                {post.content}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <span className="text-xs text-slate-400">
                  {getReplies(post.id).length} replies
                </span>
              </div>
            </GlassCard>

            {/* Reply Form */}
            {replyingTo === post.id && (
              <div className="ml-8 mt-4">
                <GlassCard className="p-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePostReply(post.id)}
                      disabled={posting || !replyContent.trim()}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {posting ? 'Posting...' : 'Post Reply'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Replies */}
            {getReplies(post.id).map((reply) => (
              <div key={reply.id} className="ml-8 mt-4">
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-xs font-medium">
                          {reply.author_email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{reply.author_name || reply.author_email}</span>
                          <Badge variant="outline" className="text-xs">
                            {reply.author_role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(reply.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === 'teacher' && !reply.is_approved && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovePost(reply.id, true)}
                          className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovePost(reply.id, false)}
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-slate-300 text-sm">
                    {reply.content}
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        ))}

        {getMainPosts().length === 0 && (
          <GlassCard className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Posts Yet</h3>
            <p className="text-slate-400 mb-4">Be the first to start the conversation!</p>
          </GlassCard>
        )}
      </div>

      {/* New Post Form */}
      {!discussion.is_locked && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add a Post</h3>
          <Textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts, ask questions, or start a discussion..."
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 mb-4"
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => handlePostReply()}
              disabled={posting || !newPost.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post Message'}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
