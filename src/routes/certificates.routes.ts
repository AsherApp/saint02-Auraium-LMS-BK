import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';

export const router = express.Router();

// GET certificate statistics for a course
router.get('/course/:courseId/stats', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const teacherEmail = (req as any).user?.email;
  const userRole = (req as any).user?.role;

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied - Teachers only' });
  }

  try {
    // Verify teacher owns this course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, teacher_email')
      .eq('id', courseId)
      .eq('teacher_email', teacherEmail)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Get total students enrolled
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('student_email')
      .eq('course_id', courseId);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
    }

    // Get certificates issued
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('id, student_email')
      .eq('course_id', courseId);

    if (certError) {
      console.error('Error fetching certificates:', certError);
    }

    // Get students who completed the course but don't have certificates
    const { data: completedStudents, error: completedError } = await supabaseAdmin
      .from('student_course_progress')
      .select('student_email')
      .eq('course_id', courseId)
      .eq('completion_percentage', 100);

    if (completedError) {
      console.error('Error fetching completed students:', completedError);
    }

    const stats = {
      total_students: enrollments?.length || 0,
      certificates_issued: certificates?.length || 0,
      pending_completion: (completedStudents?.length || 0) - (certificates?.length || 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching certificate stats:', error);
    res.status(500).json({ error: 'Failed to fetch certificate statistics' });
  }
}));

// GET all certificates for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const teacherEmail = (req as any).user?.email;
  const userRole = (req as any).user?.role;

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied - Teachers only' });
  }

  try {
    // Verify teacher owns this course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, teacher_email')
      .eq('id', courseId)
      .eq('teacher_email', teacherEmail)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Get all certificates for this course
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (certError) {
      console.error('Error fetching certificates:', certError);
      return res.status(500).json({ error: 'Failed to fetch certificates' });
    }

    res.json(certificates || []);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
}));

// GET certificate by ID
router.get('/:certificateId', requireAuth, asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const userEmail = (req as any).user?.email;
  const userRole = (req as any).user?.role;

  try {
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Check access permissions
    if (userRole === 'student' && certificate.student_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (userRole === 'teacher') {
      // Verify teacher owns the course
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('teacher_email')
        .eq('id', certificate.course_id)
        .eq('teacher_email', userEmail)
        .single();

      if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
}));

// GET all certificates for current user (student)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email;
  const userRole = (req as any).user?.role;

  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Access denied - Students only' });
  }

  try {
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('student_email', userEmail)
      .order('created_at', { ascending: false });

    if (certError) {
      console.error('Error fetching certificates:', certError);
      return res.status(500).json({ error: 'Failed to fetch certificates' });
    }

    res.json(certificates || []);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
}));
