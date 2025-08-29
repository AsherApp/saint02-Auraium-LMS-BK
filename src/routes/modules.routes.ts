import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get modules for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  const { courseId } = req.params
  let hasAccess = false
  
  if (userRole === 'teacher') {
    // Teachers can access modules for their own courses
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_email', userEmail)
      .single()
    hasAccess = !!course
  } else if (userRole === 'student') {
    // Students can access modules for courses they're enrolled in
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('course_id', courseId)
      .eq('student_email', userEmail)
      .single()
    hasAccess = !!enrollment
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }
  
  if (!hasAccess) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get a specific module
router.get('/:moduleId', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  const { moduleId } = req.params
  let hasAccess = false
  
  if (userRole === 'teacher') {
    // Teachers can access modules for their own courses
    const { data: module } = await supabaseAdmin
      .from('modules')
      .select(`
        *,
        courses!inner(teacher_email)
      `)
      .eq('id', moduleId)
      .eq('courses.teacher_email', userEmail)
      .single()
    hasAccess = !!module
  } else if (userRole === 'student') {
    // Students can access modules for courses they're enrolled in
    // First check if the student is enrolled in the course that contains this module
    const { data: module } = await supabaseAdmin
      .from('modules')
      .select('course_id')
      .eq('id', moduleId)
      .single()
    
    if (module) {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('course_id')
        .eq('course_id', module.course_id)
        .eq('student_email', userEmail)
        .single()
      hasAccess = !!enrollment
    }
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }
  
  if (!hasAccess) {
    return res.status(404).json({ error: 'Module not found or access denied' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Create a new module
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { course_id, title, description } = req.body
  const teacher_email = (req as any).user?.email?.toLowerCase()
  
  if (!course_id || !title) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  if (!teacher_email) {
    return res.status(401).json({ error: 'user_email_not_found' })
  }

  // Verify the teacher owns the course
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('teacher_email')
    .eq('id', course_id)
    .single()

  if (courseError || course?.teacher_email !== teacher_email) {
    return res.status(403).json({ error: 'unauthorized' })
  }

  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({
      course_id,
      title,
      description: description || ''
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Update a module
router.put('/:moduleId', requireAuth, asyncHandler(async (req, res) => {
  const { moduleId } = req.params
  const updateData = req.body
  const teacher_email = (req as any).user?.email?.toLowerCase()
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'user_email_not_found' })
  }

  // Verify the teacher owns the module
  const { data: module, error: moduleError } = await supabaseAdmin
    .from('modules')
    .select(`
      *,
      courses!inner(teacher_email)
    `)
    .eq('id', moduleId)
    .eq('courses.teacher_email', teacher_email)
    .single()

  if (moduleError || !module) {
    return res.status(403).json({ error: 'unauthorized' })
  }

  const { data, error } = await supabaseAdmin
    .from('modules')
    .update(updateData)
    .eq('id', moduleId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}))

// Delete a module
router.delete('/:moduleId', requireAuth, asyncHandler(async (req, res) => {
  const { moduleId } = req.params
  const teacher_email = (req as any).user?.email?.toLowerCase()
  
  if (!teacher_email) {
    return res.status(401).json({ error: 'user_email_not_found' })
  }

  // Verify the teacher owns the module
  const { data: module, error: moduleError } = await supabaseAdmin
    .from('modules')
    .select(`
      *,
      courses!inner(teacher_email)
    `)
    .eq('id', moduleId)
    .eq('courses.teacher_email', teacher_email)
    .single()

  if (moduleError || !module) {
    return res.status(403).json({ error: 'unauthorized' })
  }

  const { error } = await supabaseAdmin
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})) 