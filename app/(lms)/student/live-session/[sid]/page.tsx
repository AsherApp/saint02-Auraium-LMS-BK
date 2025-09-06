"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { dateUtils } from "@/utils/date-utils"
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare, 
  ClipboardList, 
  Play,
  Download,
  Calendar,
  Clock,
  User,
  Video,
  FileVideo,
  Bookmark,
  BookmarkCheck,
  Eye,
  ThumbsUp,
  Share2,
  ExternalLink,
  Activity,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  GraduationCap,
  Trophy,
  Star,
  Heart,
  MessageCircle,
  StickyNote,
  FileImage,
  File,
  Link as LinkIcon,
  BarChart3,
  TrendingUp,
  Users2,
  CalendarDays,
  Timer,
  Zap,
  Lightbulb,
  Brain,
  BookmarkPlus,
  BookmarkMinus
} from "lucide-react"

// Using centralized date utilities

interface LiveSession {
  id: string
  title: string
  description?: string
  course_id: string
  course_title: string
  teacher_email: string
  teacher_name?: string
  start_time: string
  end_time?: string
  duration?: number
  status: 'scheduled' | 'active' | 'ended' | 'cancelled'
  max_participants?: number
  recording_url?: string
  thumbnail_url?: string
  resources?: any[]
  chat_messages?: any[]
  participants?: any[]
  polls?: any[]
  classwork?: any[]
  attendance?: any[]
  notes?: any[]
  created_at: string
  updated_at: string
}

interface Recording {
  id: string
  title: string
  description?: string
  session_id: string
  course_id: string
  course_title: string
  teacher_email: string
  teacher_name?: string
  duration: number
  file_size: number
  file_url: string
  thumbnail_url?: string
  recorded_at: string
  view_count: number
  is_bookmarked: boolean
  tags: string[]
  quality: string
  format: string
}

export default function LiveSessionViewPage() {
  const { sid } = useParams<{ sid: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [session, setSession] = useState<LiveSession | null>(null)
  const [recording, setRecording] = useState<Recording | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [hasJoined, setHasJoined] = useState(false)
  const [joining, setJoining] = useState(false)

  // Fetch session data and handle join logic
  useEffect(() => {
    if (!sid || !user?.email) return
    
    let isMounted = true
    
    const fetchSessionData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch session details
        const sessionResponse = await http<LiveSession>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(sessionResponse)
        }
        
        // Check if user can join based on role and session state
        const isTeacher = user?.role === 'teacher'
        const isSessionStarted = sessionResponse.is_started
        const isSessionEnded = sessionResponse.status === 'ended'
        
        // Teachers can always join (even if session not started)
        // Students can only join if session is started and not ended
        if (isTeacher || (isSessionStarted && !isSessionEnded)) {
          if (!hasJoined && isMounted) {
            try {
              await http(`/api/live/${sid}/join`, { method: 'POST' })
              if (isMounted) {
                setHasJoined(true)
              }
            } catch (joinErr: any) {
              console.log('Already joined or join failed:', joinErr)
              if (isMounted) {
                setHasJoined(true) // Assume we're already joined
              }
            }
          }
        } else if (!isTeacher && !isSessionStarted) {
          // Student trying to join before teacher started
          if (isMounted) {
            setError('The teacher has not started this session yet. Please wait for the teacher to start the class.')
          }
        } else if (isSessionEnded) {
          // Session has ended
          if (isMounted) {
            setError('This session has ended.')
          }
        }
        
        // Fetch recording if available
        try {
          const recordingResponse = await http<Recording>(`/api/recordings/session/${sid}`)
          if (isMounted) {
            setRecording(recordingResponse)
          }
        } catch (recordingError) {
          // Recording might not exist yet, that's okay
          console.log('No recording available yet')
        }
        
      } catch (err: any) {
        console.error('Error fetching session data:', err)
        if (isMounted) {
          setError(err.message || "Failed to load session data")
          toast({
            title: "Error",
            description: err.message || "Failed to load session data",
            variant: "destructive"
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchSessionData()
    
    // Set up polling to refresh session data every 5 seconds
    const interval = setInterval(async () => {
      if (!isMounted || !sid) return
      
      try {
        const sessionResponse = await http<LiveSession>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(sessionResponse)
          
          // Check if session status changed
          const isTeacher = user?.role === 'teacher'
          const isSessionStarted = sessionResponse.is_started
          const isSessionEnded = sessionResponse.status === 'ended'
          
          if (!isTeacher && isSessionStarted && !hasJoined && !isSessionEnded) {
            // Teacher started the session, student can now join
            setError(null)
            try {
              await http(`/api/live/${sid}/join`, { method: 'POST' })
              if (isMounted) {
                setHasJoined(true)
              }
            } catch (joinErr: any) {
              console.log('Join failed:', joinErr)
            }
          }
        }
      } catch (err) {
        console.log('Polling error:', err)
      }
    }, 5000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [sid, user?.email, user?.role, hasJoined, toast])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusColor = (status: string, isStarted?: boolean) => {
    if (status === 'active' && isStarted) {
      return 'bg-red-500/20 text-red-400 border-red-500/30' // Red when teacher started
    }
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'ended': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'scheduled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />
      case 'ended': return <CheckCircle className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading session data...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Session Not Found</h2>
          <p className="text-white/70 mb-6">{error || "The session you're looking for doesn't exist or you don't have access to it."}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900">
      <div className="container-responsive py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{session.title}</h1>
              <p className="text-white/70">{session.course_title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(session.status, session.is_started)} border`}>
              {getStatusIcon(session.status)}
              <span className="ml-2 capitalize">
                {session.status === 'active' && session.is_started ? 'Live' : session.status}
              </span>
            </Badge>
            
            {/* Join button for students when session is started */}
            {user?.role === 'student' && session.is_started && session.status === 'active' && !hasJoined && (
              <Button 
                onClick={async () => {
                  setJoining(true)
                  try {
                    await http(`/api/live/${sid}/join`, { method: 'POST' })
                    setHasJoined(true)
                    toast({
                      title: "Success",
                      description: "You have joined the live session!",
                      variant: "default"
                    })
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description: err.message || "Failed to join session",
                      variant: "destructive"
                    })
                  } finally {
                    setJoining(false)
                  }
                }}
                disabled={joining}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                {joining ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Join Live Class
                  </>
                )}
              </Button>
            )}
            
            {recording && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Recording
              </Button>
            )}
          </div>
        </div>

        {/* Show waiting message for students if session not started */}
        {user?.role === 'student' && !session.is_started && session.status === 'scheduled' && (
          <GlassCard className="p-6 text-center mb-6">
            <div className="space-y-4">
              <div className="text-4xl">⏳</div>
              <h2 className="text-xl font-semibold text-white">Waiting for Teacher</h2>
              <p className="text-slate-300">
                The teacher has not started this session yet. Please wait for the teacher to start the class.
              </p>
              <div className="text-sm text-slate-400">
                Session: {session.title}<br/>
                Teacher: {session.teacher_name || session.teacher_email?.split('@')[0] || 'Teacher'}<br/>
                Scheduled: {dateUtils.full(session.start_time)}
              </div>
              <div className="text-xs text-slate-500 mt-4">
                You will be automatically notified when the teacher starts the class.
              </div>
            </div>
          </GlassCard>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Overview */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Session Overview</h2>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  {dateUtils.short(session.start_time)}
                </div>
              </div>
              
              {session.description && (
                <p className="text-white/80 mb-4">{session.description}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-white/70">Duration</p>
                  <p className="font-semibold text-white">
                    {session.duration ? formatDuration(session.duration) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Users className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-white/70">Participants</p>
                  <p className="font-semibold text-white">
                    {session.participants?.length || 0}
                    {session.max_participants && ` / ${session.max_participants}`}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white/70">Messages</p>
                  <p className="font-semibold text-white">
                    {session.chat_messages?.length || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-white/70">Activities</p>
                  <p className="font-semibold text-white">
                    {(session.polls?.length || 0) + (session.classwork?.length || 0)}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Recording Section */}
            {recording && (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Session Recording</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle bookmark
                        toast({
                          title: recording.is_bookmarked ? "Removed from bookmarks" : "Added to bookmarks",
                          description: recording.is_bookmarked ? "Recording removed from your bookmarks" : "Recording added to your bookmarks"
                        })
                      }}
                    >
                      {recording.is_bookmarked ? (
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                      ) : (
                        <Bookmark className="h-4 w-4 mr-2" />
                      )}
                      {recording.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4 mb-4">
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    {recording.thumbnail_url ? (
                      <img 
                        src={recording.thumbnail_url} 
                        alt="Recording thumbnail" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Video className="h-12 w-12 text-white/50 mx-auto mb-2" />
                        <p className="text-white/70">Recording Preview</p>
                      </div>
                    )}
                    <Button className="absolute" size="lg">
                      <Play className="h-6 w-6 mr-2" />
                      Play Recording
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-white/70">Duration</p>
                      <p className="font-semibold text-white">{formatDuration(recording.duration)}</p>
                    </div>
                    <div>
                      <p className="text-white/70">File Size</p>
                      <p className="font-semibold text-white">{formatFileSize(recording.file_size)}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Views</p>
                      <p className="font-semibold text-white">{recording.view_count}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Quality</p>
                      <p className="font-semibold text-white capitalize">{recording.quality}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Tabs for detailed content */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="w-full flex justify-center py-4">
                <FluidTabs
                  tabs={[
                    { 
                      id: 'overview', 
                      label: 'Overview', 
                      icon: <BarChart3 className="h-4 w-4" />
                    },
                    { 
                      id: 'chat', 
                      label: 'Chat History', 
                      icon: <MessageSquare className="h-4 w-4" />
                    },
                    { 
                      id: 'activities', 
                      label: 'Activities', 
                      icon: <ClipboardList className="h-4 w-4" />
                    },
                    { 
                      id: 'resources', 
                      label: 'Resources', 
                      icon: <FileText className="h-4 w-4" />
                    }
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  className="w-full"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <TabsContent value="overview" className="p-6">
                  <div className="space-y-6">
                    {/* Session Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Session Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/70">Duration</span>
                            <span className="text-blue-400 font-semibold">
                              {session.duration ? `${session.duration} minutes` : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/70">Status</span>
                            <span className={`font-semibold capitalize ${
                              session.status === 'active' ? 'text-green-400' :
                              session.status === 'ended' ? 'text-blue-400' :
                              session.status === 'scheduled' ? 'text-yellow-400' :
                              'text-gray-400'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <div className="flex-1">
                            <p className="text-white font-medium">Start Time</p>
                            <p className="text-white/70 text-sm">
                              {dateUtils.full(session.start_time)}
                            </p>
                          </div>
                        </div>
                        {session.end_time && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">End Time</p>
                              <p className="text-white/70 text-sm">
                                {dateUtils.full(session.end_time)}
                              </p>
                            </div>
                          </div>
                        )}
                        {session.description && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <FileText className="h-4 w-4 text-purple-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">Description</p>
                              <p className="text-white/70 text-sm">{session.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="chat" className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {session.chat_messages?.length ? (
                      session.chat_messages.map((message, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <div className="h-full w-full bg-blue-500/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-400" />
                            </div>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{message.sender_name || 'Anonymous'}</span>
                              <span className="text-white/50 text-sm">{dateUtils.time(message.timestamp)}</span>
                            </div>
                            <p className="text-white/80">{message.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70">No chat messages in this session</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="activities" className="p-6">
                  <div className="space-y-4">
                    {/* Polls */}
                    {session.polls?.length ? (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Polls</h3>
                        <div className="space-y-3">
                          {session.polls.map((poll, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg">
                              <h4 className="font-medium text-white mb-2">{poll.question}</h4>
                              <div className="space-y-2">
                                {poll.options?.map((option: any, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center justify-between">
                                    <span className="text-white/80">{option.text}</span>
                                    <div className="flex items-center gap-2">
                                      <Progress value={option.votes / poll.total_votes * 100} className="w-20 h-2" />
                                      <span className="text-white/70 text-sm">{option.votes}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Classwork */}
                    {session.classwork?.length ? (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Classwork</h3>
                        <div className="space-y-3">
                          {session.classwork.map((work, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg">
                              <h4 className="font-medium text-white mb-2">{work.title}</h4>
                              <p className="text-white/80 mb-3">{work.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{work.type}</Badge>
                                <span className="text-white/70 text-sm">
                                  {work.completed ? 'Completed' : 'Not completed'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {!session.polls?.length && !session.classwork?.length && (
                      <div className="text-center py-8">
                        <ClipboardList className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70">No activities in this session</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="resources" className="p-6">
                  <div className="space-y-4">
                    {session.resources?.length ? (
                      session.resources.map((resource, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            {resource.type === 'pdf' ? (
                              <FileText className="h-5 w-5 text-blue-400" />
                            ) : resource.type === 'image' ? (
                              <FileImage className="h-5 w-5 text-green-400" />
                            ) : (
                              <File className="h-5 w-5 text-white/70" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{resource.name}</h4>
                            <p className="text-white/70 text-sm">{resource.description}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70">No resources shared in this session</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </GlassCard>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Teacher Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Instructor</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <div className="h-full w-full bg-blue-500/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{session.teacher_name || session.teacher_email?.split('@')[0] || 'Instructor'}</p>
                  {session.teacher_name && (
                    <p className="text-white/70 text-sm">{session.teacher_email}</p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Session Details */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-white/70 text-sm">Date</p>
                    <p className="text-white">{dateUtils.short(session.start_time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-white/70 text-sm">Time</p>
                    <p className="text-white">
                      {dateUtils.time(session.start_time)} - 
                      {session.end_time ? dateUtils.time(session.end_time) : 'Ongoing'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-white/70" />
                  <div>
                    <p className="text-white/70 text-sm">Course</p>
                    <p className="text-white">{session.course_title}</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Course
                </Button>
                <Button className="w-full" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Instructor
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Notes
                </Button>
                <Button className="w-full" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Session
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
