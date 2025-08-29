import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

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
    start_at: session.start_at,
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
  const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase()
  
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .select('*')
    .eq('teacher_email', teacher_email)
    .eq('status', 'scheduled')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
  
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  
  res.json({ items: data || [] })
}))

// Schedule a new live session
router.post('/schedule', requireAuth, asyncHandler(async (req, res) => {
  const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { title, description, scheduled_at, duration_minutes = 60 } = req.body
  
  if (!title || !scheduled_at) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      title,
      description,
      start_at: scheduled_at,
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
  const { course_id, module_id, title, description, start_at, session_type } = req.body
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

  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .insert({
      course_id: course_id || null,
      module_id: module_id || null,
      title,
      description,
      start_at: new Date(start_at).toISOString(),
      teacher_email,
      host_email: teacher_email, // Add this for compatibility
      status: 'scheduled', // Start as scheduled, not active
      session_type,
      is_started: false, // New field to track if teacher has started the session
      started_at: null // When teacher actually starts the session
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
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
  res.json(data)
}))

// Update session status
router.post('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body
  const { data, error } = await supabaseAdmin
    .from('live_sessions')
    .update({ 
      status,
      end_at: status === 'ended' ? new Date().toISOString() : null
    })
    .eq('id', req.params.id)
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

  const { data, error } = await query.order('start_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data to match frontend expectations
  const sessions = (data || []).map(session => ({
    id: session.id,
    courseId: session.course_id,
    moduleId: session.module_id,
    title: session.title,
    description: session.description,
    startAt: new Date(session.start_at).getTime(),
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
      .select('*')
      .eq('id', req.params.id)
      .eq('teacher_email', userEmail)
      .maybeSingle()
    data = result.data
    error = result.error
  } else if (userRole === 'student') {
    // Students can access any session (simplified approach)
    const result = await supabaseAdmin
      .from('live_sessions')
      .select('*')
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
    scheduled_at: data.start_at,
    duration: 60, // Default duration
    status: data.status,
    teacher_email: data.teacher_email,
    session_type: data.session_type,
    course_title: data.course_id ? 'Course Session' : 'General Session',
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
  const { data, error } = await supabaseAdmin
    .from('live_participants')
    .select('*')
    .eq('session_id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Add participant to a live session
router.post('/:id/participants', requireAuth, asyncHandler(async (req, res) => {
  const { email } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('live_participants')
    .insert({
      session_id: req.params.id,
      email: email.toLowerCase(),
      joined_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Join a session (with Zoom-like restrictions)
router.post('/:id/join', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const user_role = String(req.headers['x-user-role'] || '').toLowerCase()
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
    .eq('email', user_email)
    .single()

  if (existing) {
    return res.json({ message: 'Already joined', participant: existing })
  }

  // Insert new participant
  const { data, error } = await supabaseAdmin
    .from('live_participants')
    .insert({
      session_id,
      email: user_email,
      joined_at: new Date().toISOString()
    })
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
    .eq('email', user_email)

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
      start_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
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

// Get whiteboard strokes for a live session
router.get('/:id/whiteboard', requireAuth, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('live_whiteboard_strokes')
    .select('*')
    .eq('session_id', req.params.id)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Add whiteboard stroke
router.post('/:id/whiteboard', requireAuth, asyncHandler(async (req, res) => {
  const user_email = String(req.headers['x-user-email'] || '').toLowerCase()
  const { points, color, width } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('live_whiteboard_strokes')
    .insert({
      session_id: req.params.id,
      points: JSON.stringify(points),
      color,
      width,
      created_by: user_email,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Clear whiteboard
router.delete('/:id/whiteboard', requireAuth, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('live_whiteboard_strokes')
    .delete()
    .eq('session_id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
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