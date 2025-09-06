"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { ChatWidget } from "@/components/live/chat-widget"
import { ParticipantsList } from "@/components/live/participants-list"
import { ResourceList } from "@/components/live/resource-list"
import { PollWidget } from "@/components/live/poll-widget"
import { ClassworkWidget } from "@/components/live/classwork-widget"
import { AttendanceWidget } from "@/components/live/attendance-widget"

import EnhancedVideo from "@/components/live/enhanced-video"
import { ArrowLeft, BookOpen, Users, FileText, MessageSquare, ClipboardList, RefreshCw } from "lucide-react"
import { http } from "@/services/http"
import { FluidTabs } from "@/components/ui/fluid-tabs"

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
  const [participantCount, setParticipantCount] = useState(0)
  
  useEffect(() => setMounted(true), [])

  // Fetch participant count
  const fetchParticipantCount = async () => {
    if (!sid) return
    try {
      const response = await http<any>(`/api/live/${sid}/participants`)
      setParticipantCount(response.items?.length || 0)
    } catch (error) {
      console.error('Failed to fetch participant count:', error)
    }
  }

  // Fetch session data and handle Zoom-like flow
  useEffect(() => {
    if (!sid || !user?.email) return
    
    let isMounted = true
    
    const fetchSessionAndJoin = async () => {
      try {
        const response = await http<any>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(response)
          // Fetch participant count when session loads
          fetchParticipantCount()
        }
        
        // Check if user can join based on role and session state
        const isTeacher = user?.role === 'teacher'
        const isSessionStarted = response.is_started
        const isSessionEnded = response.status === 'ended'
        
        // Teachers can join sessions even if not started, but won't auto-start
        // They need to manually start the session using the "Start Class" button

        // Teachers can always join (even if session not started)
        // Students can only join if session is started and not ended
        if (isTeacher || (isSessionStarted && !isSessionEnded)) {
          if (!hasJoined) {
            try {
              await http(`/api/live/${sid}/join`, { method: 'POST' })
              if (isMounted) {
                setHasJoined(true)
                // Update participant count after joining
                fetchParticipantCount()
              }
            } catch (joinErr: any) {
              console.log('Already joined or join failed:', joinErr)
              if (isMounted) {
                setHasJoined(true) // Assume we're already joined
                // Update participant count even if already joined
                fetchParticipantCount()
              }
            }
          }
        } else if (!isTeacher && !isSessionStarted) {
          // Student trying to join before teacher started
          if (isMounted) {
            setError('⏳ Waiting for teacher to start the class. Please wait for the teacher to click "Start Class"...')
            // Set up polling to check if teacher starts the session
            const pollForSessionStart = setInterval(async () => {
              try {
                const pollResponse = await http<any>(`/api/live/${sid}`)
                if (pollResponse.is_started && isMounted) {
                  clearInterval(pollForSessionStart)
                  setError(null)
                  // Retry joining
                  try {
                    await http(`/api/live/${sid}/join`, { method: 'POST' })
                    setHasJoined(true)
                    fetchParticipantCount()
                  } catch (joinErr) {
                    console.log('Join failed after session started:', joinErr)
                  }
                }
              } catch (pollErr) {
                console.log('Polling error:', pollErr)
              }
            }, 3000) // Poll every 3 seconds
            
            // Clean up polling when component unmounts
            return () => clearInterval(pollForSessionStart)
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
    
    // Set up polling to refresh session data every 15 seconds
    const interval = setInterval(async () => {
      if (!isMounted || !sid) return
      
      try {
        const response = await http<any>(`/api/live/${sid}`)
        if (isMounted) {
          setSession(response)
          
          // Update participant count during polling
          fetchParticipantCount()
          
          // If session is now started and user is student, try to join
          if (user?.role === 'student' && response.is_started && !hasJoined && response.status !== 'ended') {
            try {
              await http(`/api/live/${sid}/join`, { method: 'POST' })
              if (isMounted) {
                setHasJoined(true)
                setError(null) // Clear any previous error
                // Update participant count after joining
                fetchParticipantCount()
              }
            } catch (joinErr: any) {
              console.log('Join failed during polling:', joinErr)
            }
          }
        }
      } catch (err: any) {
        console.log('Failed to refresh session during polling:', err)
      }
    }, 15000) // Poll every 15 seconds
    
    // Leave session when component unmounts
    return () => {
      isMounted = false
      clearInterval(interval)
      if (sid && user?.email) {
        http(`/api/live/${sid}/leave`, { method: 'POST' }).catch(console.error)
      }
    }
  }, [sid, user?.email, user?.role]) // Remove hasJoined to prevent circular dependency

  const myEmail = user?.email || session?.teacher_email || "jane@student.edu"

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
                Host: {session.teacher_name || session.teacher_email?.split('@')[0] || 'Teacher'} • Starts {new Date(session.scheduled_at).toLocaleString()}
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
              Teacher: {session.teacher_name || session.teacher_email?.split('@')[0] || 'Teacher'}<br/>
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
              {session.status === "active" ? (
                // Video Mode
                <div className="h-full min-h-0 rounded-md overflow-hidden">
                  <EnhancedVideo 
                    roomId={session.id} 
                    name={myEmail}
                  />
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
            <GlassCard className="p-0 overflow-hidden">
              <FluidTabs
                tabs={[
                  { 
                    id: 'classwork', 
                    label: 'Classwork', 
                    icon: <BookOpen className="h-4 w-4" />, 
                    badge: 0 
                  },
                  { 
                    id: 'polls', 
                    label: 'Polls', 
                    icon: <ClipboardList className="h-4 w-4" />, 
                    badge: 0 
                  },
                  { 
                    id: 'resources', 
                    label: 'Resources', 
                    icon: <FileText className="h-4 w-4" />, 
                    badge: 0 
                  },
                  // Only show attendance tab for teachers/hosts
                  ...(isHost ? [{
                    id: 'attendance', 
                    label: 'Attendance', 
                    icon: <Users className="h-4 w-4" />, 
                    badge: 0 
                  }] : [])
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="default"
                width="content-match"
              />

              <div className="h-[200px] overflow-hidden">
                <div className={`h-full ${activeTab === 'classwork' ? 'block' : 'hidden'}`}>
                  <div className="h-full p-4">
                    <ClassworkWidget sessionId={session.id} isHost={!!isHost} />
                  </div>
                </div>

                <div className={`h-full ${activeTab === 'polls' ? 'block' : 'hidden'}`}>
                  <div className="h-full p-4">
                    <PollWidget sessionId={session.id} isHost={!!isHost} />
                  </div>
                </div>


                <div className={`h-full ${activeTab === 'resources' ? 'block' : 'hidden'}`}>
                  <div className="h-full p-4">
                    <ResourceList sessionId={session.id} myEmail={myEmail} canUpload={!!isHost} />
                  </div>
                </div>

                {/* Only show attendance content for teachers/hosts */}
                {isHost && (
                  <div className={`h-full ${activeTab === 'attendance' ? 'block' : 'hidden'}`}>
                    <div className="h-full p-4">
                      <AttendanceWidget sessionId={session.id} isHost={!!isHost} />
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

          </div>

          {/* Sidebar - Tabbed Participants and Chat */}
          <div className="w-80">
            <GlassCard className="p-0 overflow-hidden h-full">
              <FluidTabs
                tabs={[
                  { 
                    id: 'participants', 
                    label: 'Participants', 
                    icon: <Users className="h-4 w-4" />, 
                    badge: isHost ? participantCount : 0 
                  },
                  { 
                    id: 'chat', 
                    label: 'Chat', 
                    icon: <MessageSquare className="h-4 w-4" />, 
                    badge: 0 
                  }
                ]}
                activeTab={activeSidebar || 'participants'}
                onTabChange={setActiveSidebar}
                variant="default"
                width="content-match"
              />

              <div className="flex-1 overflow-hidden">
                <div className={`h-full ${(activeSidebar || 'participants') === 'participants' ? 'block' : 'hidden'}`}>
                  <div className="h-full p-3">
                    <ParticipantsList sessionId={session.id} session={session} isHost={!!isHost} />
                  </div>
                </div>

                <div className={`h-full ${(activeSidebar || 'participants') === 'chat' ? 'block' : 'hidden'}`}>
                  <div className="h-full p-3">
                    <ChatWidget sessionId={session.id} className="h-full" readOnly={session.status !== "active"} />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </main>
  )
}
