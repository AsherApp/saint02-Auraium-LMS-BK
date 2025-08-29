import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
export const router = Router();
// Get consolidated student data (one row per student with overall metrics)
router.get('/consolidated', requireAuth, asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('students')
        .select(`
      *,
      enrollments(
        id,
        course_id,
        enrolled_at,
        courses(
          id,
          title,
          description,
          status
        )
      )
    `)
        .order('name', { ascending: true });
    if (error)
        return res.status(500).json({ error: error.message });
    // Transform to consolidated student data with real progress metrics
    const consolidatedStudents = await Promise.all((data || []).map(async (student) => {
        const enrollments = student.enrollments || [];
        // Get real progress data for each course
        const courseProgressData = await Promise.all(enrollments.map(async (enrollment) => {
            try {
                const { data: progress } = await supabaseAdmin.rpc('calculate_student_progress', {
                    p_student_email: student.email,
                    p_course_id: enrollment.course_id
                });
                return progress || {};
            }
            catch (err) {
                console.error(`Error getting progress for ${student.email} in course ${enrollment.course_id}:`, err);
                return {};
            }
        }));
        // Calculate overall metrics from real data
        const totalCourses = enrollments.length;
        const activeCourses = enrollments.filter((e) => e.courses?.status === 'published').length;
        const completedCourses = courseProgressData.filter((progress) => progress.progress_percentage === 100).length;
        // Calculate overall progress (average of all courses)
        const validProgresses = courseProgressData.filter((p) => p.progress_percentage !== undefined);
        const overallProgress = validProgresses.length > 0
            ? Math.round(validProgresses.reduce((sum, p) => sum + p.progress_percentage, 0) / validProgresses.length)
            : 0;
        // Calculate overall grade (average of all courses)
        const validGrades = courseProgressData.filter((p) => p.average_grade !== undefined && p.average_grade > 0);
        const overallGrade = validGrades.length > 0
            ? Math.round(validGrades.reduce((sum, p) => sum + p.average_grade, 0) / validGrades.length)
            : null;
        // Get latest activity from real data
        const { data: latestActivity } = await supabaseAdmin
            .from('student_activities')
            .select('created_at')
            .eq('student_email', student.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        // Get enrollment date (earliest enrollment)
        const enrollmentDates = enrollments.map((e) => e.enrolled_at).filter(Boolean);
        const firstEnrollment = enrollmentDates.length > 0
            ? new Date(Math.min(...enrollmentDates.map((d) => new Date(d).getTime())))
            : null;
        return {
            // Student info
            id: student.id,
            email: student.email,
            name: student.name,
            status: student.status,
            student_code: student.student_code || `STU${student.id?.substr(0, 8).toUpperCase()}`,
            created_at: student.created_at,
            // Overall metrics (real data)
            total_courses: totalCourses,
            active_courses: activeCourses,
            completed_courses: completedCourses,
            overall_progress: overallProgress,
            overall_grade: overallGrade,
            latest_activity: latestActivity?.created_at || null,
            first_enrollment: firstEnrollment?.toISOString(),
            // Course list for quick reference
            courses: enrollments.map((e) => ({
                id: e.course_id,
                title: e.courses?.title,
                status: e.courses?.status,
                enrolled_at: e.enrolled_at
            }))
        };
    }));
    res.json({ items: consolidatedStudents });
}));
// Get detailed course-specific information for a student
router.get('/:email/course/:courseId/details', requireAuth, asyncHandler(async (req, res) => {
    const { email, courseId } = req.params;
    // Get student info
    const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('email', email)
        .single();
    if (studentError)
        return res.status(404).json({ error: 'student_not_found' });
    // Get course info
    const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
    if (courseError)
        return res.status(404).json({ error: 'course_not_found' });
    // Get enrollment info
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_email', email)
        .single();
    if (enrollmentError)
        return res.status(404).json({ error: 'enrollment_not_found' });
    // Get real progress data
    const { data: progressData, error: progressError } = await supabaseAdmin.rpc('calculate_student_progress', {
        p_student_email: email,
        p_course_id: courseId
    });
    if (progressError) {
        console.error('Error getting progress:', progressError);
    }
    const progress = progressData || {
        total_lessons: 0,
        completed_lessons: 0,
        progress_percentage: 0,
        total_assignments: 0,
        completed_assignments: 0,
        average_grade: 0,
        total_time_spent_hours: 0,
        last_activity: null
    };
    // Get real engagement data
    const { data: engagementData, error: engagementError } = await supabaseAdmin.rpc('get_student_engagement', {
        p_student_email: email,
        p_course_id: courseId,
        p_days_back: 30
    });
    if (engagementError) {
        console.error('Error getting engagement:', engagementError);
    }
    const engagement = engagementData || {
        login_frequency: 0,
        avg_session_duration_minutes: 0,
        participation_score: 0,
        forum_posts: 0,
        live_sessions_attended: 0
    };
    // Get real assignments with grades
    const { data: assignmentsWithGrades, error: assignmentsError } = await supabaseAdmin
        .from('assignments')
        .select(`
      *,
      student_grades!inner(
        grade_percentage,
        actual_score,
        max_possible_score,
        feedback,
        graded_at
      )
    `)
        .eq('course_id', courseId)
        .eq('student_grades.student_email', email);
    if (assignmentsError) {
        console.error('Error getting assignments with grades:', assignmentsError);
    }
    // Get all assignments for this course
    const { data: allAssignments, error: allAssignmentsError } = await supabaseAdmin
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });
    if (allAssignmentsError) {
        console.error('Error getting all assignments:', allAssignmentsError);
    }
    // Combine assignments with grades
    const assignmentsWithRealData = (allAssignments || []).map((assignment) => {
        const gradeData = (assignmentsWithGrades || []).find((g) => g.id === assignment.id);
        return {
            id: assignment.id,
            title: assignment.title,
            type: assignment.type,
            due_date: assignment.due_date,
            status: gradeData ? 'submitted' : 'pending',
            submitted_at: gradeData?.student_grades?.[0]?.graded_at || null,
            grade: gradeData?.student_grades?.[0]?.grade_percentage || null,
            feedback: gradeData?.student_grades?.[0]?.feedback || null
        };
    });
    // Get real recent activities
    const { data: activitiesData, error: activitiesError } = await supabaseAdmin
        .from('student_activities')
        .select('*')
        .eq('student_email', email)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(10);
    if (activitiesError) {
        console.error('Error getting activities:', activitiesError);
    }
    const recentActivities = (activitiesData || []).map((activity) => ({
        id: activity.id,
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.created_at,
        metadata: activity.metadata
    }));
    // Calculate grades summary
    const grades = {
        overall_grade: progress.average_grade || 0,
        assignments_completed: assignmentsWithRealData.filter((a) => a.status === 'submitted').length,
        assignments_pending: assignmentsWithRealData.filter((a) => a.status === 'pending').length,
        average_assignment_score: assignmentsWithRealData.length > 0
            ? Math.round(assignmentsWithRealData.reduce((sum, a) => sum + (a.grade || 0), 0) / assignmentsWithRealData.length)
            : 0,
        quizzes_taken: recentActivities.filter((a) => a.type === 'quiz_taken').length,
        average_quiz_score: 0 // Would need separate quiz tracking
    };
    const courseDetails = {
        // Basic info
        student: {
            email: student.email,
            name: student.name,
            student_code: student.student_code
        },
        course: {
            id: course.id,
            title: course.title,
            description: course.description,
            status: course.status
        },
        enrollment: {
            id: enrollment.id,
            enrolled_at: enrollment.enrolled_at
        },
        // Progress tracking (real data)
        progress: {
            overall_percentage: progress.progress_percentage || 0,
            modules_completed: 0, // Would need module tracking
            total_modules: 0,
            lessons_completed: progress.completed_lessons || 0,
            total_lessons: progress.total_lessons || 0,
            time_spent: progress.total_time_spent_hours || 0,
            last_activity: progress.last_activity
        },
        // Grades and performance (real data)
        grades,
        // Attendance and engagement (real data)
        engagement: {
            login_frequency: engagement.login_frequency || 0,
            average_session_duration: engagement.avg_session_duration_minutes || 0,
            participation_score: engagement.participation_score || 0,
            forum_posts: engagement.forum_posts || 0,
            live_sessions_attended: engagement.live_sessions_attended || 0
        },
        // Assignments with real submissions
        assignments: assignmentsWithRealData,
        // Recent activities (real data)
        recent_activities: recentActivities
    };
    res.json(courseDetails);
}));
