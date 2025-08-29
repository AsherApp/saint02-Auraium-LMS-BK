"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import { useMessagesFn } from "@/hooks/use-messages"
import { useToast } from "@/hooks/use-toast"
import { Search, Filter, Star, Archive, Trash2, Send, Reply, Forward, MoreVertical, Mail, MailOpen, Clock, User, BookOpen } from "lucide-react"

export default function StudentMessagesPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [showMessageDetails, setShowMessageDetails] = useState(false)
  const [newMessage, setNewMessage] = useState({
    to: "",
    subject: "",
    content: "",
    priority: "normal"
  })

  // Use the messages hook
  const { messages, loading, error, sendMessage, toggleStar, toggleArchive, bulkAction, searchMessages } = useMessagesFn(
    user?.email || undefined,
    user?.role || undefined
  )

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    // Ensure messages is always an array
    if (!Array.isArray(messages)) {
      return []
    }

    let filtered = [...messages] // Create a copy to avoid mutating the original

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.to?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(msg => {
        switch (filterStatus) {
          case "unread":
            return !msg.is_read
          case "starred":
            return msg.is_starred
          case "archived":
            return msg.is_archived
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "subject":
          return (a.subject || "").localeCompare(b.subject || "")
        case "priority":
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [messages, searchTerm, filterStatus, sortBy])

  const handleSendMessage = async () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await sendMessage({
        to: newMessage.to,
        subject: newMessage.subject,
        content: newMessage.content,
        priority: newMessage.priority as any
      })
      
      setNewMessage({ to: "", subject: "", content: "", priority: "normal" })
      setShowCompose(false)
      toast({ title: "Message sent successfully!" })
    } catch (error: any) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" })
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedMessages.length === 0) {
      toast({ title: "Please select messages first", variant: "destructive" })
      return
    }

    try {
      await bulkAction(selectedMessages, action)
      setSelectedMessages([])
      toast({ title: `Messages ${action} successfully!` })
    } catch (error: any) {
      toast({ title: `Failed to ${action} messages`, description: error.message, variant: "destructive" })
    }
  }

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        await searchMessages(searchTerm)
      } catch (error: any) {
        toast({ title: "Search failed", description: error.message, variant: "destructive" })
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "normal":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-white/10 text-slate-300 border-white/20"
    }
  }

  const getStatusIcon = (message: any) => {
    if (message.is_archived) return <Archive className="h-4 w-4 text-slate-400" />
    if (!message.is_read) return <Mail className="h-4 w-4 text-blue-400" />
    return <MailOpen className="h-4 w-4 text-slate-400" />
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading messages...</div>
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
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-slate-400">Manage your communications</p>
          </div>
          <Button 
            onClick={() => setShowCompose(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </GlassCard>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
            />
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 text-white border-white/10">
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Messages List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-col h-[600px]">
          {/* Messages Header */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMessages(filteredMessages.map(m => m.id))
                    } else {
                      setSelectedMessages([])
                    }
                  }}
                  className="rounded border-white/20 bg-white/5"
                />
                <span className="text-sm text-slate-400">
                  {selectedMessages.length > 0 ? `${selectedMessages.length} selected` : `${filteredMessages.length} messages`}
                </span>
              </div>
              
              {selectedMessages.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("star")}
                    className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 border-yellow-500/30"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Star
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("archive")}
                    className="bg-slate-600/20 text-slate-300 hover:bg-slate-600/30 border-slate-500/30"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("delete")}
                    className="bg-red-600/20 text-red-300 hover:bg-red-600/30 border-red-500/30"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${
                      !message.is_read ? 'bg-blue-500/10' : ''
                    }`}
                    onClick={() => {
                      setSelectedMessage(message)
                      setShowMessageDetails(true)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMessages(prev => [...prev, message.id])
                          } else {
                            setSelectedMessages(prev => prev.filter(id => id !== message.id))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-white/20 bg-white/5"
                      />
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(message)}
                        {message.is_starred && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                      </div>
                      
                      <Avatar className="h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {message.from?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {message.from === user?.email ? 'Me' : message.from}
                          </span>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 truncate">{message.subject}</p>
                        <p className="text-xs text-slate-400 truncate">{message.content}</p>
                      </div>
                      
                      <div className="text-xs text-slate-400 text-right">
                        <div>{new Date(message.created_at).toLocaleDateString()}</div>
                        <div>{new Date(message.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Compose Message Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription className="text-slate-300">
              Send a new message to your teacher or classmates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">To *</label>
              <Input
                value={newMessage.to}
                onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
                placeholder="Enter email address"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Subject *</label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Priority</label>
              <Select value={newMessage.priority} onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Message *</label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Type your message..."
                rows={6}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 focus:border-blue-500/50 resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCompose(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Details Dialog */}
      <Dialog open={showMessageDetails} onOpenChange={setShowMessageDetails}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {selectedMessage.from?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">
                      From: {selectedMessage.from === user?.email ? 'Me' : selectedMessage.from}
                    </p>
                    <p className="text-sm text-slate-400">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getPriorityColor(selectedMessage.priority)}>
                  {selectedMessage.priority}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">{selectedMessage.subject}</h3>
                <div className="bg-white/5 p-4 rounded-md">
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    toggleStar(selectedMessage.id)
                    setShowMessageDetails(false)
                  }}
                  className="bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30 border-yellow-500/30"
                >
                  <Star className="h-4 w-4 mr-2" />
                  {selectedMessage.is_starred ? 'Unstar' : 'Star'}
                </Button>
                <Button
                  onClick={() => {
                    toggleArchive(selectedMessage.id)
                    setShowMessageDetails(false)
                  }}
                  className="bg-slate-600/20 text-slate-300 hover:bg-slate-600/30 border-slate-500/30"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {selectedMessage.is_archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  onClick={() => setShowCompose(true)}
                  className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border-blue-500/30"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
