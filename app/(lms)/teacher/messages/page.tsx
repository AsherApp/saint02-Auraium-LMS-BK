"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import { useMessagesFn } from "@/services/messages/hook"
import { useToast } from "@/hooks/use-toast"
import { 
  MessageSquare, 
  Send, 
  Search, 
  Mail, 
  Reply, 
  Trash2, 
  User, 
  Clock, 
  Filter,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Smile,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Video,
  FileText,
  Inbox,
  Send as SendIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Trash2 as TrashIcon,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Users,
  Calendar,
  Tag,
  Bookmark,
  BookmarkPlus
} from "lucide-react"

interface Message {
  id: string
  from_email: string
  to_email: string
  subject: string
  content: string
  read: boolean
  starred: boolean
  archived: boolean
  priority: 'low' | 'normal' | 'high'
  thread_id?: string
  parent_id?: string
  attachments?: any[]
  created_at: string
  updated_at: string
}

interface Conversation {
  id: string
  participants: string[]
  last_message: Message
  unread_count: number
  messages: Message[]
}

export default function TeacherMessages() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { 
    messages, 
    unreadCount, 
    loading, 
    error, 
    sendMessage, 
    markAsRead, 
    deleteMessage 
  } = useMessagesFn()
  
  // State management
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "archived">("all")
  const [sortBy, setSortBy] = useState<"date" | "sender" | "subject" | "priority">("date")
  const [viewMode, setViewMode] = useState<"conversations" | "messages">("conversations")
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    content: "",
    priority: "normal" as "low" | "normal" | "high",
    attachments: [] as any[]
  })

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Group messages into conversations
  const conversations = useMemo(() => {
    const conversationMap = new Map<string, Conversation>()
    
    messages.forEach(message => {
      const otherParticipant = message.from_email === user?.email ? message.to_email : message.from_email
      const conversationId = [user?.email, otherParticipant].sort().join('_')
      
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          participants: [user?.email!, otherParticipant],
          last_message: message,
          unread_count: 0,
          messages: []
        })
      }
      
      const conversation = conversationMap.get(conversationId)!
      conversation.messages.push(message)
      
      if (!message.read && message.from_email !== user?.email) {
        conversation.unread_count++
      }
      
      if (new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
        conversation.last_message = message
      }
    })
    
    return Array.from(conversationMap.values())
  }, [messages, user?.email])

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv => {
      const matchesSearch = conv.participants.some(p => 
        p.toLowerCase().includes(searchQuery.toLowerCase())
      ) || conv.last_message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
         conv.last_message.content.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filter === "all" || 
                           (filter === "unread" && conv.unread_count > 0) ||
                           (filter === "starred" && conv.last_message.starred) ||
                           (filter === "archived" && conv.last_message.archived)
      
      return matchesSearch && matchesFilter
    })

    // Sort conversations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
        case "sender":
          return a.participants[1].localeCompare(b.participants[1])
        case "subject":
          return a.last_message.subject.localeCompare(b.last_message.subject)
        case "priority":
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          return priorityOrder[b.last_message.priority] - priorityOrder[a.last_message.priority]
        default:
          return 0
      }
    })

    return filtered
  }, [conversations, searchQuery, filter, sortBy])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation?.messages])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            setComposeOpen(true)
            break
          case 'f':
            e.preventDefault()
            searchInputRef.current?.focus()
            break
          case 'r':
            e.preventDefault()
            if (selectedConversation) {
              setReplyTo(selectedConversation.last_message)
              setComposeOpen(true)
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedConversation])

  const handleSendMessage = async () => {
    try {
      await sendMessage({
        to_email: composeData.to,
        subject: composeData.subject,
        content: composeData.content,
        priority: composeData.priority,
        attachments: composeData.attachments
      })
      
      toast({ title: "Message sent successfully" })
      setComposeOpen(false)
      setComposeData({ to: "", subject: "", content: "", priority: "normal", attachments: [] })
      setReplyTo(null)
    } catch (err: any) {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" })
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markAsRead(messageId)
    } catch (err: any) {
      toast({ title: "Failed to mark message as read", description: err.message, variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      toast({ title: "Message deleted" })
    } catch (err: any) {
      toast({ title: "Failed to delete message", description: err.message, variant: "destructive" })
    }
  }

  const handleBulkAction = async (action: 'read' | 'unread' | 'star' | 'archive' | 'delete') => {
    try {
      // Implement bulk actions
      toast({ title: `Bulk ${action} completed` })
      setSelectedMessages([])
    } catch (err: any) {
      toast({ title: `Failed to ${action} messages`, description: err.message, variant: "destructive" })
    }
  }

  if (loading && messages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-slate-300">
            {unreadCount > 0 ? `${unreadCount} unread messages` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Send className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {replyTo ? `Reply to ${replyTo.from_email}` : "Compose New Message"}
                </DialogTitle>
              </DialogHeader>
              <ComposeMessageForm 
                data={composeData}
                setData={setComposeData}
                replyTo={replyTo}
                onSend={handleSendMessage}
                onCancel={() => {
                  setComposeOpen(false)
                  setReplyTo(null)
                  setComposeData({ to: "", subject: "", content: "", priority: "normal", attachments: [] })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-white/10">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/10 border-white/20 text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/10 border-white/20 text-white">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="sender">Sender</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedMessages.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-600/20 rounded-lg">
                <span className="text-sm text-blue-300">{selectedMessages.length} selected</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleBulkAction('read')} className="h-6 px-2 text-xs">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleBulkAction('star')} className="h-6 px-2 text-xs">
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleBulkAction('archive')} className="h-6 px-2 text-xs">
                    <Archive className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleBulkAction('delete')} className="h-6 px-2 text-xs text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Messages</h3>
                <p className="text-slate-400">
                  {searchQuery ? "No conversations match your search." : "Your inbox is empty."}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onSelect={() => setSelectedConversation(conversation)}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteMessage}
                  currentUser={user?.email}
                />
              ))
            )}
          </div>
        </div>

        {/* Main Content - Message Thread */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteMessage}
              currentUser={user?.email}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                <p className="text-slate-400">Choose a conversation from the sidebar to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Conversation Item Component
function ConversationItem({ 
  conversation, 
  isSelected, 
  onSelect, 
  onMarkAsRead, 
  onDelete, 
  currentUser 
}: {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
  onMarkAsRead: (messageId: string) => void
  onDelete: (messageId: string) => void
  currentUser?: string
}) {
  const otherParticipant = conversation.participants.find(p => p !== currentUser) || ''
  const lastMessage = conversation.last_message

  return (
    <div
      className={`p-4 cursor-pointer transition-colors border-b border-white/5 ${
        isSelected 
          ? "bg-white/10 border-l-4 border-l-blue-500" 
          : "hover:bg-white/5"
      } ${conversation.unread_count > 0 ? "border-l-4 border-l-blue-500" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src="" />
          <AvatarFallback className="bg-blue-600/20 text-blue-400">
            {otherParticipant.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-medium truncate">{otherParticipant}</h3>
            <div className="flex items-center gap-1">
              {conversation.unread_count > 0 && (
                <Badge variant="default" className="text-xs bg-blue-600">
                  {conversation.unread_count}
                </Badge>
              )}
              {lastMessage.starred && (
                <Star className="h-3 w-3 text-yellow-400" />
              )}
              {lastMessage.priority === "high" && (
                <Badge variant="destructive" className="text-xs">High</Badge>
              )}
            </div>
          </div>
          
          <p className="text-slate-300 font-medium text-sm truncate mb-1">
            {lastMessage.subject}
          </p>
          
          <p className="text-slate-400 text-xs truncate mb-2">
            {lastMessage.content}
          </p>
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{new Date(lastMessage.created_at).toLocaleDateString()}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle star toggle
                }}
              >
                <Star className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle archive
                }}
              >
                <Archive className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Thread Component
function MessageThread({ 
  conversation, 
  onSendMessage, 
  onMarkAsRead, 
  onDelete, 
  currentUser,
  messagesEndRef 
}: {
  conversation: Conversation
  onSendMessage: (data: any) => void
  onMarkAsRead: (messageId: string) => void
  onDelete: (messageId: string) => void
  currentUser?: string
  messagesEndRef: React.RefObject<HTMLDivElement>
}) {
  const [replyContent, setReplyContent] = useState("")
  const otherParticipant = conversation.participants.find(p => p !== currentUser) || ''

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendMessage({
        to_email: otherParticipant,
        subject: `Re: ${conversation.last_message.subject}`,
        content: replyContent,
        priority: "normal",
        attachments: []
      })
      setReplyContent("")
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-600/20 text-blue-400">
                {otherParticipant.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-medium">{otherParticipant}</h3>
              <p className="text-slate-400 text-sm">{conversation.messages.length} messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              Participants
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.from_email === currentUser}
            onMarkAsRead={() => onMarkAsRead(message.id)}
            onDelete={() => onDelete(message.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              className="w-full min-h-[60px] px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendReply()
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendReply}
              disabled={!replyContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  isOwn, 
  onMarkAsRead, 
  onDelete 
}: {
  message: Message
  isOwn: boolean
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  useEffect(() => {
    if (!message.read && !isOwn) {
      onMarkAsRead()
    }
  }, [message.read, isOwn, onMarkAsRead])

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'bg-blue-600/20' : 'bg-white/10'} rounded-lg p-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">{message.from_email}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
            {message.priority === "high" && (
              <Badge variant="destructive" className="text-xs">High</Badge>
            )}
            {!isOwn && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-white text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs text-slate-400 mb-1">Attachments:</div>
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-blue-400">
                <Paperclip className="h-3 w-3" />
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Compose Message Form
function ComposeMessageForm({ 
  data, 
  setData, 
  replyTo, 
  onSend, 
  onCancel 
}: {
  data: any
  setData: (data: any) => void
  replyTo: Message | null
  onSend: () => void
  onCancel: () => void
}) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showStudentList, setShowStudentList] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const studentDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (replyTo) {
      setData({
        ...data,
        to: replyTo.from_email,
        subject: `Re: ${replyTo.subject}`,
        content: `\n\n--- Original Message ---\n${replyTo.content}`
      })
    }
  }, [replyTo])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative" ref={studentDropdownRef}>
            <label className="text-sm font-medium text-slate-300">To:</label>
            <div className="relative">
              <Input
                value={data.to}
                onChange={(e) => {
                  setData({ ...data, to: e.target.value })
                  setSearchTerm(e.target.value)
                  setShowStudentList(true)
                }}
                onFocus={() => setShowStudentList(true)}
                placeholder="Search enrolled students..."
                className="mt-1 bg-white/5 border-white/10 text-white pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowStudentList(!showStudentList)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Student Dropdown with proper z-index */}
            {showStudentList && (
              <div className="absolute z-[9999] w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                {loadingStudents ? (
                  <div className="p-3 text-center text-slate-400">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-3 text-center text-slate-400">No students found</div>
                ) : (
                  <div className="py-1">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setData({ ...data, to: student.student_email })
                          setShowStudentList(false)
                          setSearchTerm("")
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 text-white text-sm flex flex-col"
                      >
                        <span className="font-medium">{student.student_name || 'Unknown Student'}</span>
                        <span className="text-slate-400 text-xs">{student.student_email}</span>
                        <span className="text-slate-500 text-xs">{student.course_title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Priority:</label>
            <Select value={data.priority} onValueChange={(value) => setData({ ...data, priority: value })}>
              <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20 text-white z-[9999]">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      
      <div>
        <label className="text-sm font-medium text-slate-300">Subject:</label>
        <Input
          value={data.subject}
          onChange={(e) => setData({ ...data, subject: e.target.value })}
          placeholder="Message subject"
          className="mt-1 bg-white/5 border-white/10 text-white"
          required
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Message:</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(!showToolbar)}
            className="text-slate-400 hover:text-white"
          >
            {showToolbar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Formatting
          </Button>
        </div>
        
        {showToolbar && (
          <div className="flex items-center gap-1 p-2 bg-white/5 rounded-t-lg border border-white/10">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <textarea
          value={data.content}
          onChange={(e) => setData({ ...data, content: e.target.value })}
          placeholder="Type your message here..."
          className={`w-full h-48 px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-slate-400 resize-none ${
            showToolbar ? 'rounded-b-lg' : 'rounded-lg'
          }`}
          required
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
            <Paperclip className="h-4 w-4 mr-2" />
            Attach Files
          </Button>
          <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
            <Smile className="h-4 w-4 mr-2" />
            Emoji
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button 
            onClick={onSend}
            disabled={!data.to || !data.subject || !data.content}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
} 