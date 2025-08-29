"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlassCard } from "@/components/shared/glass-card"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  BookOpen,
  Video,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  HelpCircle,
  Users2,
  ExternalLink
} from "lucide-react"
import { Event, getEvents, createEvent, rsvpToEvent } from "@/services/events/api"
import { useCoursesFn } from "@/services/courses/hook"

export function CalendarView() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { courses } = useCoursesFn(user?.email)
  
  const [selected, setSelected] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'custom' as Event['event_type'],
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    course_id: '',
    color: '#3B82F6',
    is_public: true,
    requires_rsvp: false,
    participants: [] as string[]
  })

  useEffect(() => {
    if (!user?.email) return

    const fetchEvents = async () => {
      setLoading(true)
      try {
        const startOfMonth = new Date(selected || new Date())
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const endOfMonth = new Date(startOfMonth)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)
        endOfMonth.setDate(0)
        endOfMonth.setHours(23, 59, 59, 999)

        const response = await getEvents({
          start_date: startOfMonth.toISOString(),
          end_date: endOfMonth.toISOString(),
          event_type: filterType === 'all' ? undefined : filterType
        })

        setEvents(response.items || [])
      } catch (error) {
        console.error('Failed to fetch events:', error)
        toast({ title: "Failed to load events", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [selected, user?.email, filterType, toast])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>()
    
    events.forEach((event) => {
      const day = new Date(event.start_time)
      day.setHours(0, 0, 0, 0)
      const key = day.toISOString()
      const list = map.get(key) || []
      list.push(event)
      map.set(key, list)
    })
    
    return map
  }, [events])

  const selectedKey = useMemo(() => {
    if (!selected) return undefined
    const d = new Date(selected)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [selected])

  const selectedDayEvents = selectedKey ? eventsByDay.get(selectedKey) || [] : []

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_time || !newEvent.end_time) {
      toast({ title: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      await createEvent(newEvent)
      toast({ title: "Event created successfully!" })
      setShowCreateEvent(false)
      setNewEvent({
        title: '',
        description: '',
        event_type: 'custom',
        start_time: '',
        end_time: '',
        all_day: false,
        location: '',
        course_id: '',
        color: '#3B82F6',
        is_public: true,
        requires_rsvp: false,
        participants: []
      })
      
      const response = await getEvents()
      setEvents(response.items || [])
    } catch (error: any) {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" })
    }
  }

  const handleRSVP = async (eventId: string, status: 'accepted' | 'declined' | 'maybe') => {
    try {
      await rsvpToEvent(eventId, status)
      toast({ title: `RSVP ${status} successfully!` })
      
      const response = await getEvents()
      setEvents(response.items || [])
    } catch (error: any) {
      toast({ title: "Failed to RSVP", description: error.message, variant: "destructive" })
    }
  }

  const getEventIcon = (eventType: Event['event_type']) => {
    switch (eventType) {
      case 'live_session':
        return <Video className="h-4 w-4" />
      case 'assignment_due':
        return <FileText className="h-4 w-4" />
      case 'exam':
        return <BookOpen className="h-4 w-4" />
      case 'office_hours':
        return <HelpCircle className="h-4 w-4" />
      case 'study_group':
        return <Users2 className="h-4 w-4" />
      case 'announcement':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventColor = (eventType: Event['event_type']) => {
    switch (eventType) {
      case 'live_session':
        return 'bg-blue-600'
      case 'assignment_due':
        return 'bg-red-600'
      case 'exam':
        return 'bg-purple-600'
      case 'office_hours':
        return 'bg-green-600'
      case 'study_group':
        return 'bg-orange-600'
      case 'announcement':
        return 'bg-yellow-600'
      default:
        return 'bg-gray-600'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-slate-300">
            Manage your schedule, events, and appointments
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="live_session">Live Sessions</SelectItem>
              <SelectItem value="assignment_due">Assignments</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="office_hours">Office Hours</SelectItem>
              <SelectItem value="study_group">Study Groups</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {user?.role === 'teacher' && (
            <Button 
              onClick={() => setShowCreateEvent(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <GlassCard className="p-6">
            <Calendar 
              selected={selected} 
              onSelect={setSelected} 
              numberOfMonths={1}
              className="bg-white/5 rounded-lg"
              modifiers={{
                hasEvents: (date) => {
                  const day = new Date(date)
                  day.setHours(0, 0, 0, 0)
                  const key = day.toISOString()
                  return eventsByDay.has(key)
                }
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.5)'
                }
              }}
            />
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selected ? formatDate(selected.toISOString()) : 'Select a date'}
            </h3>
            
            {loading ? (
              <div className="text-slate-400">Loading events...</div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-slate-400 text-center py-8">
                No events for this day
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${getEventColor(event.event_type)} text-white`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{event.title}</div>
                        <div className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </div>
                        {event.location && (
                          <div className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-xs ${getEventColor(event.event_type)}`}>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                        {event.requires_rsvp && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRSVP(event.id, 'accepted')
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRSVP(event.id, 'declined')
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Event Type</Label>
                <Select 
                  value={newEvent.event_type} 
                  onValueChange={(value: Event['event_type']) => 
                    setNewEvent(prev => ({ ...prev, event_type: value }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_session">Live Session</SelectItem>
                    <SelectItem value="assignment_due">Assignment Due</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="office_hours">Office Hours</SelectItem>
                    <SelectItem value="study_group">Study Group</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Course (Optional)</Label>
                <Select 
                  value={newEvent.course_id} 
                  onValueChange={(value) => 
                    setNewEvent(prev => ({ ...prev, course_id: value }))
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white">Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Event title"
              />
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">End Time *</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Location</Label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Physical location or meeting link"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateEvent} className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateEvent(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-slate-900/95 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-md ${getEventColor(selectedEvent.event_type)} text-white`}>
                  {getEventIcon(selectedEvent.event_type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">{selectedEvent.title}</h3>
                  <Badge className={`mt-2 ${getEventColor(selectedEvent.event_type)}`}>
                    {selectedEvent.event_type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <Label className="text-slate-400 text-sm">Description</Label>
                  <p className="text-white mt-1">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-sm">Start Time</Label>
                  <p className="text-white mt-1">{formatTime(selectedEvent.start_time)}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">End Time</Label>
                  <p className="text-white mt-1">{formatTime(selectedEvent.end_time)}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <Label className="text-slate-400 text-sm">Location</Label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                    {selectedEvent.location.includes('http') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(selectedEvent.location, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </p>
                </div>
              )}

              {selectedEvent.requires_rsvp && (
                <div>
                  <Label className="text-slate-400 text-sm">RSVP</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRSVP(selectedEvent.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRSVP(selectedEvent.id, 'declined')}
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedEvent(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
