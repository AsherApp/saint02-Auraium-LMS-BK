"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { dateUtils } from "@/utils/date-utils"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Video,
  Award,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Play,
  FileText,
  GraduationCap
} from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  event_type: 'class' | 'office_hours' | 'study_group' | 'exam' | 'assignment_due' | 'other' | 'live_class'
  start_time: string
  end_time: string
  all_day: boolean
  location?: string
  course_id?: string
  course?: { title: string }
  color: string
  is_public: boolean
  requires_rsvp: boolean
  created_by: string
  created_at: string
  updated_at: string
  is_assignment?: boolean
  assignment_id?: string
  points?: number
  type?: string
  // Live session specific fields
  is_live_session?: boolean
  live_session_id?: string
  live_session_status?: string
  live_session_host?: string
}

interface EventParticipant {
  id: string
  event_id: string
  participant_email: string
  role: 'host' | 'invited' | 'attendee'
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'maybe'
  attended?: boolean
  created_at: string
}

export default function StudentCalendar() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch both events and live sessions
      const [eventsResponse, liveSessionsResponse] = await Promise.all([
        http<any>('/api/events').catch(() => ({ items: [] })),
        http<any>('/api/live').catch(() => ({ items: [] }))
      ])

      const events = eventsResponse.items || eventsResponse || []
      const liveSessions = liveSessionsResponse.items || liveSessionsResponse || []

      // Convert live sessions to calendar events
      const liveSessionEvents = liveSessions.map((session: any) => ({
        id: `live_${session.id}`,
        title: session.title,
        description: session.description || 'Live Class Session',
        event_type: 'live_class' as Event['event_type'],
        start_time: session.start_at || session.scheduled_at,
        end_time: session.end_at || new Date(new Date(session.start_at || session.scheduled_at).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour
        all_day: false,
        location: 'Virtual Classroom',
        course_id: session.course_id,
        course: session.course,
        color: '#EF4444', // Red for live sessions
        is_public: true,
        requires_rsvp: false,
        created_by: session.host_email,
        created_at: session.created_at,
        updated_at: session.updated_at,
        // Live session specific fields
        is_live_session: true,
        live_session_id: session.id,
        live_session_status: session.status,
        live_session_host: session.host_email
      }))

      // Combine events and live sessions
      const allEvents = [...events, ...liveSessionEvents]
      setEvents(allEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }





  const getEventStatus = (event: Event) => {
    const now = new Date()
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)

    if (now < startTime) {
      return { status: 'upcoming', color: 'text-blue-400', icon: <Clock className="h-3 w-3" /> }
    } else if (now >= startTime && now <= endTime) {
      return { status: 'ongoing', color: 'text-green-400', icon: <CheckCircle className="h-3 w-3" /> }
    } else {
      return { status: 'past', color: 'text-gray-400', icon: <XCircle className="h-3 w-3" /> }
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === "all" || event.event_type === filterType
    return matchesSearch && matchesFilter
  })

  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5)

  const todayEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start_time)
    const today = new Date()
    return eventDate.toDateString() === today.toDateString()
  })

  const urgentEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start_time)
    const now = new Date()
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours > 0 && diffHours <= 24 && event.event_type === 'assignment_due'
  })

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getEventColor = (type: Event['event_type']) => {
    switch (type) {
      case 'class': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'office_hours': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'study_group': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'exam': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'assignment_due': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'live_class': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getEventIcon = (type: Event['event_type']) => {
    switch (type) {
      case 'class': return <BookOpen className="h-4 w-4" />
      case 'office_hours': return <Users className="h-4 w-4" />
      case 'study_group': return <Users className="h-4 w-4" />
      case 'exam': return <Award className="h-4 w-4" />
      case 'assignment_due': return <Clock className="h-4 w-4" />
      case 'live_class': return <Video className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-slate-300">View your schedule and upcoming events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
            className="bg-blue-600/80 hover:bg-blue-600 text-white"
          >
            Day
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="class">Classes</SelectItem>
              <SelectItem value="office_hours">Office Hours</SelectItem>
              <SelectItem value="study_group">Study Groups</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="assignment_due">Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{formatDate(currentDate)}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {(() => {
              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
              const days = []
              
              // Add empty cells for days before the first day of the month
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="p-2 min-h-[80px] bg-white/5 rounded" />)
              }
              
              // Add days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                const dayEvents = getEventsForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()
                
                days.push(
                  <div
                    key={day}
                    className={`p-2 min-h-[80px] bg-white/5 rounded border ${
                      isToday ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="text-sm font-medium text-white mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event.event_type)}`}
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowEventDetails(true)
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              return days
            })()}
          </div>
        </GlassCard>
      )}

      {/* Urgent Events Alert */}
      {urgentEvents.length > 0 && (
        <GlassCard className="p-4 border-orange-500/30 bg-orange-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-400" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-400">Urgent Deadlines</h3>
              <p className="text-sm text-orange-300">
                You have {urgentEvents.length} assignment(s) due within 24 hours
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              onClick={() => setFilterType('assignment_due')}
            >
              View All
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Events</h2>
              <Badge variant="outline" className="text-white border-white/20">
                {todayEvents.length} events
              </Badge>
            </div>
            
            {todayEvents.length > 0 ? (
              <div className="space-y-4">
                {todayEvents.map((event) => {
                  const status = getEventStatus(event)
                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${getEventColor(event.event_type)} cursor-pointer hover:bg-white/5 transition-colors`}
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventDetails(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getEventIcon(event.event_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{event.title}</h3>
                              <div className={`flex items-center gap-1 ${status.color}`}>
                                {status.icon}
                                <span className="text-xs capitalize">{status.status}</span>
                              </div>
                            </div>
                            <p className="text-sm opacity-80 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.start_time).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                              {event.course && (
                                <div className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {event.course.title}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(event)
                            setShowEventDetails(true)
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for today</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Upcoming Events */}
        <div>
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Upcoming Events</h2>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${getEventColor(event.event_type)} cursor-pointer hover:bg-white/5 transition-colors`}
                    onClick={() => {
                      setSelectedEvent(event)
                      setShowEventDetails(true)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{event.title}</h4>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(event.start_time).toLocaleDateString([], { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {event.course && (
                          <p className="text-xs opacity-60 mt-1 truncate">
                            {event.course.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Classes</span>
                <span className="text-blue-400 font-medium">
                  {filteredEvents.filter(e => e.event_type === 'class' && 
                    new Date(e.start_time) >= new Date() && 
                    new Date(e.start_time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Assignments Due</span>
                <span className="text-orange-400 font-medium">
                  {filteredEvents.filter(e => e.event_type === 'assignment_due' && 
                    new Date(e.start_time) >= new Date() && 
                    new Date(e.start_time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Study Groups</span>
                <span className="text-purple-400 font-medium">
                  {filteredEvents.filter(e => e.event_type === 'study_group' && 
                    new Date(e.start_time) >= new Date() && 
                    new Date(e.start_time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Enhanced Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedEvent && getEventIcon(selectedEvent.event_type)}
              Event Details
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              View event details and navigate to related pages.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getEventColor(selectedEvent.event_type)}>
                    {selectedEvent.event_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {selectedEvent.is_live_session && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      LIVE SESSION
                    </Badge>
                  )}
                  {selectedEvent.is_assignment && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      ASSIGNMENT
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-white text-lg">{selectedEvent.title}</h3>
                <p className="text-sm text-slate-300">{selectedEvent.description}</p>
              </div>
              
              {/* Event Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-white">
                      {selectedEvent.is_assignment ? 
                        `Due: ${dateUtils.short(selectedEvent.start_time)} at ${dateUtils.time(selectedEvent.start_time)}` :
                        `${dateUtils.short(selectedEvent.start_time)} at ${dateUtils.time(selectedEvent.start_time)}`
                      }
                    </div>
                    {!selectedEvent.is_assignment && (
                      <div className="text-slate-400 text-xs">
                        Duration: {selectedEvent.end_time && selectedEvent.start_time ? 
                          Math.round((new Date(selectedEvent.end_time).getTime() - new Date(selectedEvent.start_time).getTime()) / (1000 * 60)) : 0
                        } minutes
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedEvent.location && !selectedEvent.is_assignment && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-white">{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.course && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-white">{selectedEvent.course.title}</span>
                  </div>
                )}

                {selectedEvent.is_assignment && selectedEvent.points && (
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span className="text-white">{selectedEvent.points} points</span>
                  </div>
                )}

                {selectedEvent.is_live_session && selectedEvent.live_session_host && (
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4 text-slate-400" />
                    <span className="text-white">Host: {selectedEvent.live_session_host}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Navigation Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.is_live_session && selectedEvent.live_session_id && (
                    <Button
                      onClick={() => {
                        router.push(`/live/${selectedEvent.live_session_id}`)
                        setShowEventDetails(false)
                      }}
                      variant="destructive"
                      className=""
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Join Live Session
                    </Button>
                  )}
                  
                  {selectedEvent.course_id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/student/course/${selectedEvent.course_id}`)
                        setShowEventDetails(false)
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  )}

                  {selectedEvent.is_assignment && selectedEvent.assignment_id && (
                    <Button
                      onClick={() => {
                        router.push(`/student/assignment/${selectedEvent.assignment_id}`)
                        setShowEventDetails(false)
                      }}
                      variant="warning"
                      className=""
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Assignment
                    </Button>
                  )}
                </div>

                {/* RSVP Section */}
                {selectedEvent.requires_rsvp && !selectedEvent.is_assignment && (
                  <div className="pt-3 border-t border-white/10">
                    <h4 className="font-medium text-white mb-3">RSVP Status</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                        Maybe
                      </Button>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => setShowEventDetails(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

