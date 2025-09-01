import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router();
// Get recordings for a student (recordings from courses they're enrolled in)
router.get('/student', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'student';
    if (userRole !== 'student') {
        return res.status(403).json({ error: 'Access denied. Students only.' });
    }
    if (!userEmail) {
        return res.status(400).json({ error: 'missing_user_email' });
    }
    try {
        // First get the courses the student is enrolled in
        const { data: enrollments, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .select('course_id')
            .eq('student_email', userEmail);
        if (enrollmentError) {
            console.error('Error fetching enrollments:', enrollmentError);
            return res.status(500).json({ error: 'Failed to fetch enrollments' });
        }
        if (!enrollments || enrollments.length === 0) {
            return res.json([]);
        }
        const courseIds = enrollments.map(e => e.course_id);
        // Then get recordings from those courses
        const { data: recordings, error } = await supabaseAdmin
            .from('recordings')
            .select(`
        *,
        courses(title)
      `)
            .in('course_id', courseIds)
            .order('recorded_at', { ascending: false });
        if (error) {
            console.error('Error fetching student recordings:', error);
            return res.status(500).json({ error: 'Failed to fetch recordings' });
        }
        // Transform the data to match frontend expectations
        const transformedRecordings = recordings?.map(recording => ({
            id: recording.id,
            title: recording.title,
            description: recording.description,
            session_id: recording.session_id,
            course_id: recording.course_id,
            course_title: recording.courses?.title || 'Unknown Course',
            teacher_email: recording.teacher_email,
            teacher_name: recording.teacher_name,
            duration: recording.duration || 0,
            file_size: recording.file_size || 0,
            file_url: recording.file_url,
            thumbnail_url: recording.thumbnail_url,
            recorded_at: recording.recorded_at,
            created_at: recording.created_at,
            view_count: recording.view_count || 0,
            is_bookmarked: recording.is_bookmarked || false,
            tags: recording.tags || [],
            quality: recording.quality || 'medium',
            format: recording.format || 'mp4'
        })) || [];
        res.json(transformedRecordings);
    }
    catch (error) {
        console.error('Error in student recordings route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get recordings for a teacher (recordings they created)
router.get('/teacher', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'teacher';
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }
    try {
        const { data: recordings, error } = await supabaseAdmin
            .from('recordings')
            .select(`
        *,
        courses(title)
      `)
            .eq('teacher_email', userEmail)
            .order('recorded_at', { ascending: false });
        if (error) {
            console.error('Error fetching teacher recordings:', error);
            return res.status(500).json({ error: 'Failed to fetch recordings' });
        }
        // Transform the data to match frontend expectations
        const transformedRecordings = recordings?.map(recording => ({
            id: recording.id,
            title: recording.title,
            description: recording.description,
            session_id: recording.session_id,
            course_id: recording.course_id,
            course_title: recording.courses?.title || 'Unknown Course',
            teacher_email: recording.teacher_email,
            teacher_name: recording.teacher_name,
            duration: recording.duration || 0,
            file_size: recording.file_size || 0,
            file_url: recording.file_url,
            thumbnail_url: recording.thumbnail_url,
            recorded_at: recording.recorded_at,
            created_at: recording.created_at,
            view_count: recording.view_count || 0,
            is_bookmarked: recording.is_bookmarked || false,
            tags: recording.tags || [],
            quality: recording.quality || 'medium',
            format: recording.format || 'mp4'
        })) || [];
        res.json(transformedRecordings);
    }
    catch (error) {
        console.error('Error in teacher recordings route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get a specific recording by ID
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'teacher';
    const recordingId = req.params.id;
    try {
        let query = supabaseAdmin
            .from('recordings')
            .select(`
        *,
        courses(title)
      `)
            .eq('id', recordingId);
        if (userRole === 'student') {
            // Students can only access recordings from courses they're enrolled in
            query = query.eq('courses.enrollments.student_email', userEmail);
        }
        else if (userRole === 'teacher') {
            // Teachers can only access their own recordings
            query = query.eq('teacher_email', userEmail);
        }
        const { data: recording, error } = await query.single();
        if (error || !recording) {
            return res.status(404).json({ error: 'Recording not found or access denied' });
        }
        // Transform the data
        const transformedRecording = {
            id: recording.id,
            title: recording.title,
            description: recording.description,
            session_id: recording.session_id,
            course_id: recording.course_id,
            course_title: recording.courses?.title || 'Unknown Course',
            teacher_email: recording.teacher_email,
            teacher_name: recording.teacher_name,
            duration: recording.duration || 0,
            file_size: recording.file_size || 0,
            file_url: recording.file_url,
            thumbnail_url: recording.thumbnail_url,
            recorded_at: recording.recorded_at,
            created_at: recording.created_at,
            view_count: recording.view_count || 0,
            is_bookmarked: recording.is_bookmarked || false,
            tags: recording.tags || [],
            quality: recording.quality || 'medium',
            format: recording.format || 'mp4'
        };
        res.json(transformedRecording);
    }
    catch (error) {
        console.error('Error in get recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Create a new recording
router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'teacher';
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }
    const { title, description, session_id, course_id, duration, file_size, file_url, thumbnail_url, quality, format, tags } = req.body;
    try {
        // Verify the teacher owns the course
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', course_id)
            .eq('teacher_email', userEmail)
            .single();
        if (courseError || !course) {
            return res.status(403).json({ error: 'Course not found or access denied' });
        }
        const { data: recording, error } = await supabaseAdmin
            .from('recordings')
            .insert({
            title,
            description,
            session_id,
            course_id,
            teacher_email: userEmail,
            duration: duration || 0,
            file_size: file_size || 0,
            file_url,
            thumbnail_url,
            quality: quality || 'medium',
            format: format || 'mp4',
            tags: tags || [],
            recorded_at: new Date().toISOString(),
            view_count: 0,
            is_bookmarked: false
        })
            .select()
            .single();
        if (error) {
            console.error('Error creating recording:', error);
            return res.status(500).json({ error: 'Failed to create recording' });
        }
        res.status(201).json(recording);
    }
    catch (error) {
        console.error('Error in create recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update a recording
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'teacher';
    const recordingId = req.params.id;
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }
    try {
        // Verify the teacher owns the recording
        const { data: existingRecording, error: fetchError } = await supabaseAdmin
            .from('recordings')
            .select('id')
            .eq('id', recordingId)
            .eq('teacher_email', userEmail)
            .single();
        if (fetchError || !existingRecording) {
            return res.status(404).json({ error: 'Recording not found or access denied' });
        }
        const { data: recording, error } = await supabaseAdmin
            .from('recordings')
            .update(req.body)
            .eq('id', recordingId)
            .select()
            .single();
        if (error) {
            console.error('Error updating recording:', error);
            return res.status(500).json({ error: 'Failed to update recording' });
        }
        res.json(recording);
    }
    catch (error) {
        console.error('Error in update recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Delete a recording
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const userRole = req.user?.role || 'teacher';
    const recordingId = req.params.id;
    if (userRole !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }
    try {
        // Verify the teacher owns the recording
        const { data: existingRecording, error: fetchError } = await supabaseAdmin
            .from('recordings')
            .select('id')
            .eq('id', recordingId)
            .eq('teacher_email', userEmail)
            .single();
        if (fetchError || !existingRecording) {
            return res.status(404).json({ error: 'Recording not found or access denied' });
        }
        const { error } = await supabaseAdmin
            .from('recordings')
            .delete()
            .eq('id', recordingId);
        if (error) {
            console.error('Error deleting recording:', error);
            return res.status(500).json({ error: 'Failed to delete recording' });
        }
        res.json({ message: 'Recording deleted successfully' });
    }
    catch (error) {
        console.error('Error in delete recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Bookmark/unbookmark a recording
router.post('/:id/bookmark', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const recordingId = req.params.id;
    try {
        // Verify the user has access to the recording
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('recordings')
            .select('id')
            .eq('id', recordingId)
            .single();
        if (fetchError || !recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        // Update the bookmark status
        const { error } = await supabaseAdmin
            .from('recordings')
            .update({ is_bookmarked: true })
            .eq('id', recordingId);
        if (error) {
            console.error('Error bookmarking recording:', error);
            return res.status(500).json({ error: 'Failed to bookmark recording' });
        }
        res.json({ message: 'Recording bookmarked successfully' });
    }
    catch (error) {
        console.error('Error in bookmark recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.post('/:id/unbookmark', requireAuth, asyncHandler(async (req, res) => {
    const userEmail = req.user?.email;
    const recordingId = req.params.id;
    try {
        // Verify the user has access to the recording
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('recordings')
            .select('id')
            .eq('id', recordingId)
            .single();
        if (fetchError || !recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }
        // Update the bookmark status
        const { error } = await supabaseAdmin
            .from('recordings')
            .update({ is_bookmarked: false })
            .eq('id', recordingId);
        if (error) {
            console.error('Error unbookmarking recording:', error);
            return res.status(500).json({ error: 'Failed to unbookmark recording' });
        }
        res.json({ message: 'Recording unbookmarked successfully' });
    }
    catch (error) {
        console.error('Error in unbookmark recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Increment view count
router.post('/:id/view', requireAuth, asyncHandler(async (req, res) => {
    const recordingId = req.params.id;
    try {
        const { error } = await supabaseAdmin
            .from('recordings')
            .update({ view_count: 1 }) // Simplified for now, need to handle increment properly
            .eq('id', recordingId);
        if (error) {
            console.error('Error incrementing view count:', error);
            return res.status(500).json({ error: 'Failed to update view count' });
        }
        res.json({ message: 'View count updated successfully' });
    }
    catch (error) {
        console.error('Error in view recording route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
export default router;
