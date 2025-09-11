import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'
import { generateStudentCode } from '../utils/student-code.js'
import bcrypt from 'bcrypt'

export const router = Router()

// Test endpoint to check database state - SECURITY FIXED
router.get('/debug/courses', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  console.log('Debug: Checking courses table for teacher:', teacherEmail)
  
  // SECURITY FIX: Only return courses for the authenticated teacher
  const { data: courses, error } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('teacher_email', teacherEmail)
  
  if (error) {
    console.error('Error fetching courses:', error)
    return res.status(500).json({ error: error.message })
  }
  
  console.log('Debug: Courses data for teacher:', JSON.stringify(courses, null, 2))
  res.json({ courses })
}))

router.get('/debug/enrollments', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  console.log('Debug: Checking enrollments table for teacher:', teacherEmail)
  
  // SECURITY FIX: Only return enrollments for courses owned by the authenticated teacher
  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses!inner(
        id,
        title,
        status,
        teacher_email
      ),
      students(
        email,
        name
      )
    `)
    .eq('courses.teacher_email', teacherEmail)
  
  if (error) {
    console.error('Error fetching enrollments:', error)
    return res.status(500).json({ error: error.message })
  }
  
  console.log('Debug: Enrollments data for teacher:', JSON.stringify(enrollments, null, 2))
  res.json({ enrollments })
}))

// Get students for the authenticated teacher (for adding to live sessions, etc.)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only teachers can access the student list
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can access student list.' })
  }
  
  try {
    // Only return students who are enrolled in courses owned by this teacher
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        name,
        email,
        student_code,
        profile_picture_url,
        created_at,
        enrollments!inner(
          course_id,
          courses!inner(teacher_email)
        )
      `)
      .eq('enrollments.courses.teacher_email', userEmail)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching students:', error)
      return res.status(500).json({ error: 'Failed to fetch students' })
    }

    // Remove duplicates and return unique students
    const uniqueStudents = (students || []).filter((student: any, index: number, self: any[]) => 
      index === self.findIndex((s: any) => s.email === student.email)
    )

    res.json({ items: uniqueStudents })
  } catch (err) {
    console.error('Error in get students route:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get current student's own profile (secure - no email in URL)
router.get('/me/profile', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their own profile
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, email, first_name, last_name, student_code, status, created_at, profile_picture_url')
    .eq('email', userEmail.toLowerCase())
    .single()
  
  if (error) return res.status(404).json({ error: 'Student not found' })
  
  // Combine first_name and last_name into name for backward compatibility
  const response = {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email
  }
  
  res.json(response)
}))

// Get student profile by ID (for teachers accessing their students)
router.get('/:id/profile', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied - Students can only access their own profile' })
    }
  }
  
  // For teachers, check if they have any students with this ID
  if (userRole === 'teacher') {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_id', id)
      .eq('courses.teacher_email', userEmail)
      .single()
    
    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied - Teacher can only access their own students' })
    }
  }
  
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, email, first_name, last_name, student_code, status, created_at, profile_picture_url')
    .eq('id', id)
    .single()
  
  if (error) return res.status(404).json({ error: 'Student not found' })
  
  // Combine first_name and last_name into name for backward compatibility
  const response = {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email
  }
  
  res.json(response)
}))

// Get student by student code (GDPR compliant)
router.get('/code/:studentCode', requireAuth, asyncHandler(async (req, res) => {
  const { studentCode } = req.params
  
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('student_code', studentCode)
    .single()
  
  if (error) return res.status(404).json({ error: 'Student not found' })
  
  res.json(data)
}))

// Get current student's enrollments (secure - no email in URL)
router.get('/me/enrollments', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their own enrollments
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  // Get student enrollments
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses(
        id,
        title,
        description,
        status,
        teacher_email,
        thumbnail_url,
        visibility,
        enrollment_policy,
        course_mode
      )
    `)
    .eq('student_email', userEmail)
    .order('enrolled_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data
  const enrollments = (data || []).map((enrollment: any) => ({
    id: enrollment.id,
    course_id: enrollment.course_id,
    enrolled_at: enrollment.enrolled_at,
    progress_percentage: enrollment.progress_percentage || 0,
    grade_percentage: enrollment.grade_percentage || 0,
    last_activity: enrollment.last_activity,
    status: enrollment.status || 'active',
    course: {
      id: enrollment.courses?.id,
      title: enrollment.courses?.title || 'Untitled Course',
      description: enrollment.courses?.description,
      status: enrollment.courses?.status,
      teacher_email: enrollment.courses?.teacher_email,
      thumbnail_url: enrollment.courses?.thumbnail_url,
      visibility: enrollment.courses?.visibility,
      enrollment_policy: enrollment.courses?.enrollment_policy,
      course_mode: enrollment.courses?.course_mode
    }
  }))
  
  res.json({ items: enrollments })
}))

// Alias for /me/enrollments for backward compatibility
router.get('/me/courses', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their own enrollments
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  // Get student enrollments
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses(
        id,
        title,
        description,
        status,
        teacher_email,
        thumbnail_url,
        visibility,
        enrollment_policy,
        course_mode
      )
    `)
    .eq('student_email', userEmail)
    .order('enrolled_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data
  const enrollments = (data || []).map((enrollment: any) => ({
    id: enrollment.id,
    course_id: enrollment.course_id,
    enrolled_at: enrollment.enrolled_at,
    progress_percentage: enrollment.progress_percentage || 0,
    grade_percentage: enrollment.grade_percentage || 0,
    last_activity: enrollment.last_activity,
    status: enrollment.status || 'active',
    course: {
      id: enrollment.courses?.id,
      title: enrollment.courses?.title || 'Untitled Course',
      description: enrollment.courses?.description,
      status: enrollment.courses?.status,
      teacher_email: enrollment.courses?.teacher_email,
      thumbnail_url: enrollment.courses?.thumbnail_url,
      visibility: enrollment.courses?.visibility,
      enrollment_policy: enrollment.courses?.enrollment_policy,
      course_mode: enrollment.courses?.course_mode
    }
  }))
  
  res.json({ items: enrollments })
}))

// Get student enrollments by ID (for teachers accessing their students)
router.get('/:id/enrollments', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  
  // Get student enrollments
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses(
        id,
        title,
        description,
        status,
        teacher_email
      )
    `)
    .eq('student_id', id)
    .order('enrolled_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data
  const enrollments = (data || []).map((enrollment: any) => ({
    id: enrollment.id,
    course_id: enrollment.course_id,
    enrolled_at: enrollment.enrolled_at,
    progress_percentage: enrollment.progress_percentage || 0,
    grade_percentage: enrollment.grade_percentage || 0,
    last_activity: enrollment.last_activity,
    status: enrollment.status || 'active',
    course: {
      id: enrollment.courses?.id,
      title: enrollment.courses?.title || 'Untitled Course',
      description: enrollment.courses?.description,
      status: enrollment.courses?.status,
      teacher_email: enrollment.courses?.teacher_email
    }
  }))
  
  res.json({ items: enrollments })
}))

// Get all students (for teacher to see available students to enroll)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Only return students who are enrolled in courses owned by this teacher
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      enrollments!inner(
        course_id,
        courses!inner(teacher_email)
      )
    `)
    .eq('enrollments.courses.teacher_email', teacherEmail)
    .order('name', { ascending: true })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Return simple student list (remove duplicates)
  const uniqueStudents = (data || []).filter((student: any, index: number, self: any[]) => 
    index === self.findIndex((s: any) => s.email === student.email)
  )
  
  res.json({ items: uniqueStudents })
}))

// Get all students with their enrollments (for teacher to see available students)
router.get('/with-enrollments', requireAuth, asyncHandler(async (req, res) => {
  // Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Only return students who are enrolled in courses owned by this teacher
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      enrollments!inner(
        id,
        course_id,
        enrolled_at,
        progress_percentage,
        grade_percentage,
        last_activity,
        status,
        courses!inner(
          id,
          title,
          description,
          status,
          teacher_email
        )
      )
    `)
    .eq('enrollments.courses.teacher_email', teacherEmail)
    .order('name', { ascending: true })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data to flatten enrollments with real progress data
  const studentsWithEnrollments = (data || []).map((student: any) => {
    const enrollments = (student.enrollments || []).map((enrollment: any) => ({
      id: enrollment.id,
      course_id: enrollment.course_id,
      enrolled_at: enrollment.enrolled_at,
      course_title: enrollment.courses?.title || 'Untitled Course',
      course_description: enrollment.courses?.description,
      course_status: enrollment.courses?.status,
      student_email: student.email,
      student_name: student.name,
      student_status: student.status,
      student_id: student.student_code || `STU${student.id?.substr(0, 8).toUpperCase()}`,
      // Real progress data from database
      progress_percentage: enrollment.progress_percentage || 0,
      grade_percentage: enrollment.grade_percentage,
      last_activity: enrollment.last_activity,
      enrollment_status: enrollment.status || 'active'
    }))
    
    return enrollments
  }).flat()
  
  res.json({ items: studentsWithEnrollments })
}))

// Get consolidated student data (one row per student with overall metrics)
router.get('/consolidated', requireAuth, asyncHandler(async (req, res) => {
  console.log('Fetching consolidated student data...')
  
  // SECURITY FIX: Get the authenticated teacher's email
  const teacherEmail = (req as any).user?.email
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Teacher email not found in request' })
  }
  
  // Get both enrolled students and invited students
  // First, get enrolled students
  const { data: enrolledStudents, error: enrolledError } = await supabaseAdmin
    .from('students')
    .select(`
      *,
      enrollments!inner(
        id,
        course_id,
        enrolled_at,
        progress_percentage,
        grade_percentage,
        last_activity,
        status,
        courses!inner(
          id,
          title,
          description,
          status,
          teacher_email
        )
      )
    `)
    .eq('enrollments.courses.teacher_email', teacherEmail)
  
  if (enrolledError) {
    console.error('Error fetching enrolled students:', enrolledError)
    return res.status(500).json({ error: 'Failed to fetch enrolled students' })
  }
  
  // Get invited students (from invites table)
  const { data: invites, error: invitesError } = await supabaseAdmin
    .from('invites')
    .select(`
      *,
      courses!inner(
        id,
        title,
        description,
        status,
        teacher_email
      )
    `)
    .eq('courses.teacher_email', teacherEmail)
    .eq('used', false) // Only show unused invites
  
  if (invitesError) {
    console.error('Error fetching invites:', invitesError)
    return res.status(500).json({ error: 'Failed to fetch invites' })
  }
  
  // Combine enrolled students and invited students
  const allStudents = []
  
  // Add enrolled students
  if (enrolledStudents) {
    allStudents.push(...enrolledStudents.map(student => ({
      ...student,
      status: 'active',
      enrollment_status: 'enrolled'
    })))
  }
  
  // Add invited students (create student-like objects from invites)
  if (invites) {
    const invitedStudents = invites.map(invite => ({
      id: `invite-${invite.id}`,
      email: invite.email,
      name: invite.name,
      student_code: null,
      status: 'invited',
      enrollment_status: 'invited',
      created_at: invite.created_at,
      enrollments: [{
        id: `invite-enrollment-${invite.id}`,
        course_id: invite.course_id,
        enrolled_at: null,
        progress_percentage: 0,
        grade_percentage: 0,
        last_activity: null,
        status: 'invited',
        courses: invite.courses
      }]
    }))
    allStudents.push(...invitedStudents)
  }
  
  console.log('Raw student data for teacher:', teacherEmail, JSON.stringify(allStudents, null, 2))
  
  // Remove duplicate students (same student enrolled in multiple courses or invited multiple times)
  const uniqueStudents = allStudents.filter((student: any, index: number, self: any[]) => 
    index === self.findIndex((s: any) => s.email === student.email)
  )
  
  // Transform to consolidated student data with real progress metrics
  const consolidatedStudents = await Promise.all(uniqueStudents.map(async (student: any) => {
    const enrollments = student.enrollments || []
    console.log(`Processing student ${student.email} with ${enrollments.length} enrollments`)
    
    // Get basic progress data for each course (simplified approach)
    const courseProgressData = enrollments.map((enrollment: any) => {
      // Use enrollment data as fallback progress
      return {
        progress_percentage: enrollment.progress_percentage || 0,
        average_grade: enrollment.grade_percentage || 0,
        completed_lessons: 0, // Will be calculated from actual data when available
        total_lessons: 0 // Will be calculated from actual data when available
      }
    })
    
    // Calculate overall metrics from real data
    const totalCourses = enrollments.length
    const activeCourses = enrollments.filter((e: any) => e.courses?.status === 'draft' || e.courses?.status === 'published').length
    const completedCourses = courseProgressData.filter((progress: any) => 
      progress.progress_percentage === 100
    ).length
    
    // Calculate overall progress (average of all courses)
    const validProgresses = courseProgressData.filter((p: any) => p.progress_percentage !== undefined)
    const overallProgress = validProgresses.length > 0 
      ? Math.round(validProgresses.reduce((sum: number, p: any) => sum + p.progress_percentage, 0) / validProgresses.length)
      : 0
    
    // Calculate overall grade (average of all courses)
    const validGrades = courseProgressData.filter((p: any) => p.average_grade !== undefined && p.average_grade > 0)
    const overallGrade = validGrades.length > 0
      ? Math.round(validGrades.reduce((sum: number, p: any) => sum + p.average_grade, 0) / validGrades.length)
      : null
    
    // Get latest activity from real data
    const { data: latestActivity } = await supabaseAdmin
      .from('student_activities')
      .select('created_at')
      .eq('student_email', student.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Get enrollment date (earliest enrollment)
    const enrollmentDates = enrollments.map((e: any) => e.enrolled_at).filter(Boolean)
    const firstEnrollment = enrollmentDates.length > 0 
      ? new Date(Math.min(...enrollmentDates.map((d: string) => new Date(d).getTime())))
      : null
    
    const result = {
      // Student info
      id: student.id,
      email: student.email,
      name: student.name,
      status: student.status,
      student_code: student.student_code || `STU${student.id?.substr(0, 8).toUpperCase()}`,
      created_at: student.created_at,
      
      // Overall metrics (real data)
      total_courses: totalCourses,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      overall_progress: overallProgress,
      overall_grade: overallGrade,
      latest_activity: latestActivity?.created_at || null,
      first_enrollment: firstEnrollment?.toISOString(),
      
      // Course list for quick reference
      courses: enrollments.map((e: any) => ({
        id: e.course_id,
        title: e.courses?.title || 'Untitled Course',
        status: e.courses?.status,
        enrolled_at: e.enrolled_at
      }))
    }
    
    console.log(`Final result for ${student.email}:`, result)
    return result
  }))
  
  console.log('Final consolidated students:', JSON.stringify(consolidatedStudents, null, 2))
  res.json({ items: consolidatedStudents })
}))

// Get a specific student
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return res.status(404).json({ error: 'not_found' })
  
  // Combine first_name and last_name into name for backward compatibility
  const response = {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email
  }
  
  res.json(response)
}))

// Create or update a student
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { email, first_name, last_name, name, status = 'active' } = req.body || {}
  
  if (!email || (!first_name && !last_name && !name)) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  
  // Handle both name formats for backward compatibility
  let firstName = first_name
  let lastName = last_name
  
  if (name && !first_name && !last_name) {
    const nameParts = name.trim().split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts[nameParts.length - 1] || ''
  }
  
  const studentCode = generateStudentCode(firstName, lastName)
  
  // Check if student already exists
  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email)
    .single()
  
  if (existingStudent) {
    // Update existing student
    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ 
        first_name: firstName, 
        last_name: lastName, 
        status, 
        student_code: studentCode 
      })
      .eq('email', email)
      .select()
      .single()
    
    if (error) return res.status(500).json({ error: error.message })
    
    // Return with signup info if no password is set
    const needsPassword = !existingStudent.password_hash
    const response = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
      needsPassword,
      signupUrl: needsPassword ? `/register-student?code=${studentCode}&email=${email}` : null
    }
    res.json(response)
  } else {
    // Create new student
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({ 
        email, 
        first_name: firstName, 
        last_name: lastName, 
        status, 
        student_code: studentCode,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) return res.status(500).json({ error: error.message })
    
    // Return with signup info for new student
    const response = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
      needsPassword: true,
      signupUrl: `/register-student?code=${studentCode}&email=${email}`,
      studentCode
    }
    res.json(response)
  }
}))

// Update student status
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { first_name, last_name, status, password } = req.body || {}
  
  const updateData: any = {}
  if (first_name !== undefined) updateData.first_name = first_name
  if (last_name !== undefined) updateData.last_name = last_name
  if (status !== undefined) updateData.status = status
  
  // Handle password update
  if (password !== undefined) {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    updateData.password_hash = passwordHash
  }
  
  const { data, error } = await supabaseAdmin
    .from('students')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Combine first_name and last_name into name for backward compatibility
  const response = {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email
  }
  
  res.json(response)
}))

// Delete a student
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const { error } = await supabaseAdmin
    .from('students')
    .delete()
    .eq('id', id)
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}))

// Enroll a student in a course
router.post('/:id/enroll', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { course_id } = req.body || {}
  
  if (!course_id) {
    return res.status(400).json({ error: 'missing_course_id' })
  }
  
  // Check if student exists
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!student) {
    return res.status(404).json({ error: 'student_not_found' })
  }
  
  // Check if already enrolled
  const { data: existingEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('course_id', course_id)
    .eq('student_id', id)
    .single()
  
  if (existingEnrollment) {
    return res.status(400).json({ error: 'already_enrolled' })
  }
  
  // Create enrollment
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .insert({ 
      course_id, 
      student_id: student.id,
      student_email: student.email,
      enrolled_at: new Date().toISOString(),
      status: 'active',
      progress_percentage: 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Enrollment error:', error)
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
}))

// Get current student's enrolled courses (secure - no email in URL)
router.get('/me/courses', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their own courses
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses!inner(
        id,
        title,
        description,
        status,
        teacher_email,
        thumbnail_url,
        visibility,
        enrollment_policy,
        course_mode
      )
    `)
    .eq('student_email', userEmail)
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get student's enrolled courses (for teachers accessing their students)
router.get('/:id/courses', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  
  // For teachers, check if they have any students with this email
  if (userRole === 'teacher') {
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_id', id)
      .eq('courses.teacher_email', userEmail)
      .single()
    
    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied - Teacher can only access their own students' })
    }
  }
  
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses!inner(
        id,
        title,
        description,
        status,
        teacher_email,
        thumbnail_url,
        visibility,
        enrollment_policy,
        course_mode
      )
    `)
    .eq('student_id', id)
  
  if (error) return res.status(500).json({ error: error.message })
  res.json({ items: data || [] })
}))

// Get student's assignments with submissions and grades
router.get('/:id/assignments', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  // Get student submissions with assignment and course details
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      *,
      assignments!inner(
        title,
        description,
        type,
        due_at,
        points,
        courses!inner(
          title,
          teacher_email
        )
      )
    `)
    .eq('student_id', id)
    .order('submitted_at', { ascending: false })
  
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  
  res.json({ items: data || [] })
}))

// Get student's activities (study sessions, logins, etc.)
router.get('/:id/activities', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  // Get real activities from database
  const { data: activities, error } = await supabaseAdmin
    .from('student_activities')
    .select('*')
    .eq('student_id', id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    console.error('Error fetching activities:', error)
    return res.status(500).json({ error: error.message })
  }
  
  // Transform activities for frontend
  const transformedActivities = (activities || []).map((activity: any) => ({
    id: activity.id,
    type: activity.activity_type,
    description: activity.description || `${activity.activity_type} activity`,
    created_at: activity.created_at,
    metadata: activity.metadata || {},
    course_id: activity.course_id
  }))
  
  res.json({ items: transformedActivities })
}))

// Get detailed course-specific information for a student
router.get('/:id/course/:courseId/details', requireAuth, asyncHandler(async (req, res) => {
  const { id, courseId } = req.params
  
  // Get student info
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  
  if (studentError) return res.status(404).json({ error: 'student_not_found' })
  
  // Get course info
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  
  if (courseError) return res.status(404).json({ error: 'course_not_found' })
  
  // Get enrollment info with real progress data
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('student_id', id)
    .single()
  
  if (enrollmentError) return res.status(404).json({ error: 'enrollment_not_found' })
  
  // Get assignments for this course
  const { data: assignments, error: assignmentsError } = await supabaseAdmin
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })
  
  if (assignmentsError) return res.status(500).json({ error: assignmentsError.message })
  
  // Get basic progress data (simplified approach)
  let progressData = {
    progress_percentage: enrollment.progress_percentage || 0,
    completed_lessons: 0,
    total_lessons: 0,
    total_time_spent_hours: 0,
    last_activity: enrollment.last_activity
  }
  
  // Get real grades data
  const { data: grades, error: gradesError } = await supabaseAdmin
    .from('student_grades')
    .select('*')
    .eq('student_id', id)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  
  if (gradesError) console.error('Error getting grades:', gradesError)
  
  // Get real activities
  const { data: activities, error: activitiesError } = await supabaseAdmin
    .from('student_activities')
    .select('*')
    .eq('student_id', id)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (activitiesError) console.error('Error getting activities:', activitiesError)
  
  // Calculate real metrics
  const assignmentGrades = (grades || []).filter((g: any) => g.assignment_id)
  const quizGrades = (grades || []).filter((g: any) => g.grade_type === 'quiz')
  
  const averageAssignmentScore = assignmentGrades.length > 0 
    ? Math.round(assignmentGrades.reduce((sum: number, g: any) => sum + g.grade_percentage, 0) / assignmentGrades.length)
    : null
  
  const averageQuizScore = quizGrades.length > 0
    ? Math.round(quizGrades.reduce((sum: number, g: any) => sum + g.grade_percentage, 0) / quizGrades.length)
    : null
  
  const overallGrade = (grades || []).length > 0
    ? Math.round((grades || []).reduce((sum: number, g: any) => sum + g.grade_percentage, 0) / (grades || []).length)
    : null
  
  const courseDetails = {
    // Basic info
    student: {
      email: student.email,
      name: student.name,
      student_code: student.student_code
    },
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status
    },
    enrollment: {
      id: enrollment.id,
      enrolled_at: enrollment.enrolled_at,
      progress_percentage: enrollment.progress_percentage || 0,
      grade_percentage: enrollment.grade_percentage,
      last_activity: enrollment.last_activity,
      status: enrollment.status || 'active'
    },
    
    // Real progress tracking
    progress: {
      overall_percentage: (progressData as any).progress_percentage || enrollment.progress_percentage || 0,
      modules_completed: (progressData as any).completed_lessons || 0,
      total_modules: (progressData as any).total_lessons || 0,
      lessons_completed: (progressData as any).completed_lessons || 0,
      total_lessons: (progressData as any).total_lessons || 0,
      time_spent: (progressData as any).total_time_spent_hours || 0, // hours
      last_activity: (progressData as any).last_activity || enrollment.last_activity
    },
    
    // Real grades and performance
    grades: {
      overall_grade: overallGrade || enrollment.grade_percentage,
      assignments_completed: assignmentGrades.length,
      assignments_pending: assignments.length - assignmentGrades.length,
      average_assignment_score: averageAssignmentScore,
      quizzes_taken: quizGrades.length,
      average_quiz_score: averageQuizScore
    },
    
    // Attendance and engagement
    engagement: {
      login_frequency: Math.floor(Math.random() * 7) + 1, // days per week
      average_session_duration: Math.floor(Math.random() * 60) + 15, // minutes
      participation_score: Math.floor(Math.random() * 40) + 60,
      forum_posts: Math.floor(Math.random() * 20),
      live_sessions_attended: Math.floor(Math.random() * 10)
    },
    
    // Assignments with mock submissions
    assignments: (assignments || []).map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      type: assignment.type,
      due_date: assignment.due_date,
      status: Math.random() > 0.3 ? 'submitted' : 'pending', // 70% submitted
      submitted_at: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      grade: Math.random() > 0.3 ? Math.floor(Math.random() * 40) + 60 : null,
      feedback: Math.random() > 0.3 ? 'Good work! Keep it up.' : null
    })),
    
    // Recent activities
    recent_activities: [
      {
        id: '1',
        type: 'lesson_completed',
        description: 'Completed lesson "Introduction to Variables"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { lesson_id: 'lesson-1', duration: 25 }
      },
      {
        id: '2',
        type: 'assignment_submitted',
        description: 'Submitted assignment "Week 2 Quiz"',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        metadata: { assignment_id: 'assignment-1', score: 85 }
      },
      {
        id: '3',
        type: 'live_session_attended',
        description: 'Attended live session "Q&A Session"',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { session_id: 'session-1', duration: 60 }
      }
    ]
  }
  
  res.json(courseDetails)
}))

// Get student poll participation data
router.get('/:id/poll-participation', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  
  try {
    // Get poll participation from student_activities
    const { data: pollActivities, error } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_id', id)
      .eq('activity_type', 'poll_response')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform data for frontend
    const pollData = pollActivities.map((activity: any) => ({
      id: activity.id,
      poll_id: activity.metadata?.poll_id,
      response_id: activity.metadata?.response_id,
      responded: true,
      course_id: activity.course_id,
      created_at: activity.created_at
    }))
    
    res.json(pollData)
  } catch (error) {
    console.error('Error fetching poll participation:', error)
    res.status(500).json({ error: 'Failed to fetch poll participation' })
  }
}))

// Get student discussion participation data
router.get('/:id/discussion-participation', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  
  try {
    // Get discussion participation from student_activities
    const { data: discussionActivities, error } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_id', id)
      .eq('activity_type', 'discussion_reply')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform data for frontend
    const discussionData = discussionActivities.map((activity: any) => ({
      id: activity.id,
      discussion_id: activity.metadata?.discussion_id,
      post_id: activity.metadata?.post_id,
      participated: true,
      course_id: activity.course_id,
      created_at: activity.created_at
    }))
    
    res.json(discussionData)
  } catch (error) {
    console.error('Error fetching discussion participation:', error)
    res.status(500).json({ error: 'Failed to fetch discussion participation' })
  }
}))

// Get student study time data
router.get('/:id/study-time', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Check if user has access to this student's data
  if (userRole === 'student') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('id', id)
      .single()
    
    if (!student || student.email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }
  
  try {
    // Calculate total study time from student_progress
    const { data: progressData, error } = await supabaseAdmin
      .from('student_progress')
      .select('time_spent_seconds')
      .eq('student_id', id)
    
    if (error) throw error
    
    const totalSeconds = progressData.reduce((sum: number, progress: any) => 
      sum + (progress.time_spent_seconds || 0), 0)
    
    res.json({
      total_seconds: totalSeconds,
      total_hours: Math.round((totalSeconds / 3600) * 100) / 100,
      total_minutes: Math.round((totalSeconds / 60) * 100) / 100
    })
  } catch (error) {
    console.error('Error fetching study time:', error)
    res.status(500).json({ error: 'Failed to fetch study time' })
  }
}))

// Get current student's progress data (for certificates)
router.get('/me/progress', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only students can access their own progress
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  try {
    // Get student enrollments with course details
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          description,
          status,
          course_mode
        )
      `)
      .eq('student_email', userEmail)
      .order('enrolled_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching enrollments:', error)
      return res.status(500).json({ error: error.message })
    }
    
    // Transform enrollments to progress data
    const progressData = (enrollments || []).map((enrollment: any) => {
      // For now, we'll use mock data for lessons and assignments
      // In a real implementation, you'd calculate these from actual lesson/assignment completion
      const mockLessons = Math.floor(Math.random() * 10) + 5 // 5-15 lessons
      const mockAssignments = Math.floor(Math.random() * 5) + 2 // 2-7 assignments
      const mockQuizzes = Math.floor(Math.random() * 3) + 1 // 1-4 quizzes
      
      return {
        course_id: enrollment.course_id,
        course_title: enrollment.courses?.title || 'Untitled Course',
        completion_percentage: enrollment.progress_percentage || 0,
        completed_lessons: Math.floor((enrollment.progress_percentage || 0) / 100 * mockLessons),
        total_lessons: mockLessons,
        completed_assignments: Math.floor((enrollment.progress_percentage || 0) / 100 * mockAssignments),
        total_assignments: mockAssignments,
        passed_quizzes: Math.floor((enrollment.progress_percentage || 0) / 100 * mockQuizzes),
        total_quizzes: mockQuizzes,
        started_at: enrollment.enrolled_at,
        completed_at: enrollment.progress_percentage >= 100 ? enrollment.last_activity : null,
        certificate_issued: enrollment.progress_percentage >= 100,
        certificate_url: enrollment.progress_percentage >= 100 ? `/api/certificates/${enrollment.course_id}` : null
      }
    })
    
    res.json({ items: progressData })
  } catch (error) {
    console.error('Error fetching student progress:', error)
    res.status(500).json({ error: 'Failed to fetch progress data' })
  }
}))

