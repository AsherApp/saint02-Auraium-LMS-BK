import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { supabaseAdmin } from '../lib/supabase.js';
export const router = Router();
// Get lessons for a module
router.get('/module/:moduleId', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated user's email and role
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!userEmail) {
        return res.status(401).json({ error: 'User email not found in request' });
    }
    const { moduleId } = req.params;
    let hasAccess = false;
    if (userRole === 'teacher') {
        // Teachers can access lessons for their own courses
        const { data: module } = await supabaseAdmin
            .from('modules')
            .select(`
        *,
        courses!inner(teacher_email)
      `)
            .eq('id', moduleId)
            .eq('courses.teacher_email', userEmail)
            .single();
        hasAccess = !!module;
    }
    else if (userRole === 'student') {
        // Students can access lessons for courses they're enrolled in
        const { data: module } = await supabaseAdmin
            .from('modules')
            .select(`
        *,
        courses!inner(
          id,
          enrollments!inner(student_email)
        )
      `)
            .eq('id', moduleId)
            .eq('courses.enrollments.student_email', userEmail)
            .single();
        hasAccess = !!module;
    }
    else {
        return res.status(403).json({ error: 'Invalid user role' });
    }
    if (!hasAccess) {
        return res.status(404).json({ error: 'Module not found or access denied' });
    }
    const { data, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
}));
// Get a specific lesson
router.get('/:lessonId', requireAuth, asyncHandler(async (req, res) => {
    // Get the authenticated user's email and role
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    if (!userEmail) {
        return res.status(401).json({ error: 'User email not found in request' });
    }
    const { lessonId } = req.params;
    let hasAccess = false;
    if (userRole === 'teacher') {
        // Teachers can access lessons for their own courses
        const { data: lesson } = await supabaseAdmin
            .from('lessons')
            .select(`
        *,
        modules!inner(
          course_id,
          courses!inner(teacher_email)
        )
      `)
            .eq('id', lessonId)
            .eq('modules.courses.teacher_email', userEmail)
            .single();
        hasAccess = !!lesson;
    }
    else if (userRole === 'student') {
        // Students can access lessons for courses they're enrolled in
        const { data: lesson } = await supabaseAdmin
            .from('lessons')
            .select(`
        *,
        modules!inner(
          course_id,
          courses!inner(
            id,
            enrollments!inner(student_email)
          )
        )
      `)
            .eq('id', lessonId)
            .eq('modules.courses.enrollments.student_email', userEmail)
            .single();
        hasAccess = !!lesson;
    }
    else {
        return res.status(403).json({ error: 'Invalid user role' });
    }
    if (!hasAccess) {
        return res.status(404).json({ error: 'Lesson not found or access denied' });
    }
    const { data, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Create a new lesson
router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const { module_id, title, type, description, content, duration, points, required } = req.body;
    const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase();
    if (!module_id || !title || !type) {
        return res.status(400).json({ error: 'missing_required_fields' });
    }
    // For now, skip authorization check until database schema is properly set up
    const { data, error } = await supabaseAdmin
        .from('lessons')
        .insert({
        module_id,
        title,
        type,
        description: description || '',
        content: content || null,
        duration: duration || 30,
        points: points || 10,
        required: required !== undefined ? required : true
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Update a lesson
router.put('/:lessonId', requireAuth, asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const updateData = req.body;
    const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase();
    // For now, skip authorization check until database schema is properly set up
    const { data, error } = await supabaseAdmin
        .from('lessons')
        .update(updateData)
        .eq('id', lessonId)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
// Delete a lesson
router.delete('/:lessonId', requireAuth, asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase();
    // For now, skip authorization check until database schema is properly set up
    const { error } = await supabaseAdmin
        .from('lessons')
        .delete()
        .eq('id', lessonId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ success: true });
}));
// Update lesson content
router.put('/:lessonId/content', requireAuth, asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { content } = req.body;
    const teacher_email = String(req.headers['x-user-email'] || '').toLowerCase();
    // For now, skip authorization check until database schema is properly set up
    const { data, error } = await supabaseAdmin
        .from('lessons')
        .update({ content })
        .eq('id', lessonId)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}));
