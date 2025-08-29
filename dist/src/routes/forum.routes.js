import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
export const router = Router();
// Get all discussions for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { courseId } = req.params;
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
    }
    else if (userRole === 'student') {
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
    // Get discussions
    const { data: discussions, error: discussionsError } = await supabaseAdmin
        .from('discussions')
        .select(`
      *,
      created_by_user:users!discussions_created_by_fkey(name, email),
      posts:discussion_posts(
        id,
        content,
        created_at,
        created_by,
        users!discussion_posts_created_by_fkey(name, email)
      )
    `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
    if (discussionsError) {
        return res.status(500).json({ error: discussionsError.message });
    }
    res.json({ items: discussions || [] });
}));
// Create a new discussion
router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { title, content, course_id, is_pinned = false } = req.body;
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!title || !content || !course_id) {
        return res.status(400).json({ error: 'title, content, and course_id are required' });
    }
    // Check access permissions
    if (userRole === 'teacher') {
        // Teacher can only create in their own courses
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', course_id)
            .eq('teacher_email', userEmail)
            .single();
        if (courseError || !course) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    else if (userRole === 'student') {
        // Student must be enrolled in the course
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('course_id', course_id)
            .eq('student_email', userEmail)
            .single();
        if (enrollmentError || !enrollment) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    // Create discussion
    const { data: discussion, error: discussionError } = await supabaseAdmin
        .from('discussions')
        .insert({
        title,
        content,
        course_id,
        created_by: userEmail,
        is_pinned
    })
        .select()
        .single();
    if (discussionError) {
        return res.status(500).json({ error: discussionError.message });
    }
    res.status(201).json(discussion);
}));
// Get a specific discussion with all posts
router.get('/:discussionId', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { discussionId } = req.params;
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get discussion
    const { data: discussion, error: discussionError } = await supabaseAdmin
        .from('discussions')
        .select(`
      *,
      created_by_user:users!discussions_created_by_fkey(name, email)
    `)
        .eq('id', discussionId)
        .single();
    if (discussionError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
    }
    // Check access permissions
    if (userRole === 'teacher') {
        // Teacher can only access their own courses
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', discussion.course_id)
            .eq('teacher_email', userEmail)
            .single();
        if (courseError || !course) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    else if (userRole === 'student') {
        // Student must be enrolled in the course
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('course_id', discussion.course_id)
            .eq('student_email', userEmail)
            .single();
        if (enrollmentError || !enrollment) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    // Get all posts for this discussion
    const { data: posts, error: postsError } = await supabaseAdmin
        .from('discussion_posts')
        .select(`
      *,
      created_by_user:users!discussion_posts_created_by_fkey(name, email)
    `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });
    if (postsError) {
        return res.status(500).json({ error: postsError.message });
    }
    res.json({
        discussion,
        posts: posts || []
    });
}));
// Add a post to a discussion
router.post('/:discussionId/posts', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { discussionId } = req.params;
    const { content } = req.body;
    if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!content) {
        return res.status(400).json({ error: 'content is required' });
    }
    // Get discussion to check access
    const { data: discussion, error: discussionError } = await supabaseAdmin
        .from('discussions')
        .select('course_id')
        .eq('id', discussionId)
        .single();
    if (discussionError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
    }
    // Check access permissions
    if (userRole === 'teacher') {
        // Teacher can only post in their own courses
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', discussion.course_id)
            .eq('teacher_email', userEmail)
            .single();
        if (courseError || !course) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    else if (userRole === 'student') {
        // Student must be enrolled in the course
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('course_id', discussion.course_id)
            .eq('student_email', userEmail)
            .single();
        if (enrollmentError || !enrollment) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    // Create post
    const { data: post, error: postError } = await supabaseAdmin
        .from('discussion_posts')
        .insert({
        discussion_id: discussionId,
        content,
        created_by: userEmail
    })
        .select()
        .single();
    if (postError) {
        return res.status(500).json({ error: postError.message });
    }
    res.status(201).json(post);
}));
// Update a discussion (teacher only)
router.put('/:discussionId', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { discussionId } = req.params;
    const { title, content, is_pinned } = req.body;
    if (!userEmail || userRole !== 'teacher') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Check if teacher owns the discussion
    const { data: discussion, error: discussionError } = await supabaseAdmin
        .from('discussions')
        .select('created_by, course_id')
        .eq('id', discussionId)
        .single();
    if (discussionError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
    }
    // Check if teacher owns the course
    const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('id', discussion.course_id)
        .eq('teacher_email', userEmail)
        .single();
    if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Update discussion
    const { data: updatedDiscussion, error: updateError } = await supabaseAdmin
        .from('discussions')
        .update({
        title,
        content,
        is_pinned,
        updated_at: new Date().toISOString()
    })
        .eq('id', discussionId)
        .select()
        .single();
    if (updateError) {
        return res.status(500).json({ error: updateError.message });
    }
    res.json(updatedDiscussion);
}));
// Delete a discussion (teacher only)
router.delete('/:discussionId', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role;
    const { discussionId } = req.params;
    if (!userEmail || userRole !== 'teacher') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Check if teacher owns the discussion
    const { data: discussion, error: discussionError } = await supabaseAdmin
        .from('discussions')
        .select('created_by, course_id')
        .eq('id', discussionId)
        .single();
    if (discussionError || !discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
    }
    // Check if teacher owns the course
    const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('id', discussion.course_id)
        .eq('teacher_email', userEmail)
        .single();
    if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // Delete discussion (posts will be deleted via cascade)
    const { error: deleteError } = await supabaseAdmin
        .from('discussions')
        .delete()
        .eq('id', discussionId);
    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }
    res.json({ success: true });
}));
export default router;
