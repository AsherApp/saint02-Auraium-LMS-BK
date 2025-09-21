import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { NotificationService } from '../services/notification.service.js';

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

    if (error) throw error;

    res.json(progress);
  } catch (error) {
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

    if (completionError && completionError.code !== 'PGRST116') throw completionError;

    // Get module completions - using student_progress filtered by module_id
    const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .not('module_id', 'is', null)
      .order('created_at', { ascending: true });

    if (moduleError) throw moduleError;

    // Get recent activities
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    // Get detailed progress
    const { data: detailedProgress, error: progressError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (progressError) throw progressError;

    res.json({
      courseCompletion,
      moduleCompletions,
      activities,
      detailedProgress
    });
  } catch (error) {
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

    if (error) throw error;

    // Check for module completion
    await checkModuleCompletion(user.email, courseId, moduleId);
    
    // Check for course completion
    await checkCourseCompletion(user.email, courseId);

    res.json({ message: 'Lesson completed successfully', progress });
  } catch (error) {
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

    if (error) throw error;

    res.json({ message: 'Quiz completed successfully', progress });
  } catch (error) {
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

    if (error) throw error;

    res.json({ message: 'Assignment submission recorded successfully', progress });
  } catch (error) {
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

    if (error) throw error;

    res.json({ message: 'Discussion participation recorded successfully', progress });
  } catch (error) {
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

    if (error) throw error;

    res.json({ message: 'Poll response recorded successfully', progress });
  } catch (error) {
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

    if (error) throw error;

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
  } catch (error) {
    console.error('Error recording poll participation:', error);
    res.status(500).json({ error: 'Failed to record poll participation' });
  }
});

// Record course completion
router.post('/course-completed', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { courseId, courseTitle, completionPercentage = 100, timeSpentSeconds = 0 } = req.body;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course is already completed
    const { data: existingCompletion, error: checkError } = await supabaseAdmin
      .from('student_course_progress')
      .select('*')
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingCompletion?.completion_percentage === 100) {
      return res.status(200).json({ 
        message: 'Course already completed', 
        completion: existingCompletion 
      });
    }

    // Update course completion to 100%
    const { data: completion, error: updateError } = await supabaseAdmin
      .from('student_course_progress')
      .update({
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create course completion notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_email: user.email,
        type: 'course_completion',
        title: 'Course Completed! 🎉',
        message: `Congratulations! You have successfully completed "${courseTitle}". Your certificate is now available.`,
        course_id: courseId,
        read: false,
        metadata: {
          course_title: courseTitle,
          completion_percentage: 100,
          completed_at: new Date().toISOString()
        }
      });

    // Record activity
    await supabaseAdmin
      .from('student_activities')
      .insert({
        student_email: user.email,
        course_id: courseId,
        activity_type: 'course_completion',
        description: `Successfully completed course: "${courseTitle}"`,
        metadata: {
          course_title: courseTitle,
          completion_percentage: 100,
          time_spent_seconds: timeSpentSeconds
        }
      });

    res.json({ 
      message: 'Course completed successfully! Your certificate is now available.', 
      completion 
    });
  } catch (error) {
    console.error('Error recording course completion:', error);
    res.status(500).json({ error: 'Failed to record course completion' });
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

    // Build query to get teacher's courses
    let courseQuery = supabaseAdmin
      .from('courses')
      .select('id, title')
      .eq('teacher_email', user.email);

    if (courseId) {
      courseQuery = courseQuery.eq('id', courseId);
    }

    const { data: courses, error: courseError } = await courseQuery;
    if (courseError) throw courseError;

    if (!courses || courses.length === 0) {
      return res.json([]);
    }

    const courseIds = courses.map(c => c.id);
    const progressData = [];

    // For each course, get enrolled students and their progress
    for (const course of courses) {
      try {
        // Get enrollments for this course
        const { data: enrollments, error: enrollmentError } = await supabaseAdmin
          .from('enrollments')
          .select(`
            student_email,
            created_at as enrolled_at,
            students!inner(name, email)
          `)
          .eq('course_id', course.id);

        if (enrollmentError) {
          console.error(`Error fetching enrollments for course ${course.id}:`, enrollmentError);
          continue;
        }

        // Get course structure to calculate totals
        const { data: courseStructure, error: structureError } = await supabaseAdmin
          .from('courses')
          .select(`
            id,
            modules!inner(
              id,
              lessons!inner(id),
              quizzes!inner(id)
            ),
            assignments!inner(id)
          `)
          .eq('id', course.id)
          .single();

        if (structureError) {
          console.error(`Error fetching course structure for ${course.id}:`, structureError);
          continue;
        }

        // Calculate totals from course structure
        const totalLessons = courseStructure.modules?.reduce((acc: number, module: any) => 
          acc + (module.lessons?.length || 0), 0) || 0;
        const totalAssignments = courseStructure.assignments?.length || 0;
        const totalQuizzes = courseStructure.modules?.reduce((acc: number, module: any) => 
          acc + (module.quizzes?.length || 0), 0) || 0;

        // For each enrolled student, get their progress
        for (const enrollment of enrollments || []) {
          try {
            // Get student's progress for this course
            const { data: courseProgress, error: progressError } = await supabaseAdmin
              .from('student_course_progress')
              .select('*')
              .eq('student_email', (enrollment as any).student_email)
              .eq('course_id', course.id)
              .single();

            // Get student's activities for this course
            const { data: activities, error: activityError } = await supabaseAdmin
              .from('student_activities')
              .select('*')
              .eq('student_email', (enrollment as any).student_email)
              .eq('course_id', course.id)
              .order('created_at', { ascending: false });

            // Calculate completion percentage
            let completionPercentage = 0;
            if (totalLessons > 0) {
              const completedLessons = courseProgress?.completed_lessons || 0;
              completionPercentage = Math.round((completedLessons / totalLessons) * 100);
            }

            // Get last activity
            const lastActivity = activities && activities.length > 0 ? activities[0].created_at : null;

            progressData.push({
              course_id: course.id,
              course_title: course.title,
              teacher_email: user.email,
              student_email: (enrollment as any).student_email,
              student_name: (enrollment as any).students?.name,
              course_completion_percentage: completionPercentage,
              total_lessons: totalLessons,
              completed_lessons: courseProgress?.completed_lessons || 0,
              total_assignments: totalAssignments,
              completed_assignments: courseProgress?.completed_assignments || 0,
              total_quizzes: totalQuizzes,
              passed_quizzes: courseProgress?.passed_quizzes || 0,
              average_grade: courseProgress?.average_grade || 0,
              last_activity_at: lastActivity,
              started_at: (enrollment as any).enrolled_at,
              completed_at: courseProgress?.completed_at || null,
              total_activities: activities?.length || 0,
              last_activity: lastActivity
            });

          } catch (studentError) {
            console.error(`Error processing student ${(enrollment as any).student_email} for course ${course.id}:`, studentError);
          }
        }

      } catch (courseError) {
        console.error(`Error processing course ${course.id}:`, courseError);
      }
    }

    // Sort by last activity (most recent first)
    progressData.sort((a, b) => {
      if (!a.last_activity_at && !b.last_activity_at) return 0;
      if (!a.last_activity_at) return 1;
      if (!b.last_activity_at) return -1;
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    });

    console.log('Teacher dashboard response:', {
      teacherEmail: user.email,
      totalStudents: progressData.length,
      sampleData: progressData.slice(0, 2)
    });

    res.json(progressData);
  } catch (error) {
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

    if (completionError && completionError.code !== 'PGRST116') throw completionError;

    // Get module completions - using student_progress filtered by module_id
    const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .not('module_id', 'is', null)
      .order('created_at', { ascending: true });

    if (moduleError) throw moduleError;

    // Get all activities
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (activityError) throw activityError;

    // Get detailed progress
    const { data: detailedProgress, error: progressError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (progressError) throw progressError;

    // Get student info
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('name, email, avatar_url')
      .eq('email', studentEmail)
      .single();

    if (studentError) throw studentError;

    res.json({
      student,
      courseCompletion,
      moduleCompletions,
      activities,
      detailedProgress
    });
  } catch (error) {
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

    if (enrollmentError) throw enrollmentError;

    // Get completion statistics
    const { data: completionStats, error: completionError } = await supabaseAdmin
      .from('student_course_progress')
      .select('completion_percentage, completed_at')
      .eq('course_id', courseId);

    if (completionError) throw completionError;

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

    if (activityError) throw activityError;

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
  } catch (error) {
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
      query = query.limit(parseInt(limit as string));
    }

    const { data: activities, error } = await query;

    if (error) throw error;

    res.json(activities);
  } catch (error) {
    console.error('Error fetching student activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Helper function to check and update course completion
async function checkAndUpdateCourseCompletion(studentEmail: string, courseId: string) {
  try {
    // Get course completion data
    const { data: courseCompletion, error: completionError } = await supabaseAdmin
      .from('student_course_progress')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .single();

    if (completionError) throw completionError;

    // If course is already completed, don't check again
    if (courseCompletion?.completion_percentage === 100) return;

    // Get total lessons, assignments, and quizzes for the course
    const { data: courseModules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    if (modulesError) throw modulesError;

    const moduleIds = courseModules?.map(m => m.id) || [];

    // Get total lessons
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .in('module_id', moduleIds);

    if (lessonsError) throw lessonsError;

    const totalLessons = lessons?.length || 0;

    // Get completed lessons
    const { data: completedLessons, error: completedError } = await supabaseAdmin
      .from('student_progress')
      .select('lesson_id')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .eq('type', 'lesson_completed')
      .eq('status', 'completed');

    if (completedError) throw completedError;

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
  } catch (error) {
    console.error('Error checking course completion:', error);
  }
}

// ===== TEACHER ACCESS TO STUDENT PROGRESS =====

// Get student progress for a specific course (teacher access by student code)
router.get('/:studentCode/course/:courseId/progress', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { studentCode, courseId } = req.params;

    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }

    // Get student email by student code
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('student_code', studentCode)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher owns the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_email', user.email)
      .single();

    if (courseError || !course) {
      return res.status(403).json({ error: 'Access denied. Course not found or not owned by teacher.' });
    }

    // Get course completion data
    const { data: courseCompletion, error: completionError } = await supabaseAdmin
      .from('student_course_progress')
      .select('*')
      .eq('student_email', student.email)
      .eq('course_id', courseId)
      .single();

      // Record course completion
router.post('/course-completed', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { courseId, courseTitle, completionPercentage = 100, timeSpentSeconds = 0 } = req.body;

    if (!user || user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if course is already completed
    const { data: existingCompletion, error: checkError } = await supabaseAdmin
      .from('student_course_progress')
      .select('*')
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingCompletion?.completion_percentage === 100) {
      return res.status(200).json({ 
        message: 'Course already completed', 
        completion: existingCompletion 
      });
    }

    // Update course completion to 100%
    const { data: completion, error: updateError } = await supabaseAdmin
      .from('student_course_progress')
      .update({
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('student_email', user.email)
      .eq('course_id', courseId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create course completion notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_email: user.email,
        type: 'course_completion',
        title: 'Course Completed! 🎉',
        message: `Congratulations! You have successfully completed "${courseTitle}". Your certificate is now available.`,
        course_id: courseId,
        read: false,
        metadata: {
          course_title: courseTitle,
          completion_percentage: 100,
          completed_at: new Date().toISOString()
        }
      });

    // Record activity
    await supabaseAdmin
      .from('student_activities')
      .insert({
        student_email: user.email,
        course_id: courseId,
        activity_type: 'course_completion',
        description: `Successfully completed course: "${courseTitle}"`,
        metadata: {
          course_title: courseTitle,
          completion_percentage: 100,
          time_spent_seconds: timeSpentSeconds
        }
      });

    res.json({ 
      message: 'Course completed successfully! Your certificate is now available.', 
      completion 
    });
  } catch (error) {
    console.error('Error recording course completion:', error);
    res.status(500).json({ error: 'Failed to record course completion' });
  }
});

    if (completionError && completionError.code !== 'PGRST116') throw completionError;

    // Get module completions
    const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', student.email)
      .eq('course_id', courseId)
      .not('module_id', 'is', null)
      .order('created_at', { ascending: true });

    if (moduleError) throw moduleError;

    // Get recent activities
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_email', student.email)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    // Get detailed progress
    const { data: detailedProgress, error: progressError } = await supabaseAdmin
      .from('student_progress')
      .select('*')
      .eq('student_email', student.email)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (progressError) throw progressError;

    res.json({
      courseCompletion,
      moduleCompletions,
      activities,
      detailedProgress
    });
  } catch (error) {
    console.error('Error fetching student course progress:', error);
    res.status(500).json({ error: 'Failed to fetch student course progress' });
  }
});

// Get student engagement metrics (teacher access by student code)
router.get('/:studentCode/engagement', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { studentCode } = req.params;
    const { days = 30 } = req.query;

    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teachers only.' });
    }

    // Get student email by student code
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('student_code', studentCode)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get poll participation
    const { data: pollParticipation, error: pollError } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_email', student.email)
      .eq('activity_type', 'poll_participation')
      .gte('created_at', daysAgo.toISOString());

    if (pollError) throw pollError;

    // Get discussion participation
    const { data: discussionParticipation, error: discussionError } = await supabaseAdmin
      .from('student_activities')
      .select('*')
      .eq('student_email', student.email)
      .eq('activity_type', 'discussion_participation')
      .gte('created_at', daysAgo.toISOString());

    if (discussionError) throw discussionError;

    // Get study time
    const { data: studyTime, error: studyError } = await supabaseAdmin
      .from('student_progress')
      .select('time_spent_seconds')
      .eq('student_email', student.email)
      .gte('created_at', daysAgo.toISOString())
      .not('time_spent_seconds', 'is', null);

    if (studyError) throw studyError;

    // Calculate total study time in minutes
    const totalStudyTimeMinutes = studyTime?.reduce((total, record) => total + (record.time_spent_seconds || 0), 0) / 60 || 0;

    // Get course enrollments for this teacher's courses
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        course_id,
        courses!enrollments_course_id_fkey(title)
      `)
      .eq('student_email', student.email)
      .eq('courses.teacher_email', user.email);

    if (enrollmentError) throw enrollmentError;

    res.json({
      pollParticipation: pollParticipation?.length || 0,
      discussionParticipation: discussionParticipation?.length || 0,
      totalStudyTimeMinutes: Math.round(totalStudyTimeMinutes),
      enrolledCourses: enrollments?.length || 0,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching student engagement:', error);
    res.status(500).json({ error: 'Failed to fetch student engagement' });
  }
});

// Helper function to check module completion
async function checkModuleCompletion(studentEmail: string, courseId: string, moduleId: string) {
  try {
    if (!moduleId) return;

    // Get all lessons in the module
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('module_id', moduleId);

    if (lessonsError || !lessons || lessons.length === 0) return;

    // Get completed lessons for this module
    const { data: completedLessons, error: completedError } = await supabaseAdmin
      .from('student_progress')
      .select('lesson_id')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .eq('type', 'lesson_completed')
      .eq('status', 'completed');

    if (completedError) return;

    // Check if all lessons are completed
    const completedLessonIds = completedLessons?.map(l => l.lesson_id) || [];
    const allLessonsCompleted = lessons.every(lesson => completedLessonIds.includes(lesson.id));

    if (allLessonsCompleted) {
      // Check if module completion is already recorded
      const { data: existingModuleCompletion } = await supabaseAdmin
        .from('student_progress')
        .select('id')
        .eq('student_email', studentEmail)
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .eq('type', 'module_completed')
        .single();

      if (!existingModuleCompletion) {
        // Record module completion
        const { data: moduleData } = await supabaseAdmin
          .from('modules')
          .select('title')
          .eq('id', moduleId)
          .single();

        const { data: courseData } = await supabaseAdmin
          .from('courses')
          .select('title, teacher_email')
          .eq('id', courseId)
          .single();

        await supabaseAdmin
          .from('student_progress')
          .insert({
            student_email: studentEmail,
            course_id: courseId,
            module_id: moduleId,
            type: 'module_completed',
            status: 'completed',
            score: 100,
            metadata: {
              module_title: moduleData?.title,
              completed_at: new Date().toISOString()
            }
          });

        // Send module completion notification to student
        await NotificationService.sendNotification({
          user_email: studentEmail,
          user_type: 'student',
          type: 'module_completion',
          title: 'Module Completed!',
          message: `You have successfully completed the module "${moduleData?.title}" in the course "${courseData?.title}".`,
          data: {
            module_title: moduleData?.title,
            course_title: courseData?.title,
            course_id: courseId,
            module_id: moduleId,
            completion_date: new Date().toISOString()
          }
        });

        // Send notification to teacher
        if (courseData?.teacher_email) {
          const { data: studentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('email', studentEmail)
            .eq('user_type', 'student')
            .single();

          await NotificationService.sendNotification({
            user_email: courseData.teacher_email,
            user_type: 'teacher',
            type: 'module_completion',
            title: 'Student Completed Module',
            message: `${studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail} has completed the module "${moduleData?.title}" in your course "${courseData?.title}".`,
            data: {
              student_name: studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail,
              student_email: studentEmail,
              module_title: moduleData?.title,
              course_title: courseData?.title,
              course_id: courseId,
              module_id: moduleId,
              completion_date: new Date().toISOString()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking module completion:', error);
  }
}

// Helper function to check course completion
async function checkCourseCompletion(studentEmail: string, courseId: string) {
  try {
    // Get all modules in the course
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    if (modulesError || !modules || modules.length === 0) return;

    // Get completed modules for this course
    const { data: completedModules, error: completedError } = await supabaseAdmin
      .from('student_progress')
      .select('module_id')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .eq('type', 'module_completed')
      .eq('status', 'completed');

    if (completedError) return;

    // Check if all modules are completed
    const completedModuleIds = completedModules?.map(m => m.module_id) || [];
    const allModulesCompleted = modules.every(module => completedModuleIds.includes(module.id));

    if (allModulesCompleted) {
      // Check if course completion is already recorded
      const { data: existingCourseCompletion } = await supabaseAdmin
        .from('student_progress')
        .select('id')
        .eq('student_email', studentEmail)
        .eq('course_id', courseId)
        .eq('type', 'course_completed')
        .single();

      if (!existingCourseCompletion) {
        // Record course completion
        const { data: courseData } = await supabaseAdmin
          .from('courses')
          .select('title, teacher_email')
          .eq('id', courseId)
          .single();

        await supabaseAdmin
          .from('student_progress')
          .insert({
            student_email: studentEmail,
            course_id: courseId,
            type: 'course_completed',
            status: 'completed',
            score: 100,
            metadata: {
              course_title: courseData?.title,
              completed_at: new Date().toISOString()
            }
          });

        // Send course completion notification to student
        await NotificationService.sendNotification({
          user_email: studentEmail,
          user_type: 'student',
          type: 'course_completion',
          title: 'Congratulations! Course Completed',
          message: `You have successfully completed the course "${courseData?.title}"! Your certificate is available for download.`,
          data: {
            course_title: courseData?.title,
            course_id: courseId,
            completion_date: new Date().toISOString()
          }
        });

        // Send notification to teacher
        if (courseData?.teacher_email) {
          const { data: studentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('email', studentEmail)
            .eq('user_type', 'student')
            .single();

          await NotificationService.sendNotification({
            user_email: courseData.teacher_email,
            user_type: 'teacher',
            type: 'course_completion',
            title: 'Student Completed Course',
            message: `${studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail} has successfully completed your course "${courseData?.title}".`,
            data: {
              student_name: studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail,
              student_email: studentEmail,
              course_title: courseData?.title,
              course_id: courseId,
              completion_date: new Date().toISOString()
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking course completion:', error);
  }
}

export default router;
