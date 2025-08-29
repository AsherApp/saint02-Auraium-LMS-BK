import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
const router = express.Router();
// Get student's own progress for all courses
router.get('/my-progress', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress_dashboard')
            .select('*')
            .eq('student_email', user.email)
            .order('completed_at', { ascending: false });
        if (error)
            throw error;
        res.json(progress);
    }
    catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// Get student's progress for a specific course
router.get('/course/:courseId', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId } = req.params;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        // Get course completion data
        const { data: courseCompletion, error: completionError } = await supabaseAdmin
            .from('student_course_progress')
            .select('*')
            .eq('student_email', user.email)
            .eq('course_id', courseId)
            .single();
        if (completionError && completionError.code !== 'PGRST116')
            throw completionError;
        // Get module completions - using student_progress filtered by module_id
        const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
            .from('student_progress')
            .select('*')
            .eq('student_email', user.email)
            .eq('course_id', courseId)
            .not('module_id', 'is', null)
            .order('created_at', { ascending: true });
        if (moduleError)
            throw moduleError;
        // Get recent activities
        const { data: activities, error: activityError } = await supabaseAdmin
            .from('student_activities')
            .select('*')
            .eq('student_email', user.email)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false })
            .limit(10);
        if (activityError)
            throw activityError;
        // Get detailed progress
        const { data: detailedProgress, error: progressError } = await supabaseAdmin
            .from('student_progress')
            .select('*')
            .eq('student_email', user.email)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });
        if (progressError)
            throw progressError;
        res.json({
            courseCompletion,
            moduleCompletions,
            activities,
            detailedProgress
        });
    }
    catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ error: 'Failed to fetch course progress' });
    }
});
// Record lesson completion
router.post('/lesson-completed', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, lessonId, lessonTitle, timeSpentSeconds = 0 } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !lessonId) {
            return res.status(400).json({ error: 'Course ID and Lesson ID are required' });
        }
        // Check if already completed
        const { data: existing } = await supabaseAdmin
            .from('student_progress')
            .select('id')
            .eq('student_email', user.email)
            .eq('course_id', courseId)
            .eq('lesson_id', lessonId)
            .eq('type', 'lesson_completed')
            .single();
        if (existing) {
            return res.status(200).json({ message: 'Lesson already completed', progress: existing });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            lesson_id: lessonId,
            type: 'lesson_completed',
            status: 'completed',
            score: 100,
            time_spent_seconds: timeSpentSeconds,
            lesson_title: lessonTitle,
            metadata: {
                lesson_title: lessonTitle,
                completed_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Lesson completed successfully', progress });
    }
    catch (error) {
        console.error('Error recording lesson completion:', error);
        res.status(500).json({ error: 'Failed to record lesson completion' });
    }
});
// Record quiz completion
router.post('/quiz-completed', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, quizId, score, passed, timeSpentSeconds = 0 } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !quizId) {
            return res.status(400).json({ error: 'Course ID and Quiz ID are required' });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            type: 'quiz_passed',
            status: passed ? 'completed' : 'failed',
            score: score || 0,
            time_spent_seconds: timeSpentSeconds,
            metadata: {
                quiz_id: quizId,
                passed: passed,
                completed_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Quiz completed successfully', progress });
    }
    catch (error) {
        console.error('Error recording quiz completion:', error);
        res.status(500).json({ error: 'Failed to record quiz completion' });
    }
});
// Record assignment submission
router.post('/assignment-submitted', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, assignmentId, timeSpentMinutes = 0 } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !assignmentId) {
            return res.status(400).json({ error: 'Course ID and Assignment ID are required' });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            type: 'assignment_submitted',
            status: 'submitted',
            score: 0, // Will be updated when graded
            time_spent_seconds: timeSpentMinutes * 60,
            metadata: {
                assignment_id: assignmentId,
                submitted_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Assignment submission recorded successfully', progress });
    }
    catch (error) {
        console.error('Error recording assignment submission:', error);
        res.status(500).json({ error: 'Failed to record assignment submission' });
    }
});
// Record discussion participation
router.post('/discussion-participated', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, discussionId, postId } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !discussionId) {
            return res.status(400).json({ error: 'Course ID and Discussion ID are required' });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            type: 'discussion_participated',
            status: 'completed',
            score: 10, // Participation points
            metadata: {
                discussion_id: discussionId,
                post_id: postId,
                participated_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Discussion participation recorded successfully', progress });
    }
    catch (error) {
        console.error('Error recording discussion participation:', error);
        res.status(500).json({ error: 'Failed to record discussion participation' });
    }
});
// Record poll response
router.post('/poll-responded', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, pollId, responseId } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !pollId) {
            return res.status(400).json({ error: 'Course ID and Poll ID are required' });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            type: 'poll_responded',
            status: 'completed',
            score: 5, // Participation points
            metadata: {
                poll_id: pollId,
                response_id: responseId,
                responded_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json({ message: 'Poll response recorded successfully', progress });
    }
    catch (error) {
        console.error('Error recording poll response:', error);
        res.status(500).json({ error: 'Failed to record poll response' });
    }
});
// Record poll participation
router.post('/poll-participation', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, moduleId, lessonId, lessonTitle, pollQuestion, selectedOption } = req.body;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        if (!courseId || !lessonId) {
            return res.status(400).json({ error: 'Course ID and Lesson ID are required' });
        }
        // Record progress
        const { data: progress, error } = await supabaseAdmin
            .from('student_progress')
            .insert({
            student_email: user.email,
            course_id: courseId,
            module_id: moduleId,
            lesson_id: lessonId,
            lesson_title: lessonTitle,
            type: 'poll_responded',
            status: 'completed',
            score: 5, // Participation points
            metadata: {
                poll_question: pollQuestion,
                selected_option: selectedOption,
                participated_at: new Date().toISOString()
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        // Record activity
        await supabaseAdmin
            .from('student_activities')
            .insert({
            student_email: user.email,
            course_id: courseId,
            activity_type: 'poll_participation',
            description: `Responded to poll: "${pollQuestion}"`,
            metadata: {
                lesson_id: lessonId,
                lesson_title: lessonTitle,
                selected_option: selectedOption,
                poll_question: pollQuestion
            }
        });
        // Check for course completion
        await checkAndUpdateCourseCompletion(user.email, courseId);
        res.json({ message: 'Poll participation recorded successfully', progress });
    }
    catch (error) {
        console.error('Error recording poll participation:', error);
        res.status(500).json({ error: 'Failed to record poll participation' });
    }
});
// Get teacher's student progress dashboard
router.get('/teacher/dashboard', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId } = req.query;
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied. Teachers only.' });
        }
        let query = supabaseAdmin
            .from('teacher_student_progress')
            .select('*')
            .eq('teacher_email', user.email);
        if (courseId) {
            query = query.eq('course_id', courseId);
        }
        const { data: progress, error } = await query.order('last_activity_at', { ascending: false });
        if (error)
            throw error;
        res.json(progress);
    }
    catch (error) {
        console.error('Error fetching teacher dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch teacher dashboard' });
    }
});
// Get detailed student progress for teacher
router.get('/teacher/student/:studentEmail/course/:courseId', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { studentEmail, courseId } = req.params;
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied. Teachers only.' });
        }
        // Verify teacher owns the course
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('teacher_email', user.email)
            .single();
        if (courseError || !course) {
            return res.status(404).json({ error: 'Course not found or access denied' });
        }
        // Get course completion
        const { data: courseCompletion, error: completionError } = await supabaseAdmin
            .from('student_course_progress')
            .select('*')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .single();
        if (completionError && completionError.code !== 'PGRST116')
            throw completionError;
        // Get module completions - using student_progress filtered by module_id
        const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
            .from('student_progress')
            .select('*')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .not('module_id', 'is', null)
            .order('created_at', { ascending: true });
        if (moduleError)
            throw moduleError;
        // Get all activities
        const { data: activities, error: activityError } = await supabaseAdmin
            .from('student_activities')
            .select('*')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });
        if (activityError)
            throw activityError;
        // Get detailed progress
        const { data: detailedProgress, error: progressError } = await supabaseAdmin
            .from('student_progress')
            .select('*')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false });
        if (progressError)
            throw progressError;
        // Get student info
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('name, email, avatar_url')
            .eq('email', studentEmail)
            .single();
        if (studentError)
            throw studentError;
        res.json({
            student,
            courseCompletion,
            moduleCompletions,
            activities,
            detailedProgress
        });
    }
    catch (error) {
        console.error('Error fetching student progress for teacher:', error);
        res.status(500).json({ error: 'Failed to fetch student progress' });
    }
});
// Get course analytics for teacher
router.get('/teacher/course/:courseId/analytics', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId } = req.params;
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied. Teachers only.' });
        }
        // Verify teacher owns the course
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id, title')
            .eq('id', courseId)
            .eq('teacher_email', user.email)
            .single();
        if (courseError || !course) {
            return res.status(404).json({ error: 'Course not found or access denied' });
        }
        // Get enrollment count
        const { count: enrollmentCount, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);
        if (enrollmentError)
            throw enrollmentError;
        // Get completion statistics
        const { data: completionStats, error: completionError } = await supabaseAdmin
            .from('student_course_progress')
            .select('completion_percentage, completed_at')
            .eq('course_id', courseId);
        if (completionError)
            throw completionError;
        // Calculate analytics
        const totalStudents = enrollmentCount || 0;
        const completedStudents = completionStats?.filter(c => c.completion_percentage === 100).length || 0;
        const inProgressStudents = completionStats?.filter(c => c.completion_percentage > 0 && c.completion_percentage < 100).length || 0;
        const notStartedStudents = totalStudents - completedStudents - inProgressStudents;
        const averageCompletion = completionStats?.length > 0
            ? completionStats.reduce((sum, c) => sum + c.completion_percentage, 0) / completionStats.length
            : 0;
        // Get recent activities
        const { data: recentActivities, error: activityError } = await supabaseAdmin
            .from('student_activities')
            .select('*')
            .eq('course_id', courseId)
            .order('created_at', { ascending: false })
            .limit(20);
        if (activityError)
            throw activityError;
        res.json({
            course,
            analytics: {
                totalStudents,
                completedStudents,
                inProgressStudents,
                notStartedStudents,
                averageCompletion: Math.round(averageCompletion),
                completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0
            },
            recentActivities
        });
    }
    catch (error) {
        console.error('Error fetching course analytics:', error);
        res.status(500).json({ error: 'Failed to fetch course analytics' });
    }
});
// Get student activities
router.get('/activities', requireAuth, async (req, res) => {
    try {
        const { user } = req;
        const { courseId, limit = 50 } = req.query;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ error: 'Access denied. Students only.' });
        }
        let query = supabaseAdmin
            .from('student_activities')
            .select('*')
            .eq('student_email', user.email)
            .order('created_at', { ascending: false });
        if (courseId) {
            query = query.eq('course_id', courseId);
        }
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        const { data: activities, error } = await query;
        if (error)
            throw error;
        res.json(activities);
    }
    catch (error) {
        console.error('Error fetching student activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});
// Helper function to check and update course completion
async function checkAndUpdateCourseCompletion(studentEmail, courseId) {
    try {
        // Get course completion data
        const { data: courseCompletion, error: completionError } = await supabaseAdmin
            .from('student_course_progress')
            .select('*')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .single();
        if (completionError)
            throw completionError;
        // If course is already completed, don't check again
        if (courseCompletion?.completion_percentage === 100)
            return;
        // Get total lessons, assignments, and quizzes for the course
        const { data: courseModules, error: modulesError } = await supabaseAdmin
            .from('modules')
            .select('id')
            .eq('course_id', courseId);
        if (modulesError)
            throw modulesError;
        const moduleIds = courseModules?.map(m => m.id) || [];
        // Get total lessons
        const { data: lessons, error: lessonsError } = await supabaseAdmin
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds);
        if (lessonsError)
            throw lessonsError;
        const totalLessons = lessons?.length || 0;
        // Get completed lessons
        const { data: completedLessons, error: completedError } = await supabaseAdmin
            .from('student_progress')
            .select('lesson_id')
            .eq('student_email', studentEmail)
            .eq('course_id', courseId)
            .eq('type', 'lesson_completed')
            .eq('status', 'completed');
        if (completedError)
            throw completedError;
        const completedLessonsCount = completedLessons?.length || 0;
        // Calculate completion percentage
        const completionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
        // Update course completion
        if (completionPercentage === 100 && courseCompletion?.completion_percentage !== 100) {
            await supabaseAdmin
                .from('student_course_progress')
                .update({
                completion_percentage: 100,
                completed_at: new Date().toISOString()
            })
                .eq('student_email', studentEmail)
                .eq('course_id', courseId);
            // Create completion notification
            await supabaseAdmin
                .from('notifications')
                .insert({
                user_email: studentEmail,
                type: 'course_completion',
                title: 'Course Completed! 🎉',
                message: 'Congratulations! You have successfully completed the course.',
                course_id: courseId,
                read: false
            });
        }
    }
    catch (error) {
        console.error('Error checking course completion:', error);
    }
}
export default router;
