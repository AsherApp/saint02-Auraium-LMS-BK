import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Get all assignments for a teacher
router.get('/', requireAuth, async (req, res) => {
  try {
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get course IDs owned by the teacher
    const { data: teacherCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('teacher_email', teacherEmail);

    if (coursesError) {
      console.error('Error fetching teacher courses:', coursesError);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }

    if (!teacherCourses || teacherCourses.length === 0) {
      return res.json([]);
    }

    const courseIds = teacherCourses.map(course => course.id);

    // Get assignments for those courses
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        type,
        scope,
        points,
        due_at,
        available_from,
        available_until,
        allow_late_submissions,
        late_penalty_percent,
        max_attempts,
        time_limit_minutes,
        require_rubric,
        rubric,
        resources,
        settings,
        created_at,
        updated_at,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return res.status(500).json({ error: 'Failed to fetch assignments' });
    }

    // Transform to match AssignmentProAPI format
    const transformedAssignments = assignments?.map(assignment => ({
      id: assignment.id,
      courseId: assignment.course_id,
      courseTitle: assignment.courses?.title || '',
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions,
      type: assignment.type,
      scope: assignment.scope,
      points: assignment.points,
      dueAt: assignment.due_at,
      availableFrom: assignment.available_from,
      availableUntil: assignment.available_until,
      allowLateSubmissions: assignment.allow_late_submissions,
      latePenaltyPercent: assignment.late_penalty_percent,
      maxAttempts: assignment.max_attempts,
      timeLimitMinutes: assignment.time_limit_minutes,
      requireRubric: assignment.require_rubric,
      rubric: assignment.rubric,
      resources: assignment.resources,
      settings: assignment.settings,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      status: 'active',
      submissionCount: 0, // Will be calculated separately if needed
      gradedCount: 0 // Will be calculated separately if needed
    })) || [];

    res.json(transformedAssignments);
  } catch (error) {
    console.error('Error in GET /assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignment by ID (for both teachers and students)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the assignment with course info
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        type,
        scope,
        points,
        due_at,
        available_from,
        available_until,
        allow_late_submissions,
        late_penalty_percent,
        max_attempts,
        time_limit_minutes,
        require_rubric,
        rubric,
        resources,
        settings,
        created_at,
        updated_at,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check access permissions
    if (userRole === 'teacher') {
      // Teacher can only access their own assignments
      if (assignment.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'student') {
      // Student must be enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', assignment.course_id)
        .eq('student_email', userEmail)
        .single();

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get student's submission if they're a student
    let studentSubmission = null;
    if (userRole === 'student') {
      const { data: submission, error: submissionError } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('assignment_id', id)
        .eq('student_email', userEmail)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .single();

      if (!submissionError && submission) {
        studentSubmission = {
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
      }
    }

    // Transform to match AssignmentProAPI format
    const transformedAssignment = {
      id: assignment.id,
      courseId: assignment.course_id,
      courseTitle: assignment.courses?.title || '',
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions,
      type: assignment.type,
      scope: assignment.scope,
      points: assignment.points,
      dueAt: assignment.due_at,
      availableFrom: assignment.available_from,
      availableUntil: assignment.available_until,
      allowLateSubmissions: assignment.allow_late_submissions,
      latePenaltyPercent: assignment.late_penalty_percent,
      maxAttempts: assignment.max_attempts,
      timeLimitMinutes: assignment.time_limit_minutes,
      requireRubric: assignment.require_rubric,
      rubric: assignment.rubric,
      resources: assignment.resources,
      settings: assignment.settings,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      status: 'active',
      studentSubmission: studentSubmission
    };

    res.json(transformedAssignment);
  } catch (error) {
    console.error('Error in GET /assignments/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new assignment
router.post('/', requireAuth, async (req, res) => {
  try {
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      course_id,
      title,
      description,
      instructions,
      type,
      scope,
      points,
      due_at,
      available_from,
      available_until,
      allow_late_submissions,
      late_penalty_percent,
      max_attempts,
      time_limit_minutes,
      require_rubric,
      rubric,
      resources,
      settings
    } = req.body;

    // Validate required fields
    if (!course_id || !title || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if teacher owns the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('teacher_email', teacherEmail)
      .single();

    if (courseError || !course) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .insert({
        course_id,
        title,
        description,
        instructions: instructions || '',
        type,
        scope: scope || { level: 'course' },
        points: points || 100,
        due_at,
        available_from,
        available_until,
        allow_late_submissions: allow_late_submissions !== undefined ? allow_late_submissions : true,
        late_penalty_percent: late_penalty_percent || 10,
        max_attempts: max_attempts || 1,
        time_limit_minutes,
        require_rubric: require_rubric || false,
        rubric: rubric || [],
        resources: resources || [],
        settings: settings || {
          allow_comments: true,
          show_grades_immediately: false,
          anonymous_grading: false,
          plagiarism_check: false,
          group_assignment: false,
          max_group_size: null,
          self_assessment: false,
          peer_review: false,
          peer_review_count: null
        }
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return res.status(500).json({ error: 'Failed to create assignment' });
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error in POST /assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update assignment
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('assignments')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return res.status(500).json({ error: 'Failed to update assignment' });
    }

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error in PUT /assignments/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete assignment
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete assignment (cascades to submissions)
    const { error: deleteError } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return res.status(500).json({ error: 'Failed to delete assignment' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /assignments/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignments for a specific course
router.get('/course/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userEmail = (req as any).user?.email;
    const userRole = (req as any).user?.role;

    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check access permissions
    if (userRole === 'teacher') {
      // Teacher can only access their own courses
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('teacher_email', userEmail)
        .single();

      if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (userRole === 'student') {
      // Student must be enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_email', userEmail)
        .single();

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get assignments for the course
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        type,
        scope,
        points,
        due_at,
        available_from,
        available_until,
        allow_late_submissions,
        late_penalty_percent,
        max_attempts,
        time_limit_minutes,
        require_rubric,
        rubric,
        resources,
        settings,
        created_at,
        updated_at,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return res.status(500).json({ error: 'Failed to fetch assignments' });
    }

    // Transform to match AssignmentProAPI format
    const transformedAssignments = assignments?.map(assignment => ({
      id: assignment.id,
      courseId: assignment.course_id,
      courseTitle: assignment.courses?.title || '',
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions,
      type: assignment.type,
      scope: assignment.scope,
      points: assignment.points,
      dueAt: assignment.due_at,
      availableFrom: assignment.available_from,
      availableUntil: assignment.available_until,
      allowLateSubmissions: assignment.allow_late_submissions,
      latePenaltyPercent: assignment.late_penalty_percent,
      maxAttempts: assignment.max_attempts,
      timeLimitMinutes: assignment.time_limit_minutes,
      requireRubric: assignment.require_rubric,
      rubric: assignment.rubric,
      resources: assignment.resources,
      settings: assignment.settings,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      status: 'active'
    })) || [];

    res.json(transformedAssignments);
  } catch (error) {
    console.error('Error in GET /assignments/course/:courseId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grade a submission
router.post('/:id/grade', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { submissionId, grade, feedback, rubricScores } = req.body;

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: 'graded',
        grade,
        feedback,
        rubric_scores: rubricScores || [],
        graded_at: new Date().toISOString(),
        graded_by: teacherEmail
      })
      .eq('id', submissionId)
      .eq('assignment_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error grading submission:', updateError);
      return res.status(500).json({ error: 'Failed to grade submission' });
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error in POST /assignments/:id/grade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submissions for an assignment (teacher only)
router.get('/:id/submissions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get submissions
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    // Transform to match expected format
    const transformedSubmissions = submissions?.map(submission => ({
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
    })) || [];

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error in GET /assignments/:id/submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed submissions with student info
router.get('/:id/submissions/detailed', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get submissions with student info
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        students!inner(
          email,
          name,
          avatar_url
        )
      `)
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    // Transform to match expected format
    const transformedSubmissions = submissions?.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentEmail: submission.student_email,
      studentName: submission.students?.name || submission.student_name,
      studentAvatar: submission.students?.avatar_url,
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
    })) || [];

    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error in GET /assignments/:id/submissions/detailed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Duplicate assignment
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the original assignment
    const { data: originalAssignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (assignmentError || !originalAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if teacher owns the assignment
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, teacher_email')
      .eq('id', originalAssignment.course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create duplicate assignment with modified title
    const duplicateTitle = `${originalAssignment.title} (Copy)`;
    
    const { data: duplicatedAssignment, error: duplicateError } = await supabaseAdmin
      .from('assignments')
      .insert({
        course_id: originalAssignment.course_id,
        title: duplicateTitle,
        description: originalAssignment.description,
        instructions: originalAssignment.instructions,
        type: originalAssignment.type,
        scope: originalAssignment.scope,
        points: originalAssignment.points,
        due_at: null, // Reset due date for duplicate
        available_from: null, // Reset availability dates
        available_until: null,
        allow_late_submissions: originalAssignment.allow_late_submissions,
        late_penalty_percent: originalAssignment.late_penalty_percent,
        max_attempts: originalAssignment.max_attempts,
        time_limit_minutes: originalAssignment.time_limit_minutes,
        require_rubric: originalAssignment.require_rubric,
        rubric: originalAssignment.rubric,
        resources: originalAssignment.resources,
        settings: originalAssignment.settings
      })
      .select()
      .single();

    if (duplicateError) {
      console.error('Error duplicating assignment:', duplicateError);
      return res.status(500).json({ error: 'Failed to duplicate assignment' });
    }

    // Transform to match AssignmentProAPI format
    const transformedAssignment = {
      id: duplicatedAssignment.id,
      courseId: duplicatedAssignment.course_id,
      courseTitle: course.title || '',
      title: duplicatedAssignment.title,
      description: duplicatedAssignment.description || '',
      instructions: duplicatedAssignment.instructions,
      type: duplicatedAssignment.type,
      scope: duplicatedAssignment.scope,
      points: duplicatedAssignment.points,
      dueAt: duplicatedAssignment.due_at,
      availableFrom: duplicatedAssignment.available_from,
      availableUntil: duplicatedAssignment.available_until,
      allowLateSubmissions: duplicatedAssignment.allow_late_submissions,
      latePenaltyPercent: duplicatedAssignment.late_penalty_percent,
      maxAttempts: duplicatedAssignment.max_attempts,
      timeLimitMinutes: duplicatedAssignment.time_limit_minutes,
      requireRubric: duplicatedAssignment.require_rubric,
      rubric: duplicatedAssignment.rubric,
      resources: duplicatedAssignment.resources,
      settings: duplicatedAssignment.settings,
      createdAt: duplicatedAssignment.created_at,
      updatedAt: duplicatedAssignment.updated_at,
      status: 'active'
    };

    res.status(201).json(transformedAssignment);
  } catch (error) {
    console.error('Error in POST /assignments/:id/duplicate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get grading statistics
router.get('/:id/grading-stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('course_id, courses!inner(teacher_email)')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get submission statistics
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('status, grade, submitted_at')
      .eq('assignment_id', id);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    const totalSubmissions = submissions?.length || 0;
    const submittedCount = submissions?.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0;
    const gradedCount = submissions?.filter(s => s.status === 'graded').length || 0;
    const lateCount = submissions?.filter(s => s.late_submission).length || 0;

    const averageGrade = submissions && submissions.length > 0
      ? submissions
          .filter(s => s.grade !== null)
          .reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade !== null).length
      : 0;

    const stats = {
      total_submissions: totalSubmissions,
      submitted_count: submittedCount,
      graded_count: gradedCount,
      late_count: lateCount,
      pending_grading: submittedCount - gradedCount,
      average_grade: Math.round(averageGrade * 100) / 100,
      completion_rate: totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0,
      grading_progress: totalSubmissions > 0 ? (gradedCount / totalSubmissions) * 100 : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in GET /assignments/:id/grading-stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all submissions for an assignment (teacher only)
router.get('/:id/submissions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacherEmail = (req as any).user?.email;
    
    if (!teacherEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if teacher owns the assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        course_id,
        courses!inner(
          id,
          teacher_email
        )
      `)
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.courses.teacher_email !== teacherEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all submissions for this assignment
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
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false });

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
      content: submission.content || {},
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
    console.error('Error in GET /assignments/:id/submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

