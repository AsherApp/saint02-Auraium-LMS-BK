"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  ThumbsDown,
  Reply,
  Flag,
  MoreHorizontal,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Share2,
  Bookmark,
  Edit,
  Trash2,
  Pin,
  Star
} from "lucide-react"

interface DiscussionSubmissionProps {
  post: string
  setPost: (post: string) => void
  replies: any[]
  setReplies: (replies: any[]) => void
  readOnly?: boolean
}

interface DiscussionReply {
  id: string
  content: string
  author: string
  timestamp: Date
  likes: number
  dislikes: number
  isLiked?: boolean
  isDisliked?: boolean
  replies?: DiscussionReply[]
}

export function DiscussionSubmission({ 
  post, 
  setPost, 
  replies, 
  setReplies, 
  readOnly = false 
}: DiscussionSubmissionProps) {
  const [newReply, setNewReply] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const handlePostSubmit = () => {
    if (post.trim()) {
      // In a real app, this would submit to the backend
      console.log("Discussion post submitted:", post)
    }
  }

  const handleReplySubmit = () => {
    if (newReply.trim()) {
      const reply: DiscussionReply = {
        id: Math.random().toString(36).substr(2, 9),
        content: newReply,
        author: "Current User",
        timestamp: new Date(),
        likes: 0,
        dislikes: 0
      }
      
      setReplies([...replies, reply])
      setNewReply("")
      setReplyingTo(null)
    }
  }

  const handleLike = (replyId: string) => {
    setReplies(replies.map(reply => {
      if (reply.id === replyId) {
        const wasLiked = reply.isLiked
        const wasDisliked = reply.isDisliked
        
        return {
          ...reply,
          likes: wasLiked ? reply.likes - 1 : reply.likes + 1,
          dislikes: wasDisliked ? reply.dislikes - 1 : reply.dislikes,
          isLiked: !wasLiked,
          isDisliked: false
        }
      }
      return reply
    }))
  }

  const handleDislike = (replyId: string) => {
    setReplies(replies.map(reply => {
      if (reply.id === replyId) {
        const wasLiked = reply.isLiked
        const wasDisliked = reply.isDisliked
        
        return {
          ...reply,
          likes: wasLiked ? reply.likes - 1 : reply.likes,
          dislikes: wasDisliked ? reply.dislikes - 1 : reply.dislikes + 1,
          isLiked: false,
          isDisliked: !wasDisliked
        }
      }
      return reply
    }))
  }

  const handleEditReply = (replyId: string, content: string) => {
    setEditingReply(replyId)
    setEditContent(content)
  }

  const handleSaveEdit = (replyId: string) => {
    setReplies(replies.map(reply => 
      reply.id === replyId 
        ? { ...reply, content: editContent }
        : reply
    ))
    setEditingReply(null)
    setEditContent("")
  }

  const handleDeleteReply = (replyId: string) => {
    setReplies(replies.filter(reply => reply.id !== replyId))
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Discussion Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Discussion Post</h3>
            <p className="text-slate-400 text-sm">Share your thoughts and engage with others</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-500 text-slate-300">
            {replies.length} replies
          </Badge>
        </div>
      </div>

      {/* Main Discussion Post */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-blue-500/20 text-blue-400">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium">You</span>
                <span className="text-slate-400 text-sm">•</span>
                <span className="text-slate-400 text-sm">{formatTimeAgo(new Date())}</span>
                <Badge className="bg-blue-500/20 text-blue-400">Original Post</Badge>
              </div>
              
              {!readOnly ? (
                <div className="space-y-4">
                  <Textarea
                    value={post}
                    onChange={(e) => setPost(e.target.value)}
                    placeholder="Share your thoughts, ask questions, or start a discussion..."
                    className="min-h-[120px] bg-slate-800/50 border-slate-600 text-white"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-sm">
                      {post.length} characters
                    </div>
                    
                    <Button
                      onClick={handlePostSubmit}
                      disabled={!post.trim()}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {post || "No discussion post available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Replies Section */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Replies ({replies.length})</h4>
            
            {!readOnly && (
              <Button
                variant="outline"
                onClick={() => setReplyingTo("main")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo && !readOnly && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback className="bg-green-500/20 text-green-400">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[80px] bg-slate-700/50 border-slate-600 text-white"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-sm">
                      {newReply.length} characters
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setNewReply("")
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleReplySubmit}
                        disabled={!newReply.trim()}
                        className="bg-blue-600/80 hover:bg-blue-600 text-white"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Replies List */}
          {replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/api/placeholder/32/32" />
                      <AvatarFallback className="bg-green-500/20 text-green-400">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-sm">{reply.author}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-400 text-xs">{formatTimeAgo(reply.timestamp)}</span>
                      </div>
                      
                      {editingReply === reply.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px] bg-slate-700/50 border-slate-600 text-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(reply.id)}
                              className="bg-green-600/80 hover:bg-green-600 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingReply(null)
                                setEditContent("")
                              }}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(reply.id)}
                                className={`p-1 h-6 ${
                                  reply.isLiked 
                                    ? 'text-blue-400 hover:text-blue-300' 
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <span className="text-slate-400 text-xs">{reply.likes}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDislike(reply.id)}
                                className={`p-1 h-6 ${
                                  reply.isDisliked 
                                    ? 'text-red-400 hover:text-red-300' 
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                              <span className="text-slate-400 text-xs">{reply.dislikes}</span>
                            </div>
                            
                            {!readOnly && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(reply.id)}
                                  className="p-1 h-6 text-slate-400 hover:text-slate-300"
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditReply(reply.id, reply.content)}
                                  className="p-1 h-6 text-slate-400 hover:text-slate-300"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteReply(reply.id)}
                                  className="p-1 h-6 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No replies yet</p>
              <p className="text-sm">Be the first to reply to this discussion</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Discussion Guidelines */}
      <GlassCard className="p-4">
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-medium mb-2">Discussion Guidelines</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Be respectful and constructive in your comments</li>
            <li>• Stay on topic and relevant to the assignment</li>
            <li>• Use proper grammar and clear language</li>
            <li>• Support your arguments with evidence when possible</li>
            <li>• Engage thoughtfully with other students' posts</li>
          </ul>
        </div>
      </GlassCard>
    </div>
  )
}
