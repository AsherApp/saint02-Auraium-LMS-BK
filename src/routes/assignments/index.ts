import { Router } from 'express'
import { supabaseAdmin } from '../../lib/supabase.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middlewares/auth.js'

const router = Router()

// Get all assignments for a teacher
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view all assignments' })
  }

  try {
    console.log('Fetching assignments for teacher:', userEmail)
    
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses!inner(title, teacher_email)
      `)
      .eq('courses.teacher_email', userEmail)

    if (error) {
      console.error('Error fetching assignments:', error)
      return res.status(500).json({ error: 'Failed to fetch assignments' })
    }

    console.log('Found assignments:', assignments?.length || 0)
    if (assignments && assignments.length > 0) {
      console.log('Sample assignment:', {
        id: assignments[0].id,
        title: assignments[0].title,
        course_title: assignments[0].courses?.title,
        teacher_email: assignments[0].courses?.teacher_email
      })
    }

    // Add computed fields for each assignment
    const assignmentsWithComputedFields = (assignments || []).map(assignment => {
      const now = new Date()
      const availableFrom = assignment.available_from ? new Date(assignment.available_from) : null
      const availableUntil = assignment.available_until ? new Date(assignment.available_until) : null
      const dueAt = assignment.due_at ? new Date(assignment.due_at) : null

      return {
        ...assignment,
        course_title: assignment.courses?.title || 'Unknown Course',
        is_available: !availableFrom || now >= availableFrom,
        is_overdue: dueAt ? now > dueAt : false,
        is_late: dueAt ? now > dueAt : false,
        is_published: assignment.is_published || false,
        submission_count: 0, // Will be calculated separately if needed
        graded_count: 0 // Will be calculated separately if needed
      }
    })

    res.json(assignmentsWithComputedFields)
  } catch (error) {
    console.error('Error in get all assignments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get assignments for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  try {
    // First, verify access to the course
    if (userRole === 'teacher') {
      // Teachers can only see assignments from their own courses
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, teacher_email')
        .eq('id', courseId)
        .eq('teacher_email', (req as any).user?.email)
        .single()

      if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied - course not found or not owned by you' })
      }
    } else if (userRole === 'student') {
      // Students can only see assignments from courses they're enrolled in
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - not enrolled in this course' })
      }
    } else {
      return res.status(403).json({ error: 'Invalid user role' })
    }

    let query = supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses(title, teacher_email)
      `)
      .eq('course_id', courseId)

    // Students can only see published assignments
    if (userRole === 'student') {
      query = query.eq('is_published', true)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return res.status(500).json({ error: 'Failed to fetch assignments' })
    }

    // Add computed fields for each assignment
    const assignmentsWithComputedFields = (assignments || []).map(assignment => {
      const now = new Date()
      const availableFrom = assignment.available_from ? new Date(assignment.available_from) : null
      const availableUntil = assignment.available_until ? new Date(assignment.available_until) : null
      const dueAt = assignment.due_at ? new Date(assignment.due_at) : null

      return {
        ...assignment,
        course_title: assignment.courses?.title || 'Unknown Course',
        is_available: !availableFrom || now >= availableFrom,
        is_overdue: dueAt ? now > dueAt : false,
        is_late: dueAt ? now > dueAt : false,
        is_published: assignment.is_published || false,
        time_remaining: dueAt ? Math.max(0, dueAt.getTime() - now.getTime()) : null
      }
    })

    res.json(assignmentsWithComputedFields)
  } catch (error) {
    console.error('Error in get course assignments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get all assignments for a student (from all enrolled courses)
router.get('/student', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const userId = (req as any).user?.id

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can access this endpoint' })
  }

  try {
    // First, get student's enrolled courses
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        course_id,
        courses(title, description)
      `)
      .eq('student_email', userEmail)

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return res.status(500).json({ error: 'Failed to fetch enrollments' })
    }

    if (!enrollments || enrollments.length === 0) {
      return res.json([])
    }

    const courseIds = enrollments.map(e => e.course_id)

    // Get assignments for all enrolled courses
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses(title, description)
      `)
      .in('course_id', courseIds)
      .eq('is_published', true)

    if (error) {
      console.error('Error fetching assignments:', error)
      return res.status(500).json({ error: 'Failed to fetch assignments' })
    }

    // For each assignment, get student's submission status
    const assignmentsWithSubmissions = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const now = new Date()
        const availableFrom = assignment.available_from ? new Date(assignment.available_from) : null
        const availableUntil = assignment.available_until ? new Date(assignment.available_until) : null
        const dueAt = assignment.due_at ? new Date(assignment.due_at) : null

        // Get student's submission for this assignment
        const { data: submission } = await supabaseAdmin
          .from('submissions')
          .select('*')
          .eq('assignment_id', assignment.id)
          .eq('student_id', userId)
          .order('attempt_number', { ascending: false })
          .limit(1)
          .single()

        return {
          ...assignment,
          course_title: assignment.courses?.title || 'Unknown Course',
          is_available: !availableFrom || now >= availableFrom,
          is_overdue: dueAt ? now > dueAt : false,
          is_late: dueAt ? now > dueAt : false,
          is_published: assignment.is_published || false,
          // Student-specific computed fields
          is_submitted: !!submission,
          is_graded: submission?.status === 'graded',
          status: submission ? 
            (submission.status === 'returned' ? 'awaiting_response' : 
             submission.status === 'graded' ? 'graded' : 
             submission.status === 'submitted' ? 'submitted' : 'not_started') : 
            'not_started',
          can_resubmit: submission?.status === 'returned',
          student_submission: submission,
          time_remaining: dueAt ? Math.max(0, dueAt.getTime() - now.getTime()) : null
        }
      })
    )

    res.json(assignmentsWithSubmissions)
  } catch (error) {
    console.error('Error in get student assignments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get single assignment
router.get('/:assignmentId', requireAuth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  try {
    let query = supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses(title, teacher_email)
      `)
      .eq('id', assignmentId)

    // Add access control based on user role
    if (userRole === 'teacher') {
      // Teachers can only see their own assignments
      query = query.eq('courses.teacher_email', (req as any).user?.email)
    } else if (userRole === 'student') {
      // Students can only see assignments from courses they're enrolled in
      // We'll check enrollment after getting the assignment
    } else {
      return res.status(403).json({ error: 'Invalid user role' })
    }

    const { data: assignment, error } = await query.single()

    if (error) {
      console.error('Error fetching assignment:', error)
      return res.status(404).json({ error: 'Assignment not found or access denied' })
    }

    // For students, verify they are enrolled in the course
    if (userRole === 'student') {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_id', userId)
        .eq('course_id', assignment.course_id)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - not enrolled in this course' })
      }
    }

    // Add computed fields
    const now = new Date()
    const availableFrom = assignment.available_from ? new Date(assignment.available_from) : null
    const availableUntil = assignment.available_until ? new Date(assignment.available_until) : null
    const dueAt = assignment.due_at ? new Date(assignment.due_at) : null

    // For students, get their submission status
    let studentSubmission = null
    if (userRole === 'student') {
      console.log(`🔍 Looking for submission: assignmentId=${assignmentId}, userId=${userId}`)
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .single()

      console.log(`📊 Submission query result:`, { submission, error: submissionError })
      if (!submissionError && submission) {
        studentSubmission = submission
        console.log(`✅ Found submission with status: ${submission.status}`)
      } else {
        console.log(`❌ No submission found or error:`, submissionError)
      }
    }

    const assignmentWithComputedFields = {
      ...assignment,
      course_title: assignment.courses?.title || 'Unknown Course',
      is_available: !availableFrom || now >= availableFrom,
      is_overdue: dueAt ? now > dueAt : false,
      is_late: dueAt ? now > dueAt : false,
      is_published: assignment.is_published || false,
      // Student-specific computed fields
      ...(userRole === 'student' ? {
        is_submitted: !!studentSubmission,
        is_graded: studentSubmission?.status === 'graded',
        status: (() => {
          if (!studentSubmission) {
            console.log(`📝 No submission found, status: not_started`)
            return 'not_started'
          }
          const computedStatus = studentSubmission.status === 'returned' ? 'awaiting_response' : 
                                studentSubmission.status === 'graded' ? 'graded' : 
                                studentSubmission.status === 'submitted' ? 'submitted' : 'not_started'
          console.log(`📝 Computed status: ${studentSubmission.status} → ${computedStatus}`)
          return computedStatus
        })(),
        can_resubmit: studentSubmission?.status === 'returned',
        student_submission: studentSubmission
      } : {}),
      time_remaining: dueAt ? Math.max(0, dueAt.getTime() - now.getTime()) : null
    }

    res.json(assignmentWithComputedFields)
  } catch (error) {
    console.error('Error in get assignment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Create assignment (teachers only)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create assignments' })
  }

  try {
    const assignmentData = {
      ...req.body,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return res.status(500).json({ error: 'Failed to create assignment' })
    }

    res.status(201).json(assignment)
  } catch (error) {
    console.error('Error in create assignment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Note: Assignment submissions are now handled by the submissions routes

// Get grading stats for an assignment (teachers only)
router.get('/:assignmentId/grading-stats', requireAuth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view grading stats' })
  }

  try {
    // Get the assignment first to verify ownership
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses!inner(title, teacher_email)
      `)
      .eq('id', assignmentId)
      .eq('courses.teacher_email', userEmail)
      .single()

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found or access denied' })
    }

    // Get submission stats from the submissions table
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return res.status(500).json({ error: 'Failed to fetch submission stats' })
    }

    // Calculate stats
    const totalSubmissions = submissions?.length || 0
    const gradedSubmissions = submissions?.filter(s => s.status === 'graded').length || 0
    const pendingSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0
    const averageGrade = gradedSubmissions > 0 
      ? submissions?.filter(s => s.status === 'graded' && s.grade !== null)
          .reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions 
      : 0

    const stats = {
      total_submissions: totalSubmissions,
      graded_submissions: gradedSubmissions,
      pending_submissions: pendingSubmissions,
      average_grade: Math.round(averageGrade * 100) / 100,
      completion_rate: totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0
    }

    res.json(stats)
  } catch (error) {
    console.error('Error in get grading stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Update assignment (teachers only)
router.put('/:assignmentId', requireAuth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can update assignments' })
  }

  try {
    // Check if teacher owns this assignment
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses!inner(teacher_email)
      `)
      .eq('id', assignmentId)
      .single()

    if (fetchError) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    if (assignment.courses.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    }

    const { data: updatedAssignment, error } = await supabaseAdmin
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return res.status(500).json({ error: 'Failed to update assignment' })
    }

    res.json(updatedAssignment)
  } catch (error) {
    console.error('Error in update assignment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Delete assignment (teachers only)
router.delete('/:assignmentId', requireAuth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can delete assignments' })
  }

  try {
    // Check if teacher owns this assignment
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        courses!inner(teacher_email)
      `)
      .eq('id', assignmentId)
      .single()

    if (fetchError) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    if (assignment.courses.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error deleting assignment:', error)
      return res.status(500).json({ error: 'Failed to delete assignment' })
    }

    res.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error in delete assignment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Note: Assignment grading is now handled by the submissions routes

export default router