import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { NotificationService } from '../services/notification.service.js';

const router = express.Router();

// Get submissions for an assignment (student view)
router.get('/assignment/:assignmentId', requireAuth, async (req, res) => {
  try {
    console.log('=== GET /assignment/:assignmentId ROUTE CALLED ===');
    const { assignmentId } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    // Get assignment to verify access
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        courses(title, teacher_email)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if user has access to this assignment
    if (userRole === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_email', userEmail)
        .eq('course_id', assignment.course_id)
        .single();

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'teacher') {
      // Check if teacher owns the course
      let courseTeacherEmail: string | undefined;
      if (Array.isArray(assignment.courses)) {
        courseTeacherEmail = assignment.courses[0]?.teacher_email;
      } else if (assignment.courses && typeof assignment.courses === 'object') {
        courseTeacherEmail = (assignment.courses as any).teacher_email;
      }
      if (courseTeacherEmail !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get submissions
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        *,
        students(first_name, last_name, email)
      `)
      .eq('assignment_id', assignmentId);

    // If student, only get their own submissions
    if (userRole === 'student') {
      query = query.eq('student_email', userEmail);
    }

    const { data: submissions, error } = await query.order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    res.json(submissions || []);
  } catch (error) {
    console.error('Error in submissions route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific submission
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        students(first_name, last_name, email),
        assignments(
          id,
          title,
          course_id,
          courses(title, teacher_email)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (userRole === 'student') {
      if (submission.student_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'teacher') {
      if (submission.assignments.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(submission);
  } catch (error) {
    console.error('Error in submission detail route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a submission
router.post('/assignment/:assignmentId', requireAuth, async (req, res) => {
  try {
    console.log('=== POST /assignment/:assignmentId ROUTE CALLED ===');
    console.log('Submission creation route called');
    const { assignmentId } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    console.log('Assignment ID:', assignmentId);
    console.log('User email:', userEmail);
    console.log('User role:', userRole);

    if (userRole !== 'student') {
      console.log('Access denied - not a student');
      return res.status(403).json({ error: 'Only students can submit assignments' });
    }

    const { content, attachments = [], status = 'submitted', timeSpentMinutes = 0 } = req.body;

    console.log('Request body:', req.body);
    console.log('Content:', content);
    console.log('Status:', status);

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        title,
        course_id,
        due_at,
        max_attempts,
        courses(title, teacher_email)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.log('Assignment error:', assignmentError);
      console.log('Assignment data:', assignment);
      return res.status(404).json({ error: 'Assignment not found' });
    }

    console.log('Assignment found:', assignment.title);

    // Check if student is enrolled
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_email', userEmail)
      .eq('course_id', assignment.course_id)
      .single();

    if (enrollmentError || !enrollment) {
      console.log('Enrollment error:', enrollmentError);
      console.log('Enrollment data:', enrollment);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Enrollment found:', enrollment.id);

    // Check if assignment is still available
    const now = new Date();
    if (assignment.due_at && new Date(assignment.due_at) < now && status === 'submitted') {
      return res.status(400).json({ error: 'Assignment deadline has passed' });
    }

    // Get student info
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('email', userEmail)
      .single();

    if (studentError || !student) {
      console.log('Student error:', studentError);
      console.log('Student data:', student);
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('Student found:', student.first_name, student.last_name);

    // Check existing submissions for attempt number
    const { data: existingSubmissions, error: existingError } = await supabaseAdmin
      .from('submissions')
      .select('attempt_number')
      .eq('assignment_id', assignmentId)
      .eq('student_email', userEmail)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (existingError) {
      console.error('Error checking existing submissions:', existingError);
    }

    const attemptNumber = existingSubmissions && existingSubmissions.length > 0 
      ? existingSubmissions[0].attempt_number + 1 
      : 1;

    // Check max attempts
    if (assignment.max_attempts && attemptNumber > assignment.max_attempts) {
      return res.status(400).json({ error: 'Maximum attempts exceeded' });
    }

    // Check if this is a late submission
    const lateSubmission = assignment.due_at && new Date(assignment.due_at) < now;

    // Create submission
    const submissionData = {
      assignment_id: assignmentId,
      course_id: assignment.course_id,
      student_id: student.id,
      student_email: userEmail,
      student_name: `${student.first_name} ${student.last_name}`,
      attempt_number: attemptNumber,
      status: status,
      content: content,
      attachments: attachments,
      time_spent_minutes: timeSpentMinutes,
      late_submission: lateSubmission,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null
    };

    console.log('Creating submission with data:', JSON.stringify(submissionData, null, 2));

    // Ensure course_completions record exists to prevent trigger issues
    console.log('Ensuring course_completions record exists...');
    const { data: existingCompletion, error: completionCheckError } = await supabaseAdmin
      .from('course_completions')
      .select('id')
      .eq('student_id', student.id)
      .eq('course_id', assignment.course_id)
      .single();

    if (completionCheckError && completionCheckError.code === 'PGRST116') {
      // Record doesn't exist, create it with ALL required fields
      console.log('Creating course_completions record...');
      const { error: completionCreateError } = await supabaseAdmin
        .from('course_completions')
        .insert({
          student_id: student.id,
          student_email: userEmail,
          course_id: assignment.course_id,
          completion_percentage: 0,
          total_lessons: 0,
          completed_lessons: 0,
          total_assignments: 0,
          completed_assignments: 0,
          total_quizzes: 0,
          passed_quizzes: 0,
          completed_at: null
        });

      if (completionCreateError) {
        console.error('Error creating course_completions:', completionCreateError);
        // Continue anyway - the trigger might still work
      } else {
        console.log('Course_completions record created successfully');
      }
    } else if (completionCheckError) {
      console.error('Error checking course_completions:', completionCheckError);
    } else {
      console.log('Course_completions record already exists');
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert(submissionData)
      .select(`
        *,
        students(first_name, last_name, email)
      `)
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      console.error('Submission data that failed:', JSON.stringify(submissionData, null, 2));
      return res.status(500).json({ error: 'Failed to create submission' });
    }

    console.log('Submission created successfully:', submission.id);

    // Send notification to teacher if submitted
    if (status === 'submitted') {
      try {
        await NotificationService.sendNotification({
          user_email: assignment.courses[0]?.teacher_email,
          user_type: 'teacher',
          type: 'assignment_submitted',
          title: 'New Assignment Submission',
          message: `A student has submitted an assignment: "${assignment.title}"`,
          data: {
            assignment_title: assignment.title,
            student_name: submission.student_name,
            course_id: assignment.course_id,
            submission_id: submission.id
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error in create submission route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a submission
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    const { content, attachments, status, timeSpentMinutes } = req.body;

    // Get existing submission
    const { data: existingSubmission, error: existingError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments(
          id,
          title,
          due_at,
          courses(title, teacher_email)
        )
      `)
      .eq('id', id)
      .single();

    if (existingError || !existingSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (userRole === 'student') {
      if (existingSubmission.student_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if submission can be edited
      if (existingSubmission.status === 'graded' && status !== 'returned') {
        return res.status(400).json({ error: 'Cannot edit graded submission' });
      }
    } else if (userRole === 'teacher') {
      if (existingSubmission.assignments.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check if assignment is still available for students
    if (userRole === 'student' && status === 'submitted') {
      const now = new Date();
      if (existingSubmission.assignments.due_at && new Date(existingSubmission.assignments.due_at) < now) {
        return res.status(400).json({ error: 'Assignment deadline has passed' });
      }
    }

    // Update submission
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (status !== undefined) updateData.status = status;
    if (timeSpentMinutes !== undefined) updateData.time_spent_minutes = timeSpentMinutes;
    
    // Update submitted_at if status changed to submitted
    if (status === 'submitted' && existingSubmission.status !== 'submitted') {
      updateData.submitted_at = new Date().toISOString();
    }

    const { data: submission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        students(first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return res.status(500).json({ error: 'Failed to update submission' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error in update submission route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grade a submission
router.post('/:id/grade', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback, rubric_scores = [] } = req.body;
    const teacherEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    if (userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can grade submissions' });
    }

    if (grade === undefined) {
      return res.status(400).json({ error: 'Grade is required' });
    }

    // Get submission and verify teacher access
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignments(
          id,
          title,
          points,
          course_id,
          courses(title, teacher_email)
        )
      `)
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    let courseTeacherEmail: string | undefined;
    if (Array.isArray(submission.assignments.courses)) {
      courseTeacherEmail = submission.assignments.courses[0]?.teacher_email;
    } else if (submission.assignments.courses && typeof submission.assignments.courses === 'object') {
      courseTeacherEmail = (submission.assignments.courses as any).teacher_email;
    }
    if (courseTeacherEmail !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate grade
    if (grade < 0 || grade > submission.assignments.points) {
      return res.status(400).json({ 
        error: `Grade must be between 0 and ${submission.assignments.points}` 
      });
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        grade: grade,
        feedback: feedback,
        rubric_scores: rubric_scores,
        graded_at: new Date().toISOString(),
        graded_by: teacherEmail,
        status: 'graded'
      })
      .eq('id', id)
      .select(`
        *,
        students(first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error grading submission:', updateError);
      return res.status(500).json({ error: 'Failed to grade submission' });
    }

    // Send notification to student
    try {
      await NotificationService.sendNotification({
        user_email: submission.student_email,
        user_type: 'student',
        type: 'assignment_graded',
        title: 'Assignment Graded',
        message: `Your assignment "${submission.assignments.title}" has been graded.`,
        data: {
          assignment_title: submission.assignments.title,
          grade: grade,
          max_points: submission.assignments.points,
          course_id: submission.assignments.course_id
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error in grade submission route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;