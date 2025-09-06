"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { dateUtils } from "@/utils/date-utils"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Video,
  Award,
  Bell,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
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
  // Live session specific fields
  is_live_session?: boolean
  live_session_id?: string
  live_session_status?: string
  live_session_host?: string
}

export default function TeacherCalendar() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  // Form state for creating/editing events
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "class" as Event['event_type'],
    start_time: "",
    end_time: "",
    all_day: false,
    location: "",
    course_id: "",
    color: "#3B82F6",
    is_public: true,
    requires_rsvp: false
  })

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
      
      console.log('All calendar events:', allEvents) // Debug log
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

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const eventData = {
        ...formData,
        organizer_email: user?.email,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString()
      }

      await http('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      })

      toast({
        title: "Success",
        description: "Event created successfully"
      })

      setShowCreateDialog(false)
      setFormData({
        title: "",
        description: "",
        event_type: "class",
        start_time: "",
        end_time: "",
        all_day: false,
        location: "",
        course_id: "",
        color: "#3B82F6",
        is_public: true,
        requires_rsvp: false
      })
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      })
    }
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || event.event_type === filterType
    return matchesSearch && matchesType
  })

  // Get today's events
  const today = new Date()
  const todayEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start_time)
    return eventDate.toDateString() === today.toDateString()
  })

  // Get upcoming events (next 7 days)
  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.start_time)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return eventDate > today && eventDate <= nextWeek
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

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
    const colors = {
      class: 'border-blue-500/30 bg-blue-500/10',
      office_hours: 'border-green-500/30 bg-green-500/10',
      study_group: 'border-purple-500/30 bg-purple-500/10',
      exam: 'border-red-500/30 bg-red-500/10',
      assignment_due: 'border-orange-500/30 bg-orange-500/10',
      other: 'border-gray-500/30 bg-gray-500/10',
      live_class: 'border-red-500/30 bg-red-500/10' // Red for live sessions
    }
    return colors[type] || colors.other
  }

  const getEventIcon = (type: Event['event_type']) => {
    const icons = {
      class: <BookOpen className="h-4 w-4 text-blue-400" />,
      office_hours: <Users className="h-4 w-4 text-green-400" />,
      study_group: <Users className="h-4 w-4 text-purple-400" />,
      exam: <Award className="h-4 w-4 text-red-400" />,
      assignment_due: <Clock className="h-4 w-4 text-orange-400" />,
      other: <Calendar className="h-4 w-4 text-gray-400" />,
      live_class: <Video className="h-4 w-4 text-red-400" /> // Video icon for live sessions
    }
    return icons[type] || icons.other
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    calendarDays.push(date)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-slate-400">Loading calendar...</p>
          </div>
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
          <p className="text-slate-300">Manage your events and appointments</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          variant="primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
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
            <SelectContent className="z-50">
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="class">Classes</SelectItem>
              <SelectItem value="office_hours">Office Hours</SelectItem>
              <SelectItem value="study_group">Study Groups</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="assignment_due">Assignments</SelectItem>
              <SelectItem value="live_class">Live Classes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Calendar View Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'month', 
              label: 'Month', 
              icon: <Calendar className="h-4 w-4" />
            },
            { 
              id: 'week', 
              label: 'Week', 
              icon: <Clock className="h-4 w-4" />
            },
            { 
              id: 'day', 
              label: 'Day', 
              icon: <Eye className="h-4 w-4" />
            }
          ]}
          activeTab={viewMode}
          onTabChange={(value: string) => setViewMode(value as 'month' | 'week' | 'day')}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'month' | 'week' | 'day')}>

        <TabsContent value="month" className="mt-6">
          <GlassCard className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Today
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-2 min-h-[80px]"></div>
                }

                const isToday = date.toDateString() === new Date().toDateString()
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const dayEvents = getEventsForDate(date)

                return (
                  <div
                    key={index}
                    className={`p-2 min-h-[80px] border border-white/5 rounded-lg ${
                      isToday ? 'bg-blue-500/20 border-blue-500/30' : ''
                    } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                  >
                    <div className="text-sm font-medium text-white mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${getEventColor(event.event_type)}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-slate-400 text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Week View</h2>
            <p className="text-slate-400">Week view coming soon...</p>
          </GlassCard>
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Day View</h2>
            <p className="text-slate-400">Day view coming soon...</p>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Today's Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Today's Events</h2>
            <Badge variant="outline" className="text-white border-white/20">
              {todayEvents.length} events
            </Badge>
          </div>
          
          {todayEvents.length > 0 ? (
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${getEventColor(event.event_type)} cursor-pointer hover:bg-white/5 transition-colors`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{event.title}</h3>
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
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvent(event)
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for today</p>
            </div>
          )}
        </GlassCard>

        {/* Upcoming Events */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Upcoming Events</h2>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${getEventColor(event.event_type)} cursor-pointer hover:bg-white/5 transition-colors`}
                  onClick={() => setSelectedEvent(event)}
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
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Event</DialogTitle>
            <DialogDescription className="text-slate-300">
              Add a new event to your calendar with all the necessary details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Event Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label className="text-white">Event Type</Label>
                <Select 
                  value={formData.event_type} 
                  onValueChange={(value: Event['event_type']) => 
                    setFormData(prev => ({ ...prev, event_type: value }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-slate-800 border-slate-700">
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="office_hours">Office Hours</SelectItem>
                    <SelectItem value="study_group">Study Group</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment_due">Assignment Due</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="live_class">Live Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter event description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Start Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">End Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter location (optional)"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              variant="primary"
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
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
                      {dateUtils.short(selectedEvent.start_time)} at {dateUtils.time(selectedEvent.start_time)}
                    </div>
                    <div className="text-slate-400 text-xs">
                      Duration: {selectedEvent.end_time && selectedEvent.start_time ? 
                        Math.round((new Date(selectedEvent.end_time).getTime() - new Date(selectedEvent.start_time).getTime()) / (1000 * 60)) : 0
                      } minutes
                    </div>
                  </div>
                </div>
                
                {selectedEvent.location && (
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
                        setSelectedEvent(null)
                      }}
                      variant="success"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Join Live Session
                    </Button>
                  )}
                  
                  {selectedEvent.course_id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/teacher/course/${selectedEvent.course_id}`)
                        setSelectedEvent(null)
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  )}

                  {selectedEvent.event_type === 'assignment_due' && selectedEvent.course_id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/teacher/assignments`)
                        setSelectedEvent(null)
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Assignments
                    </Button>
                  )}
                </div>

                {/* Management Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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

