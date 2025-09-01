import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middlewares/auth.js';
export const router = Router();
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated teacher's email
    const teacherEmail = req.user?.email;
    if (!teacherEmail) {
        return res.status(401).json({ error: 'Teacher email not found in request' });
    }
    // Only return courses created by this teacher
    const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('teacher_email', teacherEmail)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const { title, description, teacher_email } = req.body || {};
    if (!title || !teacher_email)
        return res.status(400).json({ error: 'missing_fields' });
    const { data, error } = await supabaseAdmin.from('courses').insert({ title, description, teacher_email }).select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
}));
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated user's email and role
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!userEmail) {
        return res.status(401).json({ error: 'User email not found in request' });
    }
    let data, error;
    if (userRole === 'teacher') {
        // Teachers can only access their own courses
        const result = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', req.params.id)
            .eq('teacher_email', userEmail)
            .single();
        data = result.data;
        error = result.error;
    }
    else if (userRole === 'student') {
        // Students can access courses they're enrolled in
        const result = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', req.params.id)
            .eq('enrollments.student_email', userEmail)
            .single();
        data = result.data;
        error = result.error;
        // If no direct match, check if student is enrolled in this course
        if (error || !data) {
            const enrollmentCheck = await supabaseAdmin
                .from('enrollments')
                .select('course_id')
                .eq('course_id', req.params.id)
                .eq('student_email', userEmail)
                .single();
            if (enrollmentCheck.data) {
                // Student is enrolled, get the course
                const courseResult = await supabaseAdmin
                    .from('courses')
                    .select('*')
                    .eq('id', req.params.id)
                    .single();
                data = courseResult.data;
                error = courseResult.error;
            }
        }
    }
    else {
        return res.status(403).json({ error: 'Invalid user role' });
    }
    if (error)
        return res.status(404).json({ error: 'Course not found or access denied' });
    res.json(data);
}));
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated teacher's email
    const teacherEmail = req.user?.email;
    if (!teacherEmail) {
        return res.status(401).json({ error: 'Teacher email not found in request' });
    }
    const { title, description, status } = req.body || {};
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    // Only update course if it belongs to this teacher
    const { data, error } = await supabaseAdmin
        .from('courses')
        .update(updateData)
        .eq('id', req.params.id)
        .eq('teacher_email', teacherEmail)
        .select()
        .single();
    if (error)
        return res.status(404).json({ error: 'Course not found or access denied' });
    res.json(data);
}));
router.get('/:id/roster', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated user's email and role
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!userEmail) {
        return res.status(401).json({ error: 'User email not found in request' });
    }
    let hasAccess = false;
    if (userRole === 'teacher') {
        // Teachers can access full roster for their own courses
        const { data: course } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', req.params.id)
            .eq('teacher_email', userEmail)
            .single();
        hasAccess = !!course;
    }
    else if (userRole === 'student') {
        // Students can access basic enrollment info for courses they're enrolled in
        const { data: enrollment } = await supabaseAdmin
            .from('enrollments')
            .select('course_id')
            .eq('course_id', req.params.id)
            .eq('student_email', userEmail)
            .single();
        hasAccess = !!enrollment;
    }
    else {
        return res.status(403).json({ error: 'Invalid user role' });
    }
    if (!hasAccess) {
        return res.status(404).json({ error: 'Course not found or access denied' });
    }
    // Get enrollments for this course
    const { data, error } = await supabaseAdmin
        .from('enrollments')
        .select(`
      *,
      students(name, email, status)
    `)
        .eq('course_id', req.params.id);
    if (error)
        return res.status(500).json({ error: error.message });
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
        }));
        res.json({ items: enhancedEnrollments });
    }
    else {
        // Students get basic enrollment count and their own enrollment info
        const studentEnrollment = (data || []).find(e => e.student_email === userEmail);
        const enrollmentCount = (data || []).length;
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
        });
    }
}));
router.get('/:id/assignments', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated user's email and role
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!userEmail) {
        return res.status(401).json({ error: 'User email not found in request' });
    }
    let hasAccess = false;
    if (userRole === 'teacher') {
        // Teachers can access assignments for their own courses
        const { data: course } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', req.params.id)
            .eq('teacher_email', userEmail)
            .single();
        hasAccess = !!course;
    }
    else if (userRole === 'student') {
        // Students can access assignments for courses they're enrolled in
        const { data: enrollment } = await supabaseAdmin
            .from('enrollments')
            .select('course_id')
            .eq('course_id', req.params.id)
            .eq('student_email', userEmail)
            .single();
        hasAccess = !!enrollment;
    }
    else {
        return res.status(403).json({ error: 'Invalid user role' });
    }
    if (!hasAccess) {
        return res.status(404).json({ error: 'Course not found or access denied' });
    }
    // Get assignments for this course
    const { data, error } = await supabaseAdmin
        .from('assignments')
        .select('*')
        .eq('course_id', req.params.id)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
router.post('/:id/enroll', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated teacher's email
    const teacherEmail = req.user?.email;
    if (!teacherEmail) {
        return res.status(401).json({ error: 'Teacher email not found in request' });
    }
    const { student_email } = req.body || {};
    if (!student_email)
        return res.status(400).json({ error: 'missing_student' });
    // First verify the course belongs to this teacher
    const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('teacher_email')
        .eq('id', req.params.id)
        .eq('teacher_email', teacherEmail)
        .single();
    if (courseError || !course) {
        return res.status(404).json({ error: 'Course not found or access denied' });
    }
    // enforce free tier cap by teacher
    const { data: t } = await supabaseAdmin.from('teachers').select('max_students_allowed').eq('email', teacherEmail).single();
    const { count } = await supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', req.params.id);
    const maxAllowed = t?.max_students_allowed ?? env.FREE_STUDENTS_LIMIT;
    if ((count || 0) >= maxAllowed)
        return res.status(402).json({ error: 'limit_reached' });
    const { error } = await supabaseAdmin.from('enrollments').insert({ course_id: req.params.id, student_email });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ ok: true });
}));
