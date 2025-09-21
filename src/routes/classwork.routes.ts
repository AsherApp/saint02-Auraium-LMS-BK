import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get all classwork for a teacher
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Get all live sessions for the teacher
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('live_sessions')
    .select('id, title, start_time, course_id')
    .eq('teacher_email', teacherEmail)
    .order('start_time', { ascending: false })

  if (sessionsError) {
    return res.status(500).json({ error: sessionsError.message })
  }

  // Get all classwork from all sessions
  const allClasswork = []
  for (const session of sessions || []) {
    const { data: classwork, error: classworkError } = await supabaseAdmin
      .from('live_classwork')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })

    if (!classworkError && classwork) {
      const sessionClasswork = classwork.map(item => ({
        ...item,
        session_title: session.title,
        session_id: session.id,
        course_id: session.course_id
      }))
      allClasswork.push(...sessionClasswork)
    }
  }

  res.json({ items: allClasswork })
}))

// Get classwork for a specific session
router.get('/session/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const sessionId = req.params.sessionId

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Verify the teacher owns this session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_email')
    .eq('id', sessionId)
    .eq('teacher_email', teacherEmail)
    .single()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found or access denied' })
  }

  // Get classwork for this session
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (classworkError) {
    return res.status(500).json({ error: classworkError.message })
  }

  res.json({ items: classwork || [] })
}))

// Create classwork for a session
router.post('/session/:sessionId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const sessionId = req.params.sessionId
  const { title, description, due_at } = req.body

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  if (!title) {
    return res.status(400).json({ error: 'Title is required' })
  }

  // Verify the teacher owns this session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('live_sessions')
    .select('id, teacher_email')
    .eq('id', sessionId)
    .eq('teacher_email', teacherEmail)
    .single()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found or access denied' })
  }

  // Create classwork
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .insert({
      session_id: sessionId,
      title,
      description,
      due_at: due_at ? new Date(due_at).toISOString() : null
    })
    .select()
    .single()

  if (classworkError) {
    return res.status(500).json({ error: classworkError.message })
  }

  res.json(classwork)
}))

// Update classwork
router.put('/:classworkId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const classworkId = req.params.classworkId
  const { title, description, due_at } = req.body

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Get the classwork and verify ownership through session
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .select(`
      *,
      live_sessions!inner(teacher_email)
    `)
    .eq('id', classworkId)
    .eq('live_sessions.teacher_email', teacherEmail)
    .single()

  if (classworkError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found or access denied' })
  }

  // Update classwork
  const { data: updatedClasswork, error: updateError } = await supabaseAdmin
    .from('live_classwork')
    .update({
      title,
      description,
      due_at: due_at ? new Date(due_at).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', classworkId)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.json(updatedClasswork)
}))

// Delete classwork
router.delete('/:classworkId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const classworkId = req.params.classworkId

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Get the classwork and verify ownership through session
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .select(`
      *,
      live_sessions!inner(teacher_email)
    `)
    .eq('id', classworkId)
    .eq('live_sessions.teacher_email', teacherEmail)
    .single()

  if (classworkError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found or access denied' })
  }

  // Delete classwork
  const { error: deleteError } = await supabaseAdmin
    .from('live_classwork')
    .delete()
    .eq('id', classworkId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.json({ success: true })
}))

// Get classwork submissions
router.get('/:classworkId/submissions', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const classworkId = req.params.classworkId

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Verify the teacher owns this classwork through session
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .select(`
      *,
      live_sessions!inner(teacher_email)
    `)
    .eq('id', classworkId)
    .eq('live_sessions.teacher_email', teacherEmail)
    .single()

  if (classworkError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found or access denied' })
  }

  // Get submissions for this classwork
  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('live_classwork_submissions')
    .select('*')
    .eq('classwork_id', classworkId)
    .order('submitted_at', { ascending: false })

  if (submissionsError) {
    return res.status(500).json({ error: submissionsError.message })
  }

  res.json({ items: submissions || [] })
}))

// Grade classwork submission
router.put('/:classworkId/submissions/:submissionId/grade', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const { classworkId, submissionId } = req.params
  const { grade, feedback } = req.body

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Verify the teacher owns this classwork through session
  const { data: classwork, error: classworkError } = await supabaseAdmin
    .from('live_classwork')
    .select(`
      *,
      live_sessions!inner(teacher_email)
    `)
    .eq('id', classworkId)
    .eq('live_sessions.teacher_email', teacherEmail)
    .single()

  if (classworkError || !classwork) {
    return res.status(404).json({ error: 'Classwork not found or access denied' })
  }

  // Update submission with grade and feedback
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('live_classwork_submissions')
    .update({
      grade,
      feedback,
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .eq('classwork_id', classworkId)
    .select()
    .single()

  if (submissionError) {
    return res.status(500).json({ error: submissionError.message })
  }

  res.json(submission)
}))

// Classwork Templates Routes

// Get all classwork templates for a teacher
router.get('/templates', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  const { data: templates, error } = await supabaseAdmin
    .from('classwork_templates')
    .select('*')
    .eq('teacher_email', teacherEmail)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ items: templates || [] })
}))

// Create a new classwork template
router.post('/templates', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const { title, description, type, content, estimated_duration } = req.body

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' })
  }

  const { data: template, error } = await supabaseAdmin
    .from('classwork_templates')
    .insert({
      teacher_email: teacherEmail,
      title,
      description: description || '',
      type,
      content: content || {},
      estimated_duration: estimated_duration || 0
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json(template)
}))

// Update a classwork template
router.put('/templates/:templateId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const templateId = req.params.templateId
  const { title, description, type, content, estimated_duration } = req.body

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Verify the teacher owns this template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('classwork_templates')
    .select('*')
    .eq('id', templateId)
    .eq('teacher_email', teacherEmail)
    .single()

  if (templateError || !template) {
    return res.status(404).json({ error: 'Template not found or access denied' })
  }

  const { data: updatedTemplate, error: updateError } = await supabaseAdmin
    .from('classwork_templates')
    .update({
      title,
      description,
      type,
      content,
      estimated_duration,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.json(updatedTemplate)
}))

// Delete a classwork template
router.delete('/templates/:templateId', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  const templateId = req.params.templateId

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }

  // Verify the teacher owns this template
  const { data: template, error: templateError } = await supabaseAdmin
    .from('classwork_templates')
    .select('*')
    .eq('id', templateId)
    .eq('teacher_email', teacherEmail)
    .single()

  if (templateError || !template) {
    return res.status(404).json({ error: 'Template not found or access denied' })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('classwork_templates')
    .delete()
    .eq('id', templateId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.json({ success: true })
}))

export default router
