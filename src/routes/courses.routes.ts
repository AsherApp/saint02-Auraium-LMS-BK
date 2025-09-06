import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { env } from '../config/env.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Only return courses created by this teacher
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('teacher_email', teacherEmail)
    .order('created_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, teacher_email, status, visibility, enrollment_policy, course_mode, thumbnail_url } = req.body || {}
  if (!title || !teacher_email) return res.status(400).json({ error: 'missing_fields' })
  
  // Get teacher's course settings to apply defaults
  let courseSettings = {
    default_course_duration: 60,
    auto_publish_courses: false,
    allow_student_discussions: true
  }
  
  try {
    // Get teacher ID from email
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('email', teacher_email)
      .single()
    
    if (teacher && !teacherError) {
      // Fetch teacher's course settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('teacher_settings')
        .select('course_settings')
        .eq('teacher_id', teacher.id)
        .single()
      
      if (settings && !settingsError && settings.course_settings) {
        courseSettings = settings.course_settings
      }
    }
  } catch (error) {
    console.log('Could not fetch teacher settings, using defaults:', error)
  }
  
  // Apply settings to course creation
  const courseData = {
    title,
    description,
    teacher_email,
    status: status || (courseSettings.auto_publish_courses ? 'published' : 'draft'),
    visibility: visibility || 'private',
    enrollment_policy: enrollment_policy || 'invite_only',
    allow_discussions: courseSettings.allow_student_discussions,
    default_duration: courseSettings.default_course_duration,
    course_mode: course_mode || 'normal',
    thumbnail_url: thumbnail_url || null
  }
  
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert(courseData)
    .select()
    .single()
    
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}))

// Public mode course endpoint (no auth required)
router.get('/public/:id', asyncHandler(async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .eq('course_mode', 'public')
      .eq('status', 'published')
      .single()
    
    if (error || !data) {
      return res.status(404).json({ error: 'Public course not found' })
    }
    
    // Return only basic course information for public mode
    const publicCourseData = {
      id: data.id,
      title: data.title,
      description: data.description,
      course_mode: data.course_mode,
      status: data.status,
      created_at: data.created_at,
      teacher_name: data.teacher_name || 'Unknown Instructor'
    }
    
    res.json(publicCourseData)
  } catch (error) {
    console.error('Public course fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch public course' })
  }
}))

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  let data, error
  
  if (userRole === 'teacher') {
    // Teachers can only access their own courses
    const result = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .eq('teacher_email', userEmail)
      .single()
    data = result.data
    error = result.error
  } else if (userRole === 'student') {
    // Students can access courses they're enrolled in
    const result = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .eq('enrollments.student_email', userEmail)
      .single()
    data = result.data
    error = result.error
    
    // If no direct match, check if student is enrolled in this course
    if (error || !data) {
      const enrollmentCheck = await supabaseAdmin
        .from('enrollments')
        .select('course_id')
        .eq('course_id', req.params.id)
        .eq('student_email', userEmail)
        .single()
      
      if (enrollmentCheck.data) {
        // Student is enrolled, get the course
        const courseResult = await supabaseAdmin
          .from('courses')
          .select('*')
          .eq('id', req.params.id)
          .single()
        data = courseResult.data
        error = courseResult.error
      }
    }
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }
  
  if (error) return res.status(404).json({ error: 'Course not found or access denied' })
  res.json(data)
}))

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  const { title, description, status, course_mode, thumbnail_url, visibility, enrollment_policy } = req.body || {}
  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (status !== undefined) updateData.status = status
  if (course_mode !== undefined) updateData.course_mode = course_mode
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
  if (visibility !== undefined) updateData.visibility = visibility
  if (enrollment_policy !== undefined) updateData.enrollment_policy = enrollment_policy
  
  // Only update course if it belongs to this teacher
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(updateData)
    .eq('id', req.params.id)
    .eq('teacher_email', teacherEmail)
    .select()
    .single()
  
  if (error) return res.status(404).json({ error: 'Course not found or access denied' })
  res.json(data)
}))

router.get('/:id/roster', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  let hasAccess = false
  
  if (userRole === 'teacher') {
    // Teachers can access full roster for their own courses
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', req.params.id)
      .eq('teacher_email', userEmail)
      .single()
    hasAccess = !!course
  } else if (userRole === 'student') {
    // Students can access basic enrollment info for courses they're enrolled in
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('course_id', req.params.id)
      .eq('student_email', userEmail)
      .single()
    hasAccess = !!enrollment
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }
  
  if (!hasAccess) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  // Get enrollments for this course
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      students(name, email, status)
    `)
    .eq('course_id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  
  if (userRole === 'teacher') {
    // Teachers get full roster with all student details
    const enhancedEnrollments = (data || []).map(enrollment => ({
      ...enrollment,
      name: enrollment.students?.name || enrollment.email,
      enrolled_at: enrollment.enrolled_at || enrollment.created_at,
      progress_percentage: enrollment.progress_percentage || 0,
      last_activity: enrollment.last_activity || enrollment.updated_at,
      grade_percentage: enrollment.grade_percentage,
      student_id: enrollment.student_id || `STU${enrollment.id?.substr(0, 8).toUpperCase()}`,
      state: enrollment.state || 'active'
    }))
    
    res.json({ items: enhancedEnrollments })
  } else {
    // Students get basic enrollment count and their own enrollment info
    const studentEnrollment = (data || []).find(e => e.student_email === userEmail)
    const enrollmentCount = (data || []).length
    
    res.json({ 
      items: studentEnrollment ? [studentEnrollment] : [],
      total_enrollments: enrollmentCount,
      student_enrollment: studentEnrollment ? {
        enrolled_at: studentEnrollment.enrolled_at || studentEnrollment.created_at,
        progress_percentage: studentEnrollment.progress_percentage || 0,
        last_activity: studentEnrollment.last_activity || studentEnrollment.updated_at,
        grade_percentage: studentEnrollment.grade_percentage,
        status: studentEnrollment.status || 'active'
      } : null
    })
  }
}))

router.get('/:id/assignments', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated user's email and role
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  if (!userEmail) {
    return res.status(401).json({ error: 'User email not found in request' })
  }
  
  let hasAccess = false
  
  if (userRole === 'teacher') {
    // Teachers can access assignments for their own courses
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', req.params.id)
      .eq('teacher_email', userEmail)
      .single()
    hasAccess = !!course
  } else if (userRole === 'student') {
    // Students can access assignments for courses they're enrolled in
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('course_id', req.params.id)
      .eq('student_email', userEmail)
      .single()
    hasAccess = !!enrollment
  } else {
    return res.status(403).json({ error: 'Invalid user role' })
  }
  
  if (!hasAccess) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  // Get assignments for this course
  const { data, error } = await supabaseAdmin
    .from('assignments')
    .select('*')
    .eq('course_id', req.params.id)
    .order('created_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

router.post('/:id/enroll', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  const { student_email } = req.body || {}
  if (!student_email) return res.status(400).json({ error: 'missing_student' })
  
  // First verify the course belongs to this teacher
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('teacher_email')
    .eq('id', req.params.id)
    .eq('teacher_email', teacherEmail)
    .single()
  
  if (courseError || !course) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  // enforce free tier cap by teacher
  const { data: t } = await supabaseAdmin.from('teachers').select('max_students_allowed').eq('email', teacherEmail).single()
  const { count } = await supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', req.params.id)
  const maxAllowed = t?.max_students_allowed ?? env.FREE_STUDENTS_LIMIT
  if ((count || 0) >= maxAllowed) return res.status(402).json({ error: 'limit_reached' })
  
  const { error } = await supabaseAdmin.from('enrollments').insert({ course_id: req.params.id, student_email })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}))

// Delete a course
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const courseId = req.params.id
  const teacherEmail = (req as any).user?.email
  
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Check if the course exists and belongs to the teacher
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('teacher_email', teacherEmail)
    .single()
  
  if (courseError || !course) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  // Delete the course (cascade will handle related records)
  const { error: deleteError } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', courseId)
  
  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }
  
  res.json({ ok: true, message: 'Course deleted successfully' })
}))

// Duplicate a course
router.post('/:id/duplicate', requireAuth, asyncHandler(async (req, res) => {
  const courseId = req.params.id
  const teacherEmail = (req as any).user?.email
  
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Get the original course
  const { data: originalCourse, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('teacher_email', teacherEmail)
    .single()
  
  if (courseError || !originalCourse) {
    return res.status(404).json({ error: 'Course not found or access denied' })
  }
  
  // Create the duplicated course
  const duplicatedCourse = {
    ...originalCourse,
    id: undefined, // Let the database generate a new ID
    title: `${originalCourse.title} (Copy)`,
    created_at: undefined, // Let the database set the current timestamp
    updated_at: undefined
  }
  
  const { data: newCourse, error: insertError } = await supabaseAdmin
    .from('courses')
    .insert(duplicatedCourse)
    .select()
    .single()
  
  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }
  
  // Duplicate modules and lessons
  const { data: modules, error: modulesError } = await supabaseAdmin
    .from('modules')
    .select(`
      *,
      lessons(*)
    `)
    .eq('course_id', courseId)
  
  if (modulesError) {
    return res.status(500).json({ error: modulesError.message })
  }
  
  // Insert duplicated modules and lessons
  for (const module of modules || []) {
    const { data: newModule, error: moduleInsertError } = await supabaseAdmin
      .from('modules')
      .insert({
        course_id: newCourse.id,
        title: module.title,
        position: module.position
      })
      .select()
      .single()
    
    if (moduleInsertError) {
      console.error('Error duplicating module:', moduleInsertError)
      continue
    }
    
    // Duplicate lessons for this module
    if (module.lessons && module.lessons.length > 0) {
      for (const lesson of module.lessons) {
        await supabaseAdmin
          .from('lessons')
          .insert({
            module_id: newModule.id,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            position: lesson.position
          })
      }
    }
  }
  
  res.json({ 
    ok: true, 
    message: 'Course duplicated successfully',
    course: newCourse
  })
}))

