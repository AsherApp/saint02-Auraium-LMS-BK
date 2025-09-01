"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatWidget } from "@/components/live/chat-widget"
import { ParticipantsList } from "@/components/live/participants-list"
import { ResourceList } from "@/components/live/resource-list"
import { PollWidget } from "@/components/live/poll-widget"
import { ClassworkWidget } from "@/components/live/classwork-widget"
import { AttendanceWidget } from "@/components/live/attendance-widget"

import { Whiteboard } from "@/components/live/whiteboard"
import { LiveVideo } from "@/components/live/live-video"
import { FallbackVideo } from "@/components/live/fallback-video"
import { LiveKitErrorBoundary } from "@/components/live/livekit-error-boundary"
import { ArrowLeft, DoorOpen, Mic, MicOff, MonitorUp, Radio, Timer, BookOpen, Users, FileText, MessageSquare, Palette, ClipboardList, Calendar, Video, Settings, Plus, Trash2, RefreshCw } from "lucide-react"
import { CustomLiveKitControls } from "@/components/live/custom-livekit-controls"
import { StableWhiteboard } from "@/components/live/stable-whiteboard"
import { http } from "@/services/http"

export default function LiveSessionPage() {
  const { sid } = useParams<{ sid: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  
  // Avoid SSR/CSR hydration mismatch by rendering only after mount
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [activeTab, setActiveTab] = useState("classwork")
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null)
  const [fullScreenWhiteboard, setFullScreenWhiteboard] = useState(false)
  
  useEffect(() => setMounted(true), [])

  // Fetch session data and handle Zoom-like flow
  useEffect(() => {
    if (!sid || !user?.email) return
    
    let isMounted = true
    
    const fetchSessionAndJoin = async () => {
      try {
        const response = await http<any>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(response)
        }
        
        // Check if user can join based on role and session state
        const isTeacher = user?.role === 'teacher'
        const isSessionStarted = response.is_started
        const isSessionEnded = response.status === 'ended'
        
        // Teachers can always join (even if session not started)
        // Students can only join if session is started and not ended
        if (isTeacher || (isSessionStarted && !isSessionEnded)) {
          if (!hasJoined) {
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
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load session")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchSessionAndJoin()
    
    // Set up polling to refresh session data every 5 seconds
    const interval = setInterval(async () => {
      if (!isMounted || !sid) return
      
      try {
        const response = await http<any>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(response)
          
          // If session is now started and user is student, try to join
          if (user?.role === 'student' && response.is_started && !hasJoined && response.status !== 'ended') {
            try {
              await http(`/api/live/${sid}/join`, { method: 'POST' })
              if (isMounted) {
                setHasJoined(true)
                setError(null) // Clear any previous error
              }
            } catch (joinErr: any) {
              console.log('Join failed during polling:', joinErr)
            }
          }
        }
      } catch (err: any) {
        console.log('Failed to refresh session during polling:', err)
      }
    }, 5000)
    
    // Leave session when component unmounts
    return () => {
      isMounted = false
      clearInterval(interval)
      if (sid && user?.email) {
        http(`/api/live/${sid}/leave`, { method: 'POST' }).catch(console.error)
      }
    }
  }, [sid, user?.email, user?.role, hasJoined])

  const myEmail = user?.email || session?.teacher_email || "jane@student.edu"

  const [micOn, setMicOn] = useState(true)
  const [startingSession, setStartingSession] = useState(false)
  const [endingSession, setEndingSession] = useState(false)

  const isHost = useMemo(() => session?.teacher_email?.toLowerCase() === myEmail.toLowerCase(), [session, myEmail])

  const handleStartSession = async () => {
    if (!sid) return
    setStartingSession(true)
    try {
      await http(`/api/live/${sid}/start`, { method: 'POST' })
      // Refresh session data
      const response = await http<any>(`/api/live/${sid}`)
      setSession(response)
    } catch (err: any) {
      console.error('Failed to start session:', err)
    } finally {
      setStartingSession(false)
    }
  }

  const handleEndSession = async () => {
    if (!sid) return
    setEndingSession(true)
    try {
      await http(`/api/live/${sid}/end`, { method: 'POST' })
      // Refresh session data
      const response = await http<any>(`/api/live/${sid}`)
      setSession(response)
    } catch (err: any) {
      console.error('Failed to end session:', err)
    } finally {
      setEndingSession(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Loading session...</div>
        </GlassCard>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-red-300">Error: {error}</div>
          <div className="flex gap-3 mt-3">
            <Button 
              variant="default" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-white/10 text-white hover:bg-white/20" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </GlassCard>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="p-4 md:p-6">
        <GlassCard className="p-6">
          <div className="text-slate-300">Live session not found.</div>
          <Button className="mt-3 bg-white/10 text-white hover:bg-white/20" onClick={() => router.back()}>
            Go back
          </Button>
        </GlassCard>
      </main>
    )
  }

  const statusBadgeClass =
          session.status === "active"
      ? "bg-emerald-600/30 text-emerald-100"
      : session.status === "scheduled"
        ? "bg-amber-600/30 text-amber-100"
        : "bg-white/10 text-slate-200"

  return (
    <main className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 max-w-full overflow-hidden">
      <GlassCard className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-300" />
                {session.title}
              </div>
              <div className="text-xs text-slate-400">
                Host: {session.teacher_email} • Starts {new Date(session.scheduled_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`border-white/10 ${statusBadgeClass}`}>
              {session.status}
            </Badge>
            
            {/* Teacher controls for starting/ending session */}
            {isHost && (
              <div className="flex gap-2">
                {!session.is_started && session.status === 'scheduled' && (
                  <Button
                    onClick={handleStartSession}
                    disabled={startingSession}
                    variant="success" size="sm"
                  >
                    {startingSession ? 'Starting...' : 'Start Class'}
                  </Button>
                )}
                
                {session.is_started && session.status === 'active' && (
                  <Button
                    onClick={handleEndSession}
                    disabled={endingSession}
                    variant="destructive" size="sm"
                  >
                    {endingSession ? 'Ending...' : 'End Class'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Show waiting message for students if session not started */}
      {!isHost && !session.is_started && session.status === 'scheduled' && (
        <GlassCard className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-semibold text-white">Waiting for Teacher</h2>
            <p className="text-slate-300">
              The teacher has not started this session yet. Please wait for the teacher to start the class.
            </p>
            <div className="text-sm text-slate-400">
              Session: {session.title}<br/>
              Teacher: {session.teacher_email}<br/>
              Scheduled: {new Date(session.scheduled_at).toLocaleString()}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Show session ended message */}
      {session.status === 'ended' && (
        <GlassCard className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🏁</div>
            <h2 className="text-xl font-semibold text-white">Session Ended</h2>
            <p className="text-slate-300">
              This live session has ended.
            </p>
            <Button 
              variant="secondary"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Main session interface - only show if session is active or user is teacher */}
      {(isHost || session.is_started) && session.status !== 'ended' && (
        <div className="flex gap-3 h-[calc(100vh-200px)]">
          {/* Main video area with custom controls */}
          <div className="flex-1 flex flex-col gap-3">
            <GlassCard className="p-2 flex-1 min-h-0 relative">
              {fullScreenWhiteboard ? (
                // Whiteboard Mode - Full screen whiteboard
                <div className="h-full min-h-0 rounded-md overflow-hidden bg-white">
                  <Whiteboard sessionId={session.id} isHost={!!isHost} />
                </div>
              ) : session.status === "active" ? (
                // Video Mode
                <div className="h-full min-h-0 rounded-md overflow-hidden">
                  <LiveKitErrorBoundary fallback={<FallbackVideo sessionId={session.id} myEmail={myEmail} session={session} />}>
                    <LiveVideo 
                      room={session.id} 
                      name={myEmail} 
                      session={session}
                      customControls={
                        <GlassCard className="p-3 bg-black/50 backdrop-blur border-white/20">
                          <CustomLiveKitControls
                            onToggleChat={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                            onToggleWhiteboard={() => setFullScreenWhiteboard(!fullScreenWhiteboard)}
                            onLeave={() => router.back()}
                          />
                        </GlassCard>
                      }
                    />
                  </LiveKitErrorBoundary>
                </div>
              ) : (
                <div className="h-full min-h-0 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <div className="text-4xl mb-4">📹</div>
                    <p>Video will be available when the session starts</p>
                  </div>
                </div>
              )}
            </GlassCard>



            {/* Tools Tab - Always show the tools tab */}
            (
              <GlassCard className="p-0 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-white/5 border-b border-white/10 rounded-none">
                    <TabsTrigger value="classwork" className="data-[state=active]:bg-white/10 rounded-none">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Classwork
                    </TabsTrigger>
                    <TabsTrigger value="polls" className="data-[state=active]:bg-white/10 rounded-none">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Polls
                    </TabsTrigger>
                    <TabsTrigger value="whiteboard" className="data-[state=active]:bg-white/10 rounded-none">
                      <Palette className="h-4 w-4 mr-1" />
                      Whiteboard
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="data-[state=active]:bg-white/10 rounded-none">
                      <FileText className="h-4 w-4 mr-1" />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="data-[state=active]:bg-white/10 rounded-none">
                      <Users className="h-4 w-4 mr-1" />
                      Student Attendance
                    </TabsTrigger>
                  </TabsList>

                  <div className="h-[200px] overflow-hidden">
                    <TabsContent value="classwork" className="h-full m-0 p-4">
                      <ClassworkWidget sessionId={session.id} isHost={!!isHost} />
                    </TabsContent>

                    <TabsContent value="polls" className="h-full m-0 p-4">
                      <PollWidget sessionId={session.id} isHost={!!isHost} />
                    </TabsContent>

                    <TabsContent value="whiteboard" className="h-full m-0 p-4">
                      <div className="h-full flex flex-col" style={{ minHeight: '200px', maxHeight: '200px' }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-medium">Interactive Whiteboard</h3>
                          <Button
                            size="sm"
                            onClick={() => setFullScreenWhiteboard(true)}
                            variant="default"
                          >
                            <Palette className="h-4 w-4 mr-1" />
                            Open Full Screen
                          </Button>
                        </div>
                        <div className="flex-1 bg-white rounded-lg overflow-hidden" style={{ height: '150px' }}>
                          <Whiteboard sessionId={session.id} isHost={!!isHost} />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="resources" className="h-full m-0 p-4">
                      <ResourceList sessionId={session.id} myEmail={myEmail} canUpload={!!isHost} />
                    </TabsContent>

                    <TabsContent value="attendance" className="h-full m-0 p-4">
                      <AttendanceWidget sessionId={session.id} isHost={!!isHost} />
                    </TabsContent>
                  </div>
                </Tabs>
              </GlassCard>
            )

            {/* Whiteboard Controls - Show when in full-screen whiteboard mode */}
            {fullScreenWhiteboard && (
              <GlassCard className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFullScreenWhiteboard(false)}
                      className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Tools
                    </Button>
                    <span className="text-white font-medium">Whiteboard Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* Clear whiteboard */}}
                      className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar - Tabbed Participants and Chat */}
          <div className="w-80">
            <GlassCard className="p-0 overflow-hidden h-full">
              <Tabs value={activeSidebar || 'participants'} onValueChange={setActiveSidebar} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border-b border-white/10 rounded-none">
                  <TabsTrigger value="participants" className="data-[state=active]:bg-white/10 rounded-none">
                    <Users className="h-4 w-4 mr-1" />
                    Participants
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="data-[state=active]:bg-white/10 rounded-none">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="participants" className="h-full m-0 p-3">
                    <ParticipantsList sessionId={session.id} session={session} />
                  </TabsContent>

                  <TabsContent value="chat" className="h-full m-0 p-3">
                    <ChatWidget sessionId={session.id} className="h-full" readOnly={session.status !== "active"} />
                  </TabsContent>
                </div>
              </Tabs>
            </GlassCard>
          </div>
        </div>
      )}
    </main>
  )
}
