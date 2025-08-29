"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Video, Plus, Calendar, Clock, Users, Play, Loader2, Square, History, Zap, Clock3 } from "lucide-react"
import Link from "next/link"
import { useLiveSessionsFn } from "@/services/live/hook"
import { useCoursesFn } from "@/services/courses/hook"
import { http } from "@/services/http"

export default function TeacherLiveClass() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  // Use the live sessions hook
  const { sessions, loading, error, createSession, updateStatus } = useLiveSessionsFn(
    user?.email || undefined, 
    user?.role || undefined
  )
  
  // Get courses and modules for the dropdowns
  const { courses, loading: coursesLoading, error: coursesError } = useCoursesFn()
  const [selectedCourseModules, setSelectedCourseModules] = useState<any[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState("upcoming")
  
  // Form state for creating new session
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSession, setNewSession] = useState({
    session_type: "general" as "course" | "module" | "general",
    course_id: "",
    module_id: "",
    title: "",
    description: "",
    start_at: ""
  })

  const handleCreateSession = async () => {
    if (!user?.email || !newSession.title || !newSession.start_at) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    // Validate based on session type
    if (newSession.session_type === "course" && !newSession.course_id) {
      toast({ title: "Please select a course", variant: "destructive" })
      return
    }
    if (newSession.session_type === "module" && (!newSession.course_id || !newSession.module_id)) {
      toast({ title: "Please select both course and module", variant: "destructive" })
      return
    }
    
    try {
      await createSession({
        course_id: newSession.course_id || undefined,
        module_id: newSession.module_id || undefined,
        title: newSession.title,
        description: newSession.description,
        start_at: new Date(newSession.start_at).getTime(),
        session_type: newSession.session_type
      })
      
      toast({ title: "Live session created successfully!" })
      setShowCreateForm(false)
      setNewSession({ 
        session_type: "general", 
        course_id: "", 
        module_id: "", 
        title: "", 
        description: "", 
        start_at: "" 
      })
      setSelectedCourseModules([])
    } catch (err: any) {
      toast({ 
        title: "Failed to create live session", 
        description: err.message, 
        variant: "destructive" 
      })
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      console.log('Starting session:', sessionId)
      const response = await http(`/api/live/${sessionId}/start`, { method: 'POST' })
      console.log('Session start response:', response)
      toast({ title: "Session started! Students can now join." })
      // Refresh sessions
      window.location.reload()
    } catch (err: any) {
      toast({ 
        title: "Failed to start session", 
        description: err.message,
        variant: "destructive" 
      })
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      console.log('Ending session:', sessionId)
      const response = await http(`/api/live/${sessionId}/end`, { method: 'POST' })
      console.log('Session end response:', response)
      toast({ title: "Session ended." })
      // Refresh sessions
      window.location.reload()
    } catch (err: any) {
      toast({ 
        title: "Failed to end session", 
        description: err.message,
        variant: "destructive" 
      })
    }
  }

  const loadCourseModules = async (courseId: string) => {
    if (!courseId) {
      setSelectedCourseModules([])
      return
    }
    
    try {
      const response = await fetch(`http://localhost:4000/api/modules/course/${courseId}`, {
        headers: {
          'x-user-email': user?.email || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedCourseModules(data.items || [])
      } else {
        setSelectedCourseModules([])
      }
    } catch (err) {
      console.error('Error loading modules:', err)
      setSelectedCourseModules([])
    }
  }

  const handleSessionTypeChange = (type: "course" | "module" | "general") => {
    setNewSession(prev => ({
      ...prev,
      session_type: type,
      course_id: type === "general" ? "" : prev.course_id,
      module_id: type === "module" ? prev.module_id : ""
    }))
  }

  const handleCourseChange = (courseId: string) => {
    setNewSession(prev => ({
      ...prev,
      course_id: courseId,
      module_id: "" // Reset module when course changes
    }))
    loadCourseModules(courseId)
  }

  // Categorize sessions
  const upcomingSessions = sessions.filter(session => 
    session.status === 'scheduled' && new Date(session.startAt) > new Date()
  )
  
  const activeSessions = sessions.filter(session => 
    session.status === 'active'
  )
  
  const pastSessions = sessions.filter(session => 
    session.status === 'ended' || (session.status === 'scheduled' && new Date(session.startAt) < new Date())
  )

  const getStatusBadge = (session: any) => {
    const { status, isStarted } = session
    
    switch (status) {
      case 'scheduled':
        if (isStarted) {
          return <Badge variant="default" className="bg-green-600">Started</Badge>
        }
        return <Badge variant="secondary">Scheduled</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-600">Live</Badge>
      case 'ended':
        return <Badge variant="destructive">Ended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Session card component
  const SessionCard = ({ session }: { session: any }) => (
    <GlassCard key={session.id} className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/teacher/live-class/${session.id}`}>
              <h3 className="text-lg font-semibold text-white hover:text-blue-400 cursor-pointer transition-colors">
                {session.title}
              </h3>
            </Link>
            {getStatusBadge(session)}
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
              {session.sessionType}
            </Badge>
          </div>
          <p className="text-slate-400 mb-3">{session.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(session.startAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(session.startAt).toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {session.participants?.length || 0} participants
            </div>
          </div>
          {(session.courseTitle || session.moduleTitle) && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {session.courseTitle && (
                <span>Course: {session.courseTitle}</span>
              )}
              {session.moduleTitle && (
                <>
                  <span>•</span>
                  <span>Module: {session.moduleTitle}</span>
                </>
              )}
          </div>
        )}
        </div>
        
        <div className="flex gap-2">
          <Link href={`/teacher/live-class/${session.id}`}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              View Details
            </Button>
          </Link>
          
          {session.status === 'scheduled' && !session.isStarted && (
            <Button 
              onClick={() => handleStartSession(session.id)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Class
            </Button>
          )}
          {session.status === 'active' && (
            <div className="flex gap-2">
              <Link href={`/live/${session.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Video className="h-4 w-4 mr-2" />
                  Join Room
                </Button>
              </Link>
              <Button 
                onClick={() => handleEndSession(session.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="h-4 w-4 mr-2" />
                End
              </Button>
          </div>
        )}
        </div>
      </div>
    </GlassCard>
  )

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Classes</h1>
          <p className="text-slate-300">
            Create and manage your live teaching sessions.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Session
        </Button>
      </div>

      {error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full flex justify-center py-4">
          <TabsList className="bg-white/10">
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              <Clock3 className="h-4 w-4 mr-2" />
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Active ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
            >
              <History className="h-4 w-4 mr-2" />
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Upcoming Sessions Tab */}
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingSessions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Clock3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Sessions</h3>
              <p className="text-slate-400 mb-4">
                You don't have any scheduled sessions coming up.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule a Session
              </Button>
            </GlassCard>
          ) : (
            upcomingSessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="active" className="space-y-4 mt-6">
          {activeSessions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Sessions</h3>
              <p className="text-slate-400 mb-4">
                There are no live sessions currently running.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Video className="h-4 w-4 mr-2" />
                Start a Session
              </Button>
            </GlassCard>
          ) : (
            activeSessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </TabsContent>

        {/* Past Sessions Tab */}
        <TabsContent value="past" className="space-y-4 mt-6">
          {pastSessions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Past Sessions</h3>
              <p className="text-slate-400 mb-4">
                You haven't conducted any live sessions yet.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Session
              </Button>
            </GlassCard>
          ) : (
            pastSessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Create Session Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Live Session</DialogTitle>
            <DialogDescription className="text-slate-300">
              Schedule a new live session for your students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Session Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={newSession.session_type === "general" ? "default" : "outline"}
                  onClick={() => handleSessionTypeChange("general")}
                  className={newSession.session_type === "general" ? "bg-blue-600 text-white" : "border-white/20 text-white hover:bg-white/10"}
                >
                  General
                </Button>
                <Button
                  type="button"
                  variant={newSession.session_type === "course" ? "default" : "outline"}
                  onClick={() => handleSessionTypeChange("course")}
                  className={newSession.session_type === "course" ? "bg-blue-600 text-white" : "border-white/20 text-white hover:bg-white/10"}
                >
                  Course
          </Button>
                <Button
                  type="button"
                  variant={newSession.session_type === "module" ? "default" : "outline"}
                  onClick={() => handleSessionTypeChange("module")}
                  className={newSession.session_type === "module" ? "bg-blue-600 text-white" : "border-white/20 text-white hover:bg-white/10"}
                >
                  Module
          </Button>
      </div>
    </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newSession.session_type !== "general" && (
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-white font-medium">Course *</Label>
                  <Select 
                    value={newSession.course_id} 
                    onValueChange={handleCourseChange}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 text-white border-white/10">
                      {coursesLoading ? (
                        <SelectItem value="" disabled>Loading courses...</SelectItem>
                      ) : courses && courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title || "Untitled Course"}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No courses available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {newSession.session_type === "module" && (
                <div className="space-y-2">
                  <Label htmlFor="module" className="text-white font-medium">Module *</Label>
                  <Select 
                    value={newSession.module_id} 
                    onValueChange={(value) => setNewSession(prev => ({ ...prev, module_id: value }))}
                    disabled={!newSession.course_id}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                      <SelectValue placeholder={newSession.course_id ? "Select a module" : "Select course first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 text-white border-white/10">
                      {selectedCourseModules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white font-medium">Session Title *</Label>
          <Input
                  id="title"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                  placeholder="Enter session title"
          />
        </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_at" className="text-white font-medium">Start Time *</Label>
          <Input
                  id="start_at"
            type="datetime-local"
                  value={newSession.start_at}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_at: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white font-medium">Description</Label>
              <textarea
                id="description"
                value={newSession.description}
                onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 focus:border-blue-500/50 resize-none"
                placeholder="Describe what this session will cover..."
          />
        </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleCreateSession}
                disabled={loading || !newSession.title || !newSession.start_at}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
        </Button>
      </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  )
}
