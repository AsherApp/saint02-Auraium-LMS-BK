import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Get a specific submission (must come before /assignment/:assignmentId to avoid route conflicts)
router.get('/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(
          id,
          course_id,
          courses!inner(
            id,
            teacher_email,
            enrollments!inner(student_email)
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (userRole === 'student') {
      // Student can only view their own submissions
      if (submission.student_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'teacher') {
      // Teacher must own the course
      if (submission.assignments.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Transform response
    const transformedSubmission = {
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentEmail: submission.student_email,
      studentName: submission.student_name,
      attemptNumber: submission.attempt_number,
      status: submission.status,
      content: submission.content,
      attachments: submission.attachments,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      gradedBy: submission.graded_by,
      grade: submission.grade,
      feedback: submission.feedback,
      rubricScores: submission.rubric_scores,
      timeSpentMinutes: submission.time_spent_minutes,
      lateSubmission: submission.late_submission,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at
    };

    res.json(transformedSubmission);
  } catch (error) {
    console.error('Error in GET /submissions/:submissionId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's submissions for an assignment
router.get('/assignment/:assignmentId', requireAuth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentEmail = (req as any).user?.email;
    
    if (!studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if student has access to the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_email', studentEmail)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied - not enrolled in course' });
    }

    // Get student's submissions
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_email,
        student_name,
        attempt_number,
        status,
        content,
        attachments,
        submitted_at,
        graded_at,
        graded_by,
        grade,
        feedback,
        rubric_scores,
        time_spent_minutes,
        late_submission,
        created_at,
        updated_at
      `)
      .eq('assignment_id', assignmentId)
      .eq('student_email', studentEmail)
      .order('attempt_number', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    // Transform to match expected format
    const transformedSubmissions = submissions?.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentEmail: submission.student_email,
      studentName: submission.student_name || 'Unknown Student',
      attemptNumber: submission.attempt_number || 1,
      status: submission.status || 'draft',
      content: submission.content || (submission as any).payload || {},
      attachments: submission.attachments || [],
      submittedAt: submission.submitted_at || submission.updated_at,
      gradedAt: submission.graded_at,
      gradedBy: submission.graded_by,
      grade: submission.grade,
      feedback: submission.feedback,
      rubricScores: submission.rubric_scores || {},
      timeSpentMinutes: submission.time_spent_minutes || 0,
      lateSubmission: submission.late_submission || false,
      createdAt: submission.created_at || submission.updated_at,
      updatedAt: submission.updated_at
    })) || [];

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error in GET /submissions/assignment/:assignmentId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a submission
router.post('/assignment/:assignmentId', requireAuth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentEmail = (req as any).user?.email;
    
    if (!studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      content,
      attachments,
      status = 'draft',
      timeSpentMinutes = 0
    } = req.body;

    // Check if student has access to the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        max_attempts,
        due_at,
        allow_late_submissions
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_email', studentEmail)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied - not enrolled in course' });
    }

    // Check if assignment is still available
    const now = new Date();
    if ((assignment as any).available_until && new Date((assignment as any).available_until) < now) {
      return res.status(400).json({ error: 'Assignment is no longer available' });
    }

    // Get current submission count
    const { data: existingSubmissions, error: countError } = await supabaseAdmin
      .from('submissions')
      .select('attempt_number')
      .eq('assignment_id', assignmentId)
      .eq('student_email', studentEmail)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('Error checking existing submissions:', countError);
      return res.status(500).json({ error: 'Failed to check existing submissions' });
    }

    const nextAttemptNumber = existingSubmissions && existingSubmissions.length > 0 
      ? existingSubmissions[0].attempt_number + 1 
      : 1;

    // Check if max attempts exceeded
    if (nextAttemptNumber > (assignment.max_attempts || 1)) {
      return res.status(400).json({ error: 'Maximum attempts exceeded' });
    }

    // Check if submission is late
    const isLate = assignment.due_at && new Date(assignment.due_at) < now;
    if (isLate && !(assignment.allow_late_submissions || true)) {
      return res.status(400).json({ error: 'Late submissions not allowed' });
    }

    // Get student name from user_profiles view
    const { data: student, error: studentError } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('email', studentEmail)
      .eq('user_type', 'student')
      .single();

    // Create or update submission
    const submissionData = {
      assignment_id: assignmentId,
      student_email: studentEmail,
      student_name: student ? `${student.first_name} ${student.last_name}` : '',
      attempt_number: nextAttemptNumber,
      status,
      content: content || {},
      attachments: attachments || [],
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      time_spent_minutes: timeSpentMinutes,
      late_submission: isLate
    };

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return res.status(500).json({ error: 'Failed to create submission' });
    }

    // Transform response
    const transformedSubmission = {
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentEmail: submission.student_email,
      studentName: submission.student_name,
      attemptNumber: submission.attempt_number,
      status: submission.status,
      content: submission.content,
      attachments: submission.attachments,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      gradedBy: submission.graded_by,
      grade: submission.grade,
      feedback: submission.feedback,
      rubricScores: submission.rubric_scores,
      timeSpentMinutes: submission.time_spent_minutes,
      lateSubmission: submission.late_submission,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at
    };

    res.status(201).json(transformedSubmission);
  } catch (error) {
    console.error('Error in POST /submissions/assignment/:assignmentId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific submission
router.put('/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const studentEmail = (req as any).user?.email;
    
    if (!studentEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      content,
      attachments,
      status,
      timeSpentMinutes
    } = req.body;

    // Check if student owns the submission
    const { data: existingSubmission, error: checkError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('student_email', studentEmail)
      .single();

    if (checkError || !existingSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if submission can be updated
    if (existingSubmission.status === 'graded' || existingSubmission.status === 'returned') {
      return res.status(400).json({ error: 'Cannot update graded submission' });
    }

    // Update submission
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (status !== undefined) updateData.status = status;
    if (timeSpentMinutes !== undefined) updateData.time_spent_minutes = timeSpentMinutes;
    
    if (status === 'submitted' && existingSubmission.status !== 'submitted') {
      updateData.submitted_at = new Date().toISOString();
    }

    const { data: submission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return res.status(500).json({ error: 'Failed to update submission' });
    }

    // Transform response
    const transformedSubmission = {
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentEmail: submission.student_email,
      studentName: submission.student_name,
      attemptNumber: submission.attempt_number,
      status: submission.status,
      content: submission.content,
      attachments: submission.attachments,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      gradedBy: submission.graded_by,
      grade: submission.grade,
      feedback: submission.feedback,
      rubricScores: submission.rubric_scores,
      timeSpentMinutes: submission.time_spent_minutes,
      lateSubmission: submission.late_submission,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at
    };

    res.json(transformedSubmission);
  } catch (error) {
    console.error('Error in PUT /submissions/:submissionId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grade a submission
router.post('/:submissionId/grade', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const teacherEmail = (req as any).user?.email;
    const { grade, feedback, rubric_scores } = req.body;
    
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get submission with assignment and course info
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments!inner(
          id,
          course_id,
          courses!inner(
            id,
            teacher_email
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check if teacher owns the course
    if (submission.assignments.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update submission with grade
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'graded',
        grade,
        feedback,
        rubric_scores: rubric_scores || {},
        graded_at: new Date().toISOString(),
        graded_by: teacherEmail
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error grading submission:', updateError);
      return res.status(500).json({ error: 'Failed to grade submission' });
    }

    // Transform response
    const transformedSubmission = {
      id: updatedSubmission.id,
      assignmentId: updatedSubmission.assignment_id,
      studentEmail: updatedSubmission.student_email,
      studentName: updatedSubmission.student_name,
      attemptNumber: updatedSubmission.attempt_number,
      status: updatedSubmission.status,
      content: updatedSubmission.content,
      attachments: updatedSubmission.attachments,
      submittedAt: updatedSubmission.submitted_at,
      gradedAt: updatedSubmission.graded_at,
      gradedBy: updatedSubmission.graded_by,
      grade: updatedSubmission.grade,
      feedback: updatedSubmission.feedback,
      rubricScores: updatedSubmission.rubric_scores,
      timeSpentMinutes: updatedSubmission.time_spent_minutes,
      lateSubmission: updatedSubmission.late_submission,
      createdAt: updatedSubmission.created_at,
      updatedAt: updatedSubmission.updated_at
    };

    res.json(transformedSubmission);
  } catch (error) {
    console.error('Error in POST /submissions/:submissionId/grade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
