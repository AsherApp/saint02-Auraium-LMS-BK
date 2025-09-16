import { Router } from 'express'
import { supabaseAdmin } from '../../lib/supabase'
import { requireAuth } from '../../middlewares/auth'
import { asyncHandler } from '../../utils/asyncHandler'

const router = Router()

// Get submissions for an assignment (teachers only)
router.get('/assignment/:assignmentId', requireAuth, asyncHandler(async (req, res) => {
  const { assignmentId } = req.params
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can view submissions' })
  }

  try {
    // Check if teacher owns this assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id, title, 
        courses!inner(teacher_email)
      `)
      .eq('id', assignmentId)
      .eq('courses.teacher_email', (req as any).user?.email)
      .single()

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found or access denied' })
    }

    // Get submissions with student information
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        students(id, name, first_name, last_name, email)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return res.status(500).json({ error: 'Failed to fetch submissions' })
    }

    // Transform the data to include student information
    const transformedSubmissions = submissions?.map(submission => ({
      ...submission,
      student_name: submission.students?.name || 
                   `${submission.students?.first_name || ''} ${submission.students?.last_name || ''}`.trim() ||
                   'Unknown Student',
      student_email: submission.students?.email || submission.student_email
    })) || []

    res.json(transformedSubmissions)
  } catch (error) {
    console.error('Error in get submissions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get single submission
router.get('/:submissionId', requireAuth, asyncHandler(async (req, res) => {
  const { submissionId } = req.params
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  try {
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        *,
        students(id, first_name, last_name, email),
        assignments(id, title, points, type, courses!inner(teacher_email))
      `)
      .eq('id', submissionId)

    // Add access control based on user role
    if (userRole === 'student') {
      query = query.eq('student_id', userId)
    } else if (userRole === 'teacher') {
      // For teachers, filter by assignment ownership at the database level
      query = query.eq('assignments.courses.teacher_email', (req as any).user?.email)
    }

    const { data: submission, error } = await query.single()

    if (error) {
      console.error('Error fetching submission:', error)
      return res.status(404).json({ error: 'Submission not found or access denied' })
    }

    // Transform the data
    const transformedSubmission = {
      ...submission,
      student_name: submission.students?.name || 
                   `${submission.students?.first_name || ''} ${submission.students?.last_name || ''}`.trim() ||
                   'Unknown Student',
      student_email: submission.students?.email || submission.student_email,
      assignment_title: submission.assignments?.title,
      assignment_points: submission.assignments?.points,
      assignment_type: submission.assignments?.type
    }

    res.json(transformedSubmission)
  } catch (error) {
    console.error('Error in get submission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Create new submission
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can create submissions' })
  }

  const { assignment_id, content, response } = req.body

  try {
    // Check if student is enrolled in the course
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id, course_id, title, due_at,
        courses(id, title)
      `)
      .eq('id', assignment_id)
      .single()

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Check enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_email', (req as any).user?.email)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }

    // Get student email for the submission record
    const userEmail = (req as any).user?.email

    // Check if submission already exists for this attempt
    const { data: existingSubmissions, error: existingError } = await supabaseAdmin
      .from('submissions')
      .select('id, attempt_number, status')
      .eq('assignment_id', assignment_id)
      .eq('student_id', userId)
      .order('attempt_number', { ascending: false })

    // If there's a draft submission (submitted status), update it instead of creating new one
    const draftSubmission = existingSubmissions?.find(s => s.status === 'submitted')
    if (draftSubmission) {
      // Update existing draft submission
      const { data: updatedSubmission, error: updateError } = await supabaseAdmin
        .from('submissions')
        .update({
          content,
          response,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftSubmission.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating draft submission:', updateError)
        return res.status(500).json({ error: 'Failed to update submission' })
      }

      return res.json(updatedSubmission)
    }

    // Calculate next attempt number for new submission
    const attemptNumber = existingSubmissions && existingSubmissions.length > 0 
      ? Math.max(...existingSubmissions.map(s => s.attempt_number)) + 1 
      : 1

    // Check if assignment is overdue (for now, allow late submissions)
    const now = new Date()
    const dueAt = assignment.due_at ? new Date(assignment.due_at) : null
    // const isLate = dueAt && now > dueAt && !assignment.allow_late_submissions

    // if (isLate) {
    //   return res.status(400).json({ error: 'Assignment is overdue and late submissions are not allowed' })
    // }

    // Create submission
    const { data: newSubmission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        assignment_id,
        student_id: userId,
        student_email: userEmail,
        content,
        response,
        status: 'submitted',
        attempt_number: attemptNumber,
        submitted_at: new Date().toISOString(),
        // late_submission: dueAt && now > dueAt  // Column doesn't exist in schema
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      return res.status(500).json({ error: 'Failed to create submission' })
    }

    res.status(201).json(newSubmission)
  } catch (error) {
    console.error('Error in create submission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Update submission (for resubmissions)
router.put('/:submissionId', requireAuth, asyncHandler(async (req, res) => {
  const { submissionId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  const { content, response } = req.body

  try {
    // Get existing submission
    const { data: existingSubmission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(id, title, due_at, allow_late_submissions)
      `)
      .eq('id', submissionId)
      .single()

    if (fetchError || !existingSubmission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    // Check permissions
    if (userRole === 'student' && existingSubmission.student_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (userRole === 'teacher' && existingSubmission.assignments.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if update is allowed
    if (userRole === 'student') {
      // Allow updates for draft saves (status: 'submitted') or resubmissions (status: 'returned')
      if (existingSubmission.status !== 'submitted' && existingSubmission.status !== 'returned') {
        return res.status(400).json({ error: 'Update not allowed for this submission status' })
      }
    }

    // Update submission
    const { data: updatedSubmission, error } = await supabaseAdmin
      .from('submissions')
      .update({
        content,
        response,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return res.status(500).json({ error: 'Failed to update submission' })
    }

    res.json(updatedSubmission)
  } catch (error) {
    console.error('Error in update submission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Grade submission (teachers only)
router.put('/:submissionId/grade', requireAuth, asyncHandler(async (req, res) => {
  const { submissionId } = req.params
  const userId = (req as any).user?.id
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can grade submissions' })
  }

  const { grade, feedback, requestResubmission } = req.body

  try {
    // Get submission with assignment info
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(id, title, points, courses!inner(teacher_email))
      `)
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    // Check if teacher owns this assignment
    const userEmail = (req as any).user?.email
    if (submission.assignments.courses.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Update submission with grade
    const { data: updatedSubmission, error } = await supabaseAdmin
      .from('submissions')
      .update({
        grade,
        feedback,
        status: requestResubmission ? 'returned' : 'graded',
        graded_at: new Date().toISOString(),
        graded_by: userEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error grading submission:', error)
      return res.status(500).json({ error: 'Failed to grade submission' })
    }

    res.json({
      message: requestResubmission ? 'Submission returned for resubmission' : 'Submission graded successfully',
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('Error in grade submission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Delete submission
router.delete('/:submissionId', requireAuth, asyncHandler(async (req, res) => {
  const { submissionId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Get submission to check permissions
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(teacher_email)
      `)
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    // Check permissions
    if (userRole === 'student' && submission.student_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (userRole === 'teacher' && submission.assignments.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete submission
    const { error } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting submission:', error)
      return res.status(500).json({ error: 'Failed to delete submission' })
    }

    res.json({ message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Error in delete submission:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

export default router
