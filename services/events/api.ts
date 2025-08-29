import { http } from '../http'
import { useAuthStore } from "@/store/auth-store"

export interface Event {
  id: string
  title: string
  description?: string
  event_type: 'live_session' | 'assignment_due' | 'exam' | 'office_hours' | 'study_group' | 'announcement' | 'custom'
  start_time: string
  end_time: string
  all_day: boolean
  location?: string
  course_id?: string
  created_by: string
  color: string
  recurring_pattern?: string
  is_recurring: boolean
  max_participants?: number
  is_public: boolean
  requires_rsvp: boolean
  created_at: string
  updated_at: string
  courses?: {
    title: string
  }
  event_participants?: EventParticipant[]
}

export interface EventParticipant {
  id: string
  event_id: string
  participant_email: string
  role: 'host' | 'attendee' | 'invited'
  rsvp_status?: 'pending' | 'accepted' | 'declined' | 'maybe'
  attended?: boolean
  joined_at?: string
  left_at?: string
  notes?: string
  created_at: string
}

export interface OfficeHours {
  id: string
  teacher_email: string
  day_of_week: number
  start_time: string
  end_time: string
  location?: string
  is_virtual: boolean
  meeting_link?: string
  max_students_per_slot: number
  slot_duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OfficeHourAppointment {
  id: string
  office_hour_id: string
  student_email: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  topic?: string
  notes?: string
  created_at: string
  updated_at: string
  office_hours?: {
    teacher_email: string
    location?: string
    is_virtual: boolean
    meeting_link?: string
  }
}

export interface StudyGroup {
  id: string
  name: string
  description?: string
  course_id?: string
  created_by: string
  max_participants: number
  is_public: boolean
  meeting_link?: string
  created_at: string
  updated_at: string
  courses?: {
    title: string
  }
  study_group_participants?: StudyGroupParticipant[]
}

export interface StudyGroupParticipant {
  id: string
  study_group_id: string
  student_email: string
  role: 'creator' | 'moderator' | 'member'
  joined_at: string
}

// Helper function to get user email and create headers
function getHeadersWithUserEmail() {
  const user = useAuthStore.getState().user
  const userEmail = user?.email
  if (!userEmail) {
    throw new Error('User email not available')
  }
  return {
    'x-user-email': userEmail
  }
}

// Helper function to get user role and create headers
function getHeadersWithUserInfo() {
  const user = useAuthStore.getState().user
  const userEmail = user?.email
  const userRole = user?.role
  if (!userEmail || !userRole) {
    throw new Error('User email or role not available')
  }
  return {
    'x-user-email': userEmail,
    'x-user-role': userRole
  }
}

export async function getEvents(params?: {
  start_date?: string
  end_date?: string
  event_type?: string
  course_id?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.append('start_date', params.start_date)
  if (params?.end_date) searchParams.append('end_date', params.end_date)
  if (params?.event_type) searchParams.append('event_type', params.event_type)
  if (params?.course_id) searchParams.append('course_id', params.course_id)

  return http<{ items: Event[] }>(`/api/events?${searchParams.toString()}`, {
    headers: getHeadersWithUserInfo()
  })
}

export async function createEvent(data: {
  title: string
  description?: string
  event_type: Event['event_type']
  start_time: string
  end_time: string
  all_day?: boolean
  location?: string
  course_id?: string
  color?: string
  recurring_pattern?: any
  is_recurring?: boolean
  max_participants?: number
  is_public?: boolean
  requires_rsvp?: boolean
  participants?: string[]
}) {
  return http<Event>('/api/events', {
    method: 'POST',
    headers: getHeadersWithUserInfo(),
    body: data
  })
}

export async function updateEvent(eventId: string, data: Partial<Event>) {
  return http<Event>(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: getHeadersWithUserInfo(),
    body: data
  })
}

export async function deleteEvent(eventId: string) {
  return http(`/api/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeadersWithUserInfo()
  })
}

export async function rsvpToEvent(eventId: string, rsvpStatus: 'accepted' | 'declined' | 'maybe') {
  return http<EventParticipant>(`/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { rsvp_status: rsvpStatus }
  })
}

// ===== OFFICE HOURS API =====

export async function getOfficeHours(teacherEmail: string) {
  return http<{ items: OfficeHours[] }>(`/api/events/office-hours/${teacherEmail}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function createOfficeHours(data: {
  day_of_week: number
  start_time: string
  end_time: string
  location?: string
  is_virtual?: boolean
  meeting_link?: string
  max_students_per_slot?: number
  slot_duration_minutes?: number
}) {
  return http<OfficeHours>('/api/events/office-hours', {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function bookOfficeHoursAppointment(officeHourId: string, data: {
  appointment_date: string
  start_time: string
  end_time: string
  topic?: string
}) {
  return http<OfficeHourAppointment>(`/api/events/office-hours/${officeHourId}/book`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function getOfficeHourAppointments(params?: {
  start_date?: string
  end_date?: string
}) {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.append('start_date', params.start_date)
  if (params?.end_date) searchParams.append('end_date', params.end_date)
  
  return http<{ items: OfficeHourAppointment[] }>(`/api/events/office-hours/appointments?${searchParams.toString()}`, {
    headers: getHeadersWithUserEmail()
  })
}

// ===== STUDY GROUPS API =====

export async function getStudyGroups(params?: {
  course_id?: string
  is_public?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.course_id) searchParams.append('course_id', params.course_id)
  if (params?.is_public !== undefined) searchParams.append('is_public', params.is_public.toString())
  
  return http<{ items: StudyGroup[] }>(`/api/events/study-groups?${searchParams.toString()}`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function createStudyGroup(data: {
  name: string
  description?: string
  course_id?: string
  max_participants: number
  is_public: boolean
  meeting_link?: string
}) {
  return http<StudyGroup>('/api/events/study-groups', {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function joinStudyGroup(groupId: string) {
  return http<StudyGroupParticipant>(`/api/events/study-groups/${groupId}/join`, {
    method: 'POST',
    headers: getHeadersWithUserEmail()
  })
}

export async function createStudyGroupSession(groupId: string, data: {
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  meeting_link?: string
  max_participants?: number
}) {
  return http(`/api/events/study-groups/${groupId}/sessions`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: data
  })
}

export async function getStudyGroupSessions(groupId: string) {
  return http<{ items: any[] }>(`/api/events/study-groups/${groupId}/sessions`, {
    headers: getHeadersWithUserEmail()
  })
}

export async function rsvpToStudyGroupSession(sessionId: string, rsvpStatus: 'accepted' | 'declined' | 'maybe') {
  return http(`/api/events/study-groups/sessions/${sessionId}/rsvp`, {
    method: 'POST',
    headers: getHeadersWithUserEmail(),
    body: { rsvp_status: rsvpStatus }
  })
}
