import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { message, course_id, title, priority } = req.body || {}
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized - Teachers only' })
  }
  
  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  // If course_id is provided, verify the teacher owns the course
  if (course_id) {
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('teacher_email', userEmail)
      .single()

    if (courseError || !course) {
      return res.status(403).json({ error: 'Access denied - Course not found or not owned by teacher' })
    }
  }

  // Create announcement
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ 
      teacher_email: userEmail, 
      message,
      title: title || 'Announcement',
      course_id: course_id || null,
      priority: priority || 'normal'
    })
    .select()
    .single()
    
  if (error) {
    console.error('Error creating announcement:', error)
    return res.status(500).json({ error: error.message })
  }
  
  res.status(201).json(data)
}))

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized - Teachers only' })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .eq('teacher_email', userEmail)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching announcements:', error)
    return res.status(500).json({ error: error.message })
  }
  
  res.json({ items: data || [] })
}))

router.get('/student', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get announcements from courses where the student is enrolled
  const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
    .from('enrollments')
    .select(`
      course_id,
      courses!inner(
        id,
        teacher_email
      )
    `)
    .eq('student_email', userEmail)

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError)
    return res.status(500).json({ error: 'Failed to fetch enrollments' })
  }

  if (!enrollments || enrollments.length === 0) {
    return res.json({ items: [] })
  }

  // Get teacher emails from enrolled courses
  const teacherEmails = [...new Set(enrollments.map(e => (e.courses as any).teacher_email))]

  // Get announcements from those teachers
  const { data: announcements, error: announcementsError } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .in('teacher_email', teacherEmails)
    .order('updated_at', { ascending: false })

  if (announcementsError) {
    console.error('Error fetching announcements:', announcementsError)
    return res.status(500).json({ error: 'Failed to fetch announcements' })
  }

  res.json({ items: announcements || [] })
}))

// Mark announcement as read
router.post('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Check if student has access to this announcement
  const { data: announcement, error: announcementError } = await supabaseAdmin
    .from('announcements')
    .select('teacher_email')
    .eq('id', id)
    .single()

  if (announcementError || !announcement) {
    return res.status(404).json({ error: 'Announcement not found' })
  }

  // Check if student is enrolled in any course by this teacher
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('student_email', userEmail)
    .eq('courses.teacher_email', announcement.teacher_email)
    .single()

  if (enrollmentError || !enrollment) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Mark as read (you might want to create a separate table for this)
  // For now, just return success
  res.json({ success: true })
}))

// Bookmark announcement
router.post('/:id/bookmark', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Check if student has access to this announcement
  const { data: announcement, error: announcementError } = await supabaseAdmin
    .from('announcements')
    .select('teacher_email')
    .eq('id', id)
    .single()

  if (announcementError || !announcement) {
    return res.status(404).json({ error: 'Announcement not found' })
  }

  // Check if student is enrolled in any course by this teacher
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('student_email', userEmail)
    .eq('courses.teacher_email', announcement.teacher_email)
    .single()

  if (enrollmentError || !enrollment) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Add bookmark (you might want to create a separate table for this)
  // For now, just return success
  res.json({ success: true })
}))

// Unbookmark announcement
router.post('/:id/unbookmark', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Check if student has access to this announcement
  const { data: announcement, error: announcementError } = await supabaseAdmin
    .from('announcements')
    .select('teacher_email')
    .eq('id', id)
    .single()

  if (announcementError || !announcement) {
    return res.status(404).json({ error: 'Announcement not found' })
  }

  // Check if student is enrolled in any course by this teacher
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('student_email', userEmail)
    .eq('courses.teacher_email', announcement.teacher_email)
    .single()

  if (enrollmentError || !enrollment) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Remove bookmark (you might want to create a separate table for this)
  // For now, just return success
  res.json({ success: true })
}))

// Delete announcement (teacher only)
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const teacherEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!teacherEmail || userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Check if teacher owns this announcement
  const { data: announcement, error: announcementError } = await supabaseAdmin
    .from('announcements')
    .select('teacher_email')
    .eq('id', id)
    .single()

  if (announcementError || !announcement) {
    return res.status(404).json({ error: 'Announcement not found' })
  }

  if (announcement.teacher_email !== teacherEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Delete the announcement
  const { error: deleteError } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting announcement:', deleteError)
    return res.status(500).json({ error: 'Failed to delete announcement' })
  }

  res.json({ success: true })
}))

