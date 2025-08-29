import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Get all polls for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { courseId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own courses
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_email', userEmail)
      .single()

    if (courseError || !course) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  // Get polls
  const { data: polls, error: pollsError } = await supabaseAdmin
    .from('course_polls')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (pollsError) {
    return res.status(500).json({ error: pollsError.message })
  }

  res.json({ items: polls || [] })
}))

// Create a new poll (teacher only)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const {
    course_id,
    lesson_id,
    live_session_id,
    question,
    options,
    allow_multiple_votes
  } = req.body

  if (!course_id || !question || !options) {
    return res.status(400).json({ error: 'course_id, question, and options are required' })
  }

  // Check if teacher owns the course
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', course_id)
    .eq('teacher_email', userEmail)
    .single()

  if (courseError || !course) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Create poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('course_polls')
    .insert({
      course_id,
      lesson_id,
      live_session_id,
      question,
      options,
      allow_multiple_votes: allow_multiple_votes || false,
      created_by: userEmail
    })
    .select()
    .single()

  if (pollError) {
    return res.status(500).json({ error: pollError.message })
  }

  res.status(201).json(poll)
}))

// Get a specific poll
router.get('/:pollId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { pollId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('course_polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return res.status(404).json({ error: 'Poll not found' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own polls
    if (poll.created_by !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', poll.course_id)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  res.json(poll)
}))

// Submit poll response
router.post('/:pollId/respond', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { pollId } = req.params
  const { selected_options } = req.body
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('course_polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return res.status(404).json({ error: 'Poll not found' })
  }

  // Check if student is enrolled in the course
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('course_id', poll.course_id)
    .eq('student_email', userEmail)
    .single()

  if (enrollmentError || !enrollment) {
    return res.status(403).json({ error: 'Not enrolled in this course' })
  }

  // Check if student already responded
  const { data: existingResponse, error: responseError } = await supabaseAdmin
    .from('poll_responses')
    .select('*')
    .eq('poll_id', pollId)
    .eq('student_email', userEmail)
    .single()

  if (responseError && responseError.code !== 'PGRST116') {
    return res.status(500).json({ error: responseError.message })
  }

  let response
  if (existingResponse) {
    // Update existing response
    const { data: updatedResponse, error: updateError } = await supabaseAdmin
      .from('poll_responses')
      .update({
        selected_options: selected_options || []
      })
      .eq('id', existingResponse.id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }
    response = updatedResponse
  } else {
    // Create new response
    const { data: newResponse, error: createError } = await supabaseAdmin
      .from('poll_responses')
      .insert({
        poll_id: pollId,
        student_email: userEmail,
        selected_options: selected_options || []
      })
      .select()
      .single()

    if (createError) {
      return res.status(500).json({ error: createError.message })
    }
    response = newResponse
  }

  // Record progress
  await supabaseAdmin
    .from('student_progress')
    .upsert({
      student_email: userEmail,
      course_id: poll.course_id,
      progress_type: 'poll_responded',
      status: 'completed',
      metadata: { poll_id: pollId, selected_options }
    }, {
      onConflict: 'student_email,course_id,lesson_id,progress_type'
    })

  // Log activity
  await supabaseAdmin
    .from('student_activities')
    .insert({
      student_email: userEmail,
      course_id: poll.course_id,
      activity_type: 'poll_responded',
      description: 'Responded to poll',
      metadata: { poll_id: pollId }
    })

  res.json(response)
}))

// Get poll results (teacher only)
router.get('/:pollId/results', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { pollId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('course_polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return res.status(404).json({ error: 'Poll not found' })
  }

  // Check if teacher owns the poll
  if (poll.created_by !== userEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get all responses for this poll
  const { data: responses, error: responsesError } = await supabaseAdmin
    .from('poll_responses')
    .select(`
      *,
      students(name, email)
    `)
    .eq('poll_id', pollId)

  if (responsesError) {
    return res.status(500).json({ error: responsesError.message })
  }

  // Calculate results
  const totalResponses = responses?.length || 0
  const optionCounts: { [key: string]: number } = {}
  
  // Initialize counts for all options
  poll.options.forEach((option: string, index: number) => {
    optionCounts[index] = 0
  })

  // Count responses for each option
  responses?.forEach(response => {
    response.selected_options.forEach((optionIndex: number) => {
      if (optionCounts[optionIndex] !== undefined) {
        optionCounts[optionIndex]++
      }
    })
  })

  // Format results
  const results = poll.options.map((option: string, index: number) => ({
    option,
    index,
    count: optionCounts[index] || 0,
    percentage: totalResponses > 0 ? Math.round((optionCounts[index] || 0) / totalResponses * 100) : 0
  }))

  const result = {
    poll,
    total_responses: totalResponses,
    results,
    responses: responses || []
  }

  res.json(result)
}))

// Close a poll (teacher only)
router.post('/:pollId/close', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { pollId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get poll
  const { data: poll, error: pollError } = await supabaseAdmin
    .from('course_polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError || !poll) {
    return res.status(404).json({ error: 'Poll not found' })
  }

  // Check if teacher owns the poll
  if (poll.created_by !== userEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Close poll
  const { data: updatedPoll, error: updateError } = await supabaseAdmin
    .from('course_polls')
    .update({
      is_active: false
    })
    .eq('id', pollId)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.json(updatedPoll)
}))

export default router
