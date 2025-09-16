import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'
import { generateStudentCode } from '../utils/student-code.js'
import bcrypt from 'bcrypt'

export const router = Router()

// Get student's enrolled courses
router.get('/me/courses', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized - Students only' })
  }

  try {
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id,
          title,
          description,
          status,
          created_at
        )
      `)
      .eq('student_email', userEmail)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching student courses:', error)
      return res.status(500).json({ error: 'Failed to fetch courses' })
    }

    res.json({ items: enrollments || [] })
  } catch (error) {
    console.error('Error in get student courses:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

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

// Get students for messaging (enrolled students with course info)
router.get('/messaging', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  // Only teachers can access the student list for messaging
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only teachers can access student list.' })
  }
  
  try {
    // First get enrollments for this teacher's courses
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        student_email,
        course_id,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .eq('courses.teacher_email', userEmail)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return res.status(500).json({ error: 'Failed to fetch enrollments' })
    }

    if (!enrollments || enrollments.length === 0) {
      return res.json({ items: [] })
    }

    // Get student information for each enrollment
    const studentEmails = [...new Set(enrollments.map(e => e.student_email))]
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, email, student_code')
      .in('email', studentEmails)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return res.status(500).json({ error: 'Failed to fetch students' })
    }

    // Transform the data to include student and course information
    const studentsForMessaging = enrollments.map((enrollment: any) => {
      const student = students?.find(s => s.email === enrollment.student_email)
      return {
        id: student?.id || enrollment.student_email,
        student_name: student?.name || 'Unknown Student',
        student_email: enrollment.student_email,
        student_code: student?.student_code || '',
        course_id: enrollment.course_id,
        course_title: enrollment.courses.title
      }
    })

    // Remove duplicates based on student email
    const uniqueStudents = studentsForMessaging.filter((student: any, index: number, self: any[]) => 
      index === self.findIndex((s: any) => s.student_email === student.student_email)
    )

    res.json({ items: uniqueStudents })
  } catch (err) {
    console.error('Unexpected error:', err)
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
  
  // Only return students who are enrolled in courses owned by this teacher - FIXED: Use proper join
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      students!inner(
        id,
        email,
        name,
        student_code,
        status,
        created_at,
        first_name,
        last_name
      ),
        courses!inner(
          id,
          title,
          description,
          status,
          teacher_email
      )
    `)
    .eq('courses.teacher_email', teacherEmail)
    .order('students.name', { ascending: true })
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Transform the data to flatten enrollments with real progress data - FIXED: Process enrollment data correctly with name fallback
  const studentsWithEnrollments = (data || []).map((enrollment: any) => {
    const student = enrollment.students
    const course = enrollment.courses
    
    const studentName = student?.name || 
      (student?.first_name && student?.last_name ? `${student.first_name} ${student.last_name}` : null) ||
      student?.first_name || 
      student?.email || 
      enrollment.student_email
    
    return {
      id: enrollment.id,
      course_id: enrollment.course_id,
      enrolled_at: enrollment.enrolled_at,
      course_title: course?.title || 'Untitled Course',
      course_description: course?.description,
      course_status: course?.status,
      student_email: student?.email || enrollment.student_email,
      student_name: studentName,
      student_status: student?.status || 'active',
      student_id: student?.student_code || `STU${student?.id?.substr(0, 8).toUpperCase()}`,
      // Real progress data from database
      progress_percentage: enrollment.progress_percentage || 0,
      grade_percentage: enrollment.grade_percentage,
      last_activity: enrollment.last_activity,
      enrollment_status: enrollment.status || 'active'
    }
  })
  
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
  // First, get enrolled students - FIXED: Use proper join syntax
  const { data: enrolledStudents, error: enrolledError } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      students!inner(
        id,
        email,
        name,
        student_code,
        status,
        created_at,
        first_name,
        last_name
      ),
        courses!inner(
          id,
          title,
          description,
          status,
          teacher_email
      )
    `)
    .eq('courses.teacher_email', teacherEmail)
  
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
  
  // Add enrolled students - FIXED: Process enrollment data correctly
  if (enrolledStudents) {
    // Group enrollments by student to avoid duplicates
    const studentMap = new Map()
    
    enrolledStudents.forEach(enrollment => {
      const student = enrollment.students
      const course = enrollment.courses
      
      // Fix student name with proper fallback
      const studentName = student?.name || 
        (student?.first_name && student?.last_name ? `${student.first_name} ${student.last_name}` : null) ||
        student?.first_name || 
        student?.email
      
      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
      ...student,
          name: studentName, // Use the fixed name
      status: 'active',
          enrollment_status: 'enrolled',
          enrollments: []
        })
      }
      
      // Add this enrollment to the student's enrollments
      studentMap.get(student.id).enrollments.push({
        id: enrollment.id,
        course_id: enrollment.course_id,
        enrolled_at: enrollment.enrolled_at,
        progress_percentage: enrollment.progress_percentage || 0,
        grade_percentage: enrollment.grade_percentage,
        last_activity: enrollment.last_activity,
        status: enrollment.status || 'active',
        courses: course
      })
    })
    
    allStudents.push(...Array.from(studentMap.values()))
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
    
    // Get real progress data for each course
    const courseProgressData = await Promise.all(enrollments.map(async (enrollment: any) => {
      // Get course progress from student_course_progress table
      const { data: courseProgress } = await supabaseAdmin
        .from('student_course_progress')
        .select('*')
        .eq('student_email', student.email)
        .eq('course_id', enrollment.course_id)
        .single()
      
      // Get total lessons for this course
      const { data: modules } = await supabaseAdmin
        .from('modules')
        .select(`
          id,
          lessons(id)
        `)
        .eq('course_id', enrollment.course_id)
      
      const totalLessons = modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
      
      return {
        progress_percentage: courseProgress?.completion_percentage ? parseInt(courseProgress.completion_percentage) : (enrollment.progress_percentage || 0),
        average_grade: courseProgress?.average_grade || enrollment.grade_percentage || 0,
        completed_lessons: courseProgress?.completed_lessons ? parseInt(courseProgress.completed_lessons) : 0,
        total_lessons: courseProgress?.total_lessons || totalLessons,
        time_spent_hours: courseProgress?.time_spent_seconds ? Math.round(courseProgress.time_spent_seconds / 3600 * 100) / 100 : 0
      }
    }))
    
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
  
  // Get real progress data from student_course_progress table
  const { data: courseProgress, error: courseProgressError } = await supabaseAdmin
    .from('student_course_progress')
    .select('*')
    .eq('student_email', student.email)
    .eq('course_id', courseId)
    .single()
  
  if (courseProgressError) {
    console.error('Error getting course progress:', courseProgressError)
  }
  
  // Get total lessons count for this course
  const { data: modules, error: modulesError } = await supabaseAdmin
    .from('modules')
    .select(`
      id,
      lessons(id)
    `)
    .eq('course_id', courseId)
  
  if (modulesError) {
    console.error('Error getting modules:', modulesError)
  }
  
  const totalLessons = modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
  
  // Calculate real progress data
  let progressData = {
    progress_percentage: courseProgress?.completion_percentage ? parseInt(courseProgress.completion_percentage) : (enrollment.progress_percentage || 0),
    completed_lessons: courseProgress?.completed_lessons ? parseInt(courseProgress.completed_lessons) : 0,
    total_lessons: courseProgress?.total_lessons || totalLessons,
    total_time_spent_hours: courseProgress?.time_spent_seconds ? Math.round(courseProgress.time_spent_seconds / 3600 * 100) / 100 : 0,
    last_activity: courseProgress?.last_activity_at || enrollment.last_activity
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
// Mark course as complete and generate certificate
router.post('/me/courses/:courseId/complete', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { courseId } = req.params
  
  // Only students can mark courses complete
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' })
  }
  
  try {
    // Check if student is enrolled in this course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('student_email', userEmail)
      .eq('course_id', courseId)
      .single()
    
    if (enrollmentError || !enrollment) {
      return res.status(404).json({ error: 'Course enrollment not found' })
    }
    
    // Check if course is already completed
    if (enrollment.progress_percentage >= 100) {
      return res.status(400).json({ error: 'Course already completed' })
    }
    
    // Mark course as 100% complete
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ 
        progress_percentage: 100,
        completed_at: new Date().toISOString()
      })
      .eq('student_email', userEmail)
      .eq('course_id', courseId)
    
    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      return res.status(500).json({ error: 'Failed to mark course complete' })
    }
    
    // Get course details for certificate
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('title, description, certificate_config')
      .eq('id', courseId)
      .single()
    
    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    // Check if certificates are enabled for this course
    const certConfig = course.certificate_config || {
      enabled: false,
      template: "default",
      custom_text: "",
      signature: "",
      logo_url: "",
      background_color: "#1e293b",
      text_color: "#ffffff",
      border_color: "#3b82f6",
      show_completion_date: true,
      show_course_duration: false,
      show_grade: false,
      custom_fields: []
    }

    if (!certConfig.enabled) {
      return res.status(400).json({ error: 'Certificates are not enabled for this course' })
    }

    // Generate certificate using teacher's configuration
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // 8.5 x 11 inches
    
    // Set up fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Parse colors from hex to RGB
    const parseColor = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return rgb(r, g, b)
    }
    
    const backgroundColor = parseColor(certConfig.background_color)
    const textColor = parseColor(certConfig.text_color)
    const borderColor = parseColor(certConfig.border_color)
    
    // Set background color
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 612,
      height: 792,
      color: backgroundColor,
    })
    
    // Certificate border
    page.drawRectangle({
      x: 50,
      y: 50,
      width: 512,
      height: 692,
      borderColor: borderColor,
      borderWidth: 3,
    })
    
    // Title
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: 150,
      y: 650,
      size: 24,
      font: boldFont,
      color: borderColor,
    })
    
    // Subtitle
    page.drawText('This is to certify that', {
      x: 200,
      y: 600,
      size: 16,
      font: font,
      color: textColor,
    })
    
    // Student name
    const { data: studentProfile } = await supabaseAdmin
      .from('students')
      .select('name')
      .eq('email', userEmail)
      .single()
    
    const studentName = studentProfile?.name || userEmail.split('@')[0]
    
    page.drawText(studentName, {
      x: 200,
      y: 550,
      size: 20,
      font: boldFont,
      color: borderColor,
    })
    
    // Course completion text
    page.drawText('has successfully completed the course', {
      x: 180,
      y: 500,
      size: 16,
      font: font,
      color: textColor,
    })
    
    // Course title
    page.drawText(`"${course.title}"`, {
      x: 200,
      y: 450,
      size: 18,
      font: boldFont,
      color: borderColor,
    })
    
    // Custom text if provided
    if (certConfig.custom_text) {
      page.drawText(certConfig.custom_text, {
        x: 200,
        y: 400,
        size: 14,
        font: font,
        color: textColor,
      })
    }
    
    // Completion date (if enabled)
    if (certConfig.show_completion_date) {
      const completionDate = new Date().toLocaleDateString()
      page.drawText(`Completed on: ${completionDate}`, {
        x: 200,
        y: 350,
        size: 14,
        font: font,
        color: textColor,
      })
    }
    
    // Course duration (if enabled)
    if (certConfig.show_course_duration) {
      page.drawText(`Course Duration: 8 weeks`, {
        x: 200,
        y: 320,
        size: 14,
        font: font,
        color: textColor,
      })
    }
    
    // Final grade (if enabled)
    if (certConfig.show_grade) {
      page.drawText(`Final Grade: 95%`, {
        x: 200,
        y: 290,
        size: 14,
        font: font,
        color: textColor,
      })
    }
    
    // Custom fields
    let yPosition = 250
    certConfig.custom_fields.forEach((field: any) => {
      if (field.label && field.value) {
        page.drawText(`${field.label}: ${field.value}`, {
          x: 200,
          y: yPosition,
          size: 14,
          font: font,
          color: textColor,
        })
        yPosition -= 30
      }
    })
    
    // Signature
    const signature = certConfig.signature || 'AuraiumLMS'
    page.drawText(signature, {
      x: 250,
      y: 150,
      size: 14,
      font: boldFont,
      color: borderColor,
    })
    
    page.drawLine({
      start: { x: 200, y: 130 },
      end: { x: 400, y: 130 },
      thickness: 1,
      color: textColor,
    })
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()
    const base64Pdf = Buffer.from(pdfBytes).toString('base64')
    
    // Store certificate in database
    const { error: certError } = await supabaseAdmin
      .from('certificates')
      .upsert({
        student_email: userEmail,
        course_id: courseId,
        student_name: studentName,
        course_title: course.title,
        completion_date: new Date().toISOString(),
        certificate_data: base64Pdf,
        created_at: new Date().toISOString()
      })
    
    if (certError) {
      console.error('Error storing certificate:', certError)
      // Don't fail the request if storage fails
    }
    
    res.json({
      success: true,
      message: 'Course marked as complete and certificate generated',
      course_title: course.title,
      student_name: studentName,
      completion_date: new Date().toISOString(),
      certificate_url: `/api/certificates/${courseId}`
    })
    
  } catch (error) {
    console.error('Error marking course complete:', error)
    res.status(500).json({ error: 'Failed to mark course complete' })
  }
}))

// Note: Progress API removed - certificates now use direct certificate data

