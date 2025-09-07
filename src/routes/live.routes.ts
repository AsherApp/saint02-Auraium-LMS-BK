import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AccessToken } from 'livekit-server-sdk'
import { env } from '../config/env.js'
import { NotificationService } from '../services/notification.service.js'

export const router = Router()

// Get all live sessions for a teacher (for dashboard)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .select(`
      *,
      courses(title, teacher_email)
    `)
    .eq('teacher_email', teacherEmail)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Transform the data to match frontend expectations
  const sessions = (data || []).map(session => ({
    id: session.id,
    course_id: session.course_id,
    module_id: session.module_id,
    title: session.title,
    description: session.description,
    start_at: session.start_time,
    end_at: session.end_at,
    status: session.status,
    teacher_email: session.teacher_email,
    session_type: session.session_type || 'general',
    course_title: session.courses?.title,
    created_at: session.created_at,
    updated_at: session.updated_at,
    is_started: session.is_started || false,
    started_at: session.started_at
  }))

  res.json({ items: sessions })
}))

// Get scheduled sessions for a teacher
router.get('/scheduled', requireAuth, asyncHandler(async (req, res) => {
  const teacher_email = (req as any).user?.email
  if (!teacher_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('teacher_email', teacher_email)
    .eq('status', 'scheduled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
  
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  
  res.json({ items: data || [] })
}))

// Schedule a new live session
router.post('/schedule', requireAuth, asyncHandler(async (req, res) => {
  const teacher_email = (req as any).user?.email
  if (!teacher_email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { title, description, scheduled_at, duration_minutes = 60 } = req.body
  
  if (!title || !scheduled_at) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      title,
      description,
      start_time: scheduled_at,
      end_at: new Date(new Date(scheduled_at).getTime() + (duration_minutes * 60 * 1000)).toISOString(),
      status: 'scheduled',
      teacher_email,
      host_email: teacher_email,
      session_type: 'general'
    })
    .select()
    .single()
  
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  
  res.json(data)
}))

// Create a new live session
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { course_id, module_id, title, description, start_at, session_type, duration_minutes } = req.body
  const teacher_email = (req as any).user?.email
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'teacher_email_not_found' })
  }
  
  if (!title || !start_at || !session_type) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  // Validate based on session type
  if (session_type === 'course' && !course_id) {
    return res.status(400).json({ error: 'course_id_required_for_course_session' })
  }
  if (session_type === 'module' && (!module_id || !course_id)) {
    return res.status(400).json({ error: 'module_id_and_course_id_required_for_module_session' })
  }

  // Get teacher's live class settings to apply defaults
  let liveClassSettings = {
    default_session_duration: 60,
    allow_recording: true,
    require_approval_to_join: false,
    max_participants: 50
  }
  
  try {
    // Get teacher ID from email
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('email', teacher_email)
      .single()
    
    if (teacher && !teacherError) {
      // Fetch teacher's live class settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('teacher_settings')
        .select('live_class_settings')
        .eq('teacher_id', teacher.id)
        .single()
      
      if (settings && !settingsError && settings.live_class_settings) {
        liveClassSettings = settings.live_class_settings
      }
    }
  } catch (error) {
    console.log('Could not fetch teacher live class settings, using defaults:', error)
  }

  // Calculate end time based on settings or provided duration
  const sessionDuration = duration_minutes || liveClassSettings.default_session_duration
  const startTime = new Date(start_at)
  const endTime = new Date(startTime.getTime() + (sessionDuration * 60 * 1000))

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      course_id: course_id || null,
      module_id: module_id || null,
      title,
      description,
      start_time: startTime.toISOString(),
      end_at: endTime.toISOString(),
      duration_minutes: sessionDuration,
      teacher_email,
      host_email: teacher_email, // Add this for compatibility
      status: 'scheduled', // Start as scheduled, not active
      session_type,
      is_started: false, // New field to track if teacher has started the session
      started_at: null, // When teacher actually starts the session
      allow_recording: liveClassSettings.allow_recording,
      require_approval: liveClassSettings.require_approval_to_join,
      max_participants: liveClassSettings.max_participants
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Send live session notifications to enrolled students
  try {
    if (course_id) {
      // Get course details
      const { data: courseData } = await supabaseAdmin
        .from('courses')
        .select('title')
        .eq('id', course_id)
        .single();

      // Get enrolled students
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_email')
        .eq('course_id', course_id);

      if (enrollments && enrollments.length > 0) {
        // Send notifications to all enrolled students
        const notifications = enrollments.map(enrollment => ({
          user_email: enrollment.student_email,
          user_type: 'student' as const,
          type: 'live_session_scheduled',
          title: 'Live Session Scheduled',
          message: `A live session "${title}" has been scheduled for the course "${courseData?.title}".`,
          data: {
            session_id: data.id,
            session_title: title,
            course_title: courseData?.title,
            course_id: course_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: sessionDuration,
            session_type: session_type,
            created_at: new Date().toISOString()
          }
        }));

        await NotificationService.sendBulkNotifications(notifications);
      }
    }
  } catch (notificationError) {
    console.error('Error sending live session notifications:', notificationError);
    // Don't fail the session creation if notifications fail
  }

  res.json(data)
}))



// Start a live session (teacher only)
router.post('/:id/start', requireAuth, asyncHandler(async (req, res) => {
  const teacher_email = (req as any).user?.email
  const session_id = req.params.id
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'teacher_email_not_found' })
  }
  
  // Get the session to verify teacher ownership
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', session_id)
    .single()

  if (sessionError) return res.status(500).json({ error: sessionError.message })
  if (!session) return res.status(404).json({ error: 'session_not_found' })
  
  // Only the teacher can start the session
  if (session.teacher_email !== teacher_email) {
    return res.status(403).json({ error: 'only_teacher_can_start_session' })
  }

  // Update session to started
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ 
      status: 'active',
      is_started: true,
      started_at: new Date().toISOString()
    })
    .eq('id', session_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// End a live session (teacher only)
router.post('/:id/end', requireAuth, asyncHandler(async (req, res) => {
  const teacher_email = (req as any).user?.email
  const session_id = req.params.id
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'teacher_email_not_found' })
  }
  
  // Get the session to verify teacher ownership
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', session_id)
    .single()

  if (sessionError) return res.status(500).json({ error: sessionError.message })
  if (!session) return res.status(404).json({ error: 'session_not_found' })
  
  // Only the teacher can end the session
  if (session.teacher_email !== teacher_email) {
    return res.status(403).json({ error: 'only_teacher_can_end_session' })
  }

  // Update session to ended
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ 
      status: 'ended',
      end_at: new Date().toISOString()
    })
    .eq('id', session_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  
  // Auto-generate attendance report when session ends
  try {
    // Get all enrolled students
    const { data: enrolledStudents } = await supabaseAdmin
      .from('enrollments')
      .select('student_email')
      .eq('course_id', session.course_id)

    // Get attendance records
    const { data: attendanceRecords } = await supabaseAdmin
      .from('live_attendance_records')
      .select('*')
      .eq('session_id', session_id)

    // Calculate statistics
    const totalEnrolled = enrolledStudents?.length || 0
    const presentCount = attendanceRecords?.filter(r => r.status === 'present').length || 0
    const lateCount = attendanceRecords?.filter(r => r.status === 'late').length || 0
    const absentCount = attendanceRecords?.filter(r => r.status === 'absent').length || 0
    const excusedCount = attendanceRecords?.filter(r => r.status === 'excused').length || 0

    const averageAttendancePercentage = (attendanceRecords?.length || 0) > 0 
      ? (attendanceRecords || []).reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / (attendanceRecords?.length || 1)
      : 0

    const averageParticipationScore = (attendanceRecords?.length || 0) > 0
      ? (attendanceRecords || []).reduce((sum, r) => sum + (r.participation_score || 0), 0) / (attendanceRecords?.length || 1)
      : 0

    const averageEngagementScore = (attendanceRecords?.length || 0) > 0
      ? (attendanceRecords || []).reduce((sum, r) => sum + (r.engagement_score || 0), 0) / (attendanceRecords?.length || 1)
      : 0

    const sessionDurationMinutes = session.end_at && session.start_time
      ? Math.floor((new Date(session.end_at).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
      : 0

    // Create or update report
    await supabaseAdmin
      .from('live_attendance_reports')
      .upsert({
        session_id: session_id,
        total_enrolled_students: totalEnrolled,
        present_count: presentCount,
        late_count: lateCount,
        absent_count: absentCount,
        excused_count: excusedCount,
        average_attendance_percentage: averageAttendancePercentage,
        average_participation_score: averageParticipationScore,
        average_engagement_score: averageEngagementScore,
        session_duration_minutes: sessionDurationMinutes,
        generated_at: new Date()
      })
    
    console.log(`Auto-generated attendance report for session ${session_id}`)
  } catch (reportError) {
    console.error('Failed to auto-generate attendance report:', reportError)
    // Don't fail the session end if report generation fails
  }
  
  res.json(data)
}))

// Update session status
router.post('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body
  const teacher_email = (req as any).user?.email
  const session_id = req.params.id
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'teacher_email_not_found' })
  }
  
  // Get the session to verify teacher ownership
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', session_id)
    .single()

  if (sessionError) return res.status(500).json({ error: sessionError.message })
  if (!session) return res.status(404).json({ error: 'session_not_found' })
  
  // Only the teacher can update session status
  if (session.teacher_email !== teacher_email) {
    return res.status(403).json({ error: 'only_teacher_can_update_session' })
  }

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ 
      status,
      is_started: status === 'active' ? true : session.is_started, // Set is_started when status becomes active
      started_at: status === 'active' && !session.is_started ? new Date().toISOString() : session.started_at, // Set started_at when first becoming active
      end_at: status === 'ended' ? new Date().toISOString() : null
    })
    .eq('id', session_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Add message to session
router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const { text } = req.body
  const from_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  const { data, error } = await supabaseAdmin
    .from('live_messages')
    .insert({
      session_id: req.params.id,
      from_email,
      text
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Add resource to session
router.post('/:id/resources', requireAuth, asyncHandler(async (req, res) => {
  const { title, url } = req.body
  const uploader_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  const { data, error } = await supabaseAdmin
    .from('live_resources')
    .insert({
      session_id: req.params.id,
      title,
      url,
      uploader_email
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Get live sessions for current user (teacher or student)
router.get('/my-sessions', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || !userRole) {
    return res.status(400).json({ error: 'missing_user_info' })
  }

  let query = supabaseAdmin
    .from('live_sessions')
    .select(`
      *,
      courses(title, teacher_email)
    `)

  if (userRole === 'teacher') {
    // Teacher sees sessions they created
    query = query.eq('teacher_email', userEmail)
  } else {
    // Student sees sessions for courses they are enrolled in
    // First get the courses the student is enrolled in
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('student_email', userEmail)
    
    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map(e => e.course_id)
      query = query.in('course_id', courseIds)
    } else {
      // If no enrollments, return empty array
      return res.json({ items: [] })
    }
  }

  const { data, error } = await query.order('start_time', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data to match frontend expectations
  const sessions = (data || []).map(session => ({
    id: session.id,
    courseId: session.course_id,
    moduleId: session.module_id,
    title: session.title,
    description: session.description,
    startAt: new Date(session.start_time).getTime(),
    endAt: session.end_at ? new Date(session.end_at).getTime() : undefined,
    status: session.status,
    hostEmail: session.courses?.teacher_email,
    sessionType: session.session_type || 'general',
    courseTitle: session.courses?.title,
    moduleTitle: null, // Will be populated separately if needed
    participants: [], // Will be populated separately if needed
    isStarted: session.is_started || false,
    startedAt: session.started_at ? new Date(session.started_at).getTime() : undefined
  }))

  res.json({ items: sessions })
}))

// Get a specific live session by ID
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  let data, error
  
  if (userRole === 'teacher') {
    // Teachers can access sessions for their own courses
    const result = await supabaseAdmin
      .from('live_sessions')
      .select(`
        *,
        teachers!inner(first_name, last_name),
        courses(title)
      `)
      .eq('id', req.params.id)
      .eq('teacher_email', userEmail)
      .maybeSingle()
    data = result.data
    error = result.error
  } else if (userRole === 'student') {
    // Students can access any session (simplified approach)
    const result = await supabaseAdmin
      .from('live_sessions')
      .select(`
        *,
        teachers!inner(first_name, last_name),
        courses(title)
      `)
      .eq('id', req.params.id)
      .maybeSingle()
    
    // For course-associated sessions, verify student enrollment
    if (result.data && result.data.course_id) {
      const enrollmentCheck = await supabaseAdmin
        .from('enrollments')
        .select('student_email')
        .eq('course_id', result.data.course_id)
        .eq('student_email', userEmail)
        .maybeSingle()
      
      if (!enrollmentCheck.data) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' })
      }
    }
    
    data = result.data
    error = result.error
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'session_not_found' })
  
  // Transform the data
  const session = {
    id: data.id,
    course_id: data.course_id,
    module_id: data.module_id,
    title: data.title,
    description: data.description,
    scheduled_at: data.start_time,
    start_time: data.start_time,
    end_time: data.end_time || data.end_at,
    duration: data.duration_minutes || 60,
    status: data.status,
    teacher_email: data.teacher_email,
    teacher_name: data.teachers?.first_name && data.teachers?.last_name 
      ? `${data.teachers.first_name} ${data.teachers.last_name}`.trim()
      : null,
    session_type: data.session_type,
    course_title: data.courses?.title || (data.course_id ? 'Course Session' : 'General Session'),
    created_at: data.created_at,
    updated_at: data.updated_at,
    is_started: data.is_started || false,
    started_at: data.started_at
  }

  res.json(session)
}))

// Get participants for a live session
router.get('/:id/participants', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // First verify the user has access to this session
  let sessionQuery

  if (userRole === 'teacher') {
    // Teachers can only see participants for their own sessions
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select('id, teacher_email, course_id')
      .eq('teacher_email', userEmail)
      .eq('id', req.params.id)
  } else if (userRole === 'student') {
    // Students can only see participants for sessions in courses they're enrolled in
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select('id, teacher_email, course_id')
      .eq('id', req.params.id)
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }

  const { data: session, error: sessionError } = await sessionQuery.maybeSingle()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found or access denied' })
  }

  // For students, verify enrollment if session has a course
  if (userRole === 'student' && session.course_id) {
    const enrollmentCheck = await supabaseAdmin
      .from('enrollments')
      .select('student_email')
      .eq('course_id', session.course_id)
      .eq('student_email', userEmail)
      .maybeSingle()
    
    if (!enrollmentCheck.data) {
      return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' })
    }
  }

  // Now get participants for the authorized session
  const { data: participants, error } = await supabaseAdmin
    .from('live_participants')
    .select('*')
    .eq('session_id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  
  // Get user profile information for each participant
  const transformedData = await Promise.all((participants || []).map(async (participant) => {
    // Get user profile from user_profiles view
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email, user_type')
      .eq('email', participant.student_email)
      .single()
    
    return {
      ...participant,
      name: userProfile 
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        : participant.student_email?.split('@')[0] || 'Unknown User',
      email: participant.student_email
    }
  }))
  
  res.json({ items: transformedData })
}))

// Add participant to a live session
router.post('/:id/participants', requireAuth, asyncHandler(async (req, res) => {
  const { email, student_ids } = req.body
  const sessionId = req.params.id
  
  // Handle single email (legacy support)
  if (email) {
    const { data, error } = await supabaseAdmin
      .from('live_participants')
      .insert({
        session_id: sessionId,
        student_email: email.toLowerCase(),
        joined_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }
  
  // Handle multiple student IDs (new functionality)
  if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
    // First, get the student emails from the IDs
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, email')
      .in('id', student_ids)
    
    if (studentsError) return res.status(500).json({ error: studentsError.message })
    
    if (!students || students.length === 0) {
      return res.status(404).json({ error: 'No students found with provided IDs' })
    }
    
    // Prepare participant records
    const participants = students.map(student => ({
      session_id: sessionId,
      student_email: student.email.toLowerCase(),
      student_id: student.id,
      joined_at: new Date().toISOString()
    }))
    
    // Insert participants
    const { data, error } = await supabaseAdmin
      .from('live_participants')
      .insert(participants)
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ items: data, count: data.length })
  }
  
  return res.status(400).json({ error: 'Either email or student_ids must be provided' })
}))

// Join a session (with Zoom-like restrictions)
router.post('/:id/join', requireAuth, asyncHandler(async (req, res) => {
  const user_email = (req as any).user?.email?.toLowerCase()
  const user_role = (req as any).user?.role?.toLowerCase()
  const session_id = req.params.id
  
  // Get session details to check permissions
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('id', session_id)
    .single()

  if (sessionError) return res.status(500).json({ error: sessionError.message })
  if (!session) return res.status(404).json({ error: 'session_not_found' })

  // Check if session is started (for students)
  if (user_role === 'student' && !session.is_started) {
    return res.status(403).json({ 
      error: 'session_not_started',
      message: 'The teacher has not started this session yet. Please wait for the teacher to start the class.'
    })
  }

  // Check if session is ended
  if (session.status === 'ended') {
    return res.status(403).json({ 
      error: 'session_ended',
      message: 'This session has ended.'
    })
  }

  // Check if already joined
  const { data: existing } = await supabaseAdmin
    .from('live_participants')
    .select('id')
    .eq('session_id', session_id)
    .eq('student_email', user_email)
    .single()

  if (existing) {
    return res.json({ message: 'Already joined', participant: existing })
  }

  // Check max participants limit (for students)
  if (user_role === 'student' && session.max_participants) {
    const { count: currentParticipants } = await supabaseAdmin
      .from('live_participants')
      .select('*', { count: 'exact' })
      .eq('session_id', session_id)

    if (currentParticipants && currentParticipants >= session.max_participants) {
      return res.status(403).json({ 
        error: 'session_full',
        message: `This session has reached the maximum number of participants (${session.max_participants}).`
      })
    }
  }

  // Check if approval is required (for students)
  if (user_role === 'student' && session.require_approval) {
    // For now, we'll allow joining but could implement approval workflow later
    // This could be extended to create a pending approval request
    console.log(`Student ${user_email} joining session ${session_id} that requires approval`)
  }

  // Handle both teachers and students
  let participantData: any = {
    session_id,
    student_email: user_email,
    joined_at: new Date().toISOString()
  }

  if (user_role === 'student') {
    // Get student ID for students
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', user_email)
      .single()

    if (!student) {
      return res.status(400).json({ error: 'Student not found' })
    }
    
    participantData.student_id = student.id
  } else if (user_role === 'teacher') {
    // For teachers, we don't need student_id
    // Teachers can join their own sessions
    if (session.teacher_email !== user_email) {
      return res.status(403).json({ error: 'Only the session teacher can join' })
    }
    // Don't set student_id for teachers - it will be NULL
  } else {
    return res.status(400).json({ error: 'Invalid user role' })
  }

  // Insert new participant
  const { data, error } = await supabaseAdmin
    .from('live_participants')
    .insert(participantData)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Leave a session
router.post('/:id/leave', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const session_id = req.params.id

  const { error } = await supabaseAdmin
    .from('live_participants')
    .delete()
    .eq('session_id', session_id)
    .eq('student_email', user_email)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Left session' })
}))

// Update a live session
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, scheduled_at, duration } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({
      title,
      description,
      start_time: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
      duration
    })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete a live session
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('live_sessions')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}))

// Get messages for a live session
router.get('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // First verify the user has access to this session
  let sessionQuery

  if (userRole === 'teacher') {
    // Teachers can only see messages for their own sessions
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select('id, teacher_email')
      .eq('teacher_email', userEmail)
      .eq('id', req.params.id)
  } else if (userRole === 'student') {
    // Students can only see messages for sessions in courses they're enrolled in
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select(`
        id, teacher_email,
        courses(
          enrollments(student_email)
        )
      `)
      .eq('courses.enrollments.student_email', userEmail)
      .eq('id', req.params.id)
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }

  const { data: session, error: sessionError } = await sessionQuery.single()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found or access denied' })
  }

  // Now get messages for the authorized session
  const { data, error } = await supabaseAdmin
    .from('live_messages')
    .select('*')
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Add message to a live session
router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  const { text } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('live_messages')
    .insert({
      session_id: req.params.id,
      from_email: userEmail,
      text,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Get resources for a live session
router.get('/:id/resources', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }

  // First verify the user has access to this session
  let sessionQuery

  if (userRole === 'teacher') {
    // Teachers can only see resources for their own sessions
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select('id, teacher_email')
      .eq('teacher_email', userEmail)
      .eq('id', req.params.id)
  } else if (userRole === 'student') {
    // Students can only see resources for sessions in courses they're enrolled in
    sessionQuery = supabaseAdmin
      .from('live_sessions')
      .select(`
        id, teacher_email,
        courses(
          enrollments(student_email)
        )
      `)
      .eq('courses.enrollments.student_email', userEmail)
      .eq('id', req.params.id)
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }

  const { data: session, error: sessionError } = await sessionQuery.single()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found or access denied' })
  }

  // Now get resources for the authorized session
  const { data, error } = await supabaseAdmin
    .from('live_resources')
    .select('*')
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Add resource to a live session
router.post('/:id/resources', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  const { title, url } = req.body
  
  // Only teachers can add resources
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can add resources.' })
  }
  
  // Verify the teacher is the host of this session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('host_email')
    .eq('id', req.params.id)
    .single()
  
  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  if (session.host_email.toLowerCase() !== userEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. Only the session host can add resources.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_resources')
    .insert({
      session_id: req.params.id,
      title,
      url,
      uploader_email: userEmail,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Get polls for a live session
router.get('/:id/polls', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('polls')
    .select(`
      *,
      poll_options(*)
    `)
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  
  // Get all votes for these polls
  const pollIds = (data || []).map((poll: any) => poll.id)
  const { data: votes } = await supabaseAdmin
    .from('poll_votes')
    .select('*')
    .in('poll_id', pollIds)
  
  // Transform the data to match frontend expectations
  const polls = (data || []).map((poll: any) => {
    const pollVotes = votes?.filter((vote: any) => vote.poll_id === poll.id) || []
    
    const options = (poll.poll_options || []).map((option: any) => {
      const optionVotes = pollVotes.filter((vote: any) => vote.option_id === option.id)
      return {
        ...option,
        votes: optionVotes.map((vote: any) => vote.voter_email)
      }
    })
    
    return {
      ...poll,
      options
    }
  })
  
  res.json({ items: polls })
}))

// Create a new poll
router.post('/:id/polls', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { question, options } = req.body
  
  // Create the poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('polls')
    .insert({
      session_id: req.params.id,
      question,
      created_by: user_email,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (pollError) return res.status(500).json({ error: pollError.message })
  
  // Create the poll options
  const pollOptions = options.map((text: string) => ({
    poll_id: poll.id,
    text: text.trim()
  }))
  
  const { error: optionsError } = await supabaseAdmin
    .from('poll_options')
    .insert(pollOptions)

  if (optionsError) return res.status(500).json({ error: optionsError.message })
  
  res.json(poll)
}))

// Vote on a poll option
router.post('/:id/polls/:pollId/vote', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { option_id } = req.body
  
  // Remove any existing vote by this user for this poll
  await supabaseAdmin
    .from('poll_votes')
    .delete()
    .eq('poll_id', req.params.pollId)
    .eq('voter_email', user_email)
  
  // Add the new vote
  const { data, error } = await supabaseAdmin
    .from('poll_votes')
    .insert({
      poll_id: req.params.pollId,
      option_id,
      voter_email: user_email
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Close a poll
router.post('/:id/polls/:pollId/close', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('polls')
    .update({ closed: true })
    .eq('id', req.params.pollId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))


// Get live classwork for a session
router.get('/:id/classwork', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('live_classwork')
    .select('*')
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Create live classwork
router.post('/:id/classwork', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  const { title, description, type, content, due_at } = req.body
  
  // Only teachers can create classwork
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can create classwork.' })
  }
  
  // Verify the teacher is the host of this session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('host_email')
    .eq('id', req.params.id)
    .single()
  
  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found' })
  }
  
  if (session.host_email.toLowerCase() !== user_email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. Only the session host can create classwork.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_classwork')
    .insert({
      session_id: req.params.id,
      title,
      description,
      due_at: due_at ? new Date(due_at).toISOString() : null
      // created_at will be set automatically by default
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Get classwork submissions
router.get('/:id/classwork/:classworkId/submissions', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('live_classwork_submissions')
    .select('*')
    .eq('classwork_id', req.params.classworkId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Submit classwork
router.post('/:id/classwork/:classworkId/submit', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  const { content, attachments } = req.body
  
  // Only students can submit classwork
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied. Only students can submit classwork.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_classwork_submissions')
    .insert({
      classwork_id: req.params.classworkId,
      student_email: user_email,
      payload: JSON.stringify({ content, attachments: attachments || [] })
      // submitted_at will be set automatically by default
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Grade classwork submission
router.put('/:id/classwork/:classworkId/submissions/:submissionId/grade', requireAuth, asyncHandler(async (req, res) => {
  const { grade, feedback } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('live_classwork_submissions')
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString()
    })
    .eq('id', req.params.submissionId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Update live classwork
router.put('/classwork/:classworkId', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  const { title, description, due_at } = req.body
  
  // Only teachers can update classwork
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can update classwork.' })
  }
  
  // Check if user owns the classwork (is the session host)
  const { data: classwork, error: fetchError } = await supabaseAdmin
    .from('live_classwork')
    .select('session_id')
    .eq('id', req.params.classworkId)
    .single()
  
  if (fetchError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found' })
  }
  
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('host_email')
    .eq('id', classwork.session_id)
    .single()
  
  if (sessionError || !session || session.host_email.toLowerCase() !== user_email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You can only update classwork you created.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_classwork')
    .update({
      title,
      description,
      due_at: due_at ? new Date(due_at).toISOString() : null
    })
    .eq('id', req.params.classworkId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete live classwork
router.delete('/classwork/:classworkId', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  
  // Only teachers can delete classwork
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can delete classwork.' })
  }
  
  // Check if user owns the classwork (is the session host)
  const { data: classwork, error: fetchError } = await supabaseAdmin
    .from('live_classwork')
    .select('session_id')
    .eq('id', req.params.classworkId)
    .single()
  
  if (fetchError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found' })
  }
  
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('host_email')
    .eq('id', classwork.session_id)
    .single()
  
  if (sessionError || !session || session.host_email.toLowerCase() !== user_email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You can only delete classwork you created.' })
  }
  
  const { error } = await supabaseAdmin
    .from('live_classwork')
    .delete()
    .eq('id', req.params.classworkId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}))

// Submit classwork (standalone endpoint)
router.post('/classwork/:classworkId/submit', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  const { content } = req.body
  
  // Only students can submit classwork
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied. Only students can submit classwork.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_classwork_submissions')
    .insert({
      classwork_id: req.params.classworkId,
      student_email: user_email,
      payload: JSON.stringify({ content })
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Get live notes for a session
router.get('/:id/notes', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  
  let query = supabaseAdmin
    .from('live_notes')
    .select('*')
    .eq('session_id', req.params.id)
  
  if (userRole === 'student') {
    // Students can see shared notes and their own private notes
    query = query.or(`is_shared.eq.true,author_email.eq.${user_email}`)
  }
  // Teachers can see all notes (shared and their own)
  
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Create live note
router.post('/:id/notes', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const userRole = (req as any).user?.role || 'student'
  const { title, content, is_shared } = req.body
  
  // Only teachers can create shared notes
  if (is_shared && userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can create shared notes.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_notes')
    .insert({
      session_id: req.params.id,
      title,
      content,
      author_email: user_email,
      is_shared: is_shared || false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Update live note
router.put('/notes/:noteId', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { title, content, is_shared } = req.body
  
  // Check if user owns the note
  const { data: existingNote, error: fetchError } = await supabaseAdmin
    .from('live_notes')
    .select('*')
    .eq('id', req.params.noteId)
    .single()
  
  if (fetchError || !existingNote) {
    return res.status(404).json({ error: 'Note not found' })
  }
  
  if (existingNote.author_email.toLowerCase() !== user_email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You can only edit your own notes.' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_notes')
    .update({
      title,
      content,
      is_shared,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.noteId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete live note
router.delete('/notes/:noteId', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  // Check if user owns the note
  const { data: existingNote, error: fetchError } = await supabaseAdmin
    .from('live_notes')
    .select('*')
    .eq('id', req.params.noteId)
    .single()
  
  if (fetchError || !existingNote) {
    return res.status(404).json({ error: 'Note not found' })
  }
  
  if (existingNote.author_email.toLowerCase() !== user_email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You can only delete your own notes.' })
  }
  
  const { error } = await supabaseAdmin
    .from('live_notes')
    .delete()
    .eq('id', req.params.noteId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
}))


export default router

// Generate LiveKit token for room access
router.post('/:sessionId/token', requireAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params
  const { identity, room } = req.body
  const userEmail = (req as any).user?.email

  if (!identity || !room) {
    return res.status(400).json({ error: 'Identity and room are required' })
  }

  try {
    // Check if LiveKit credentials are configured
    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      return res.status(500).json({ 
        error: 'LiveKit not configured. Please add LIVEKIT_API_KEY and LIVEKIT_API_SECRET to environment variables.' 
      })
    }

    // Create LiveKit access token
    const token = new AccessToken(
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET,
      {
        identity: identity,
        name: identity,
      }
    )

    // Grant permissions
    token.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const jwt = await token.toJwt()

    res.json({ token: jwt })
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error)
    res.status(500).json({ error: 'Failed to generate token' })
  }
}))
