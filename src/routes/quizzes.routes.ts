import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'
import { NotificationService } from '../services/notification.service.js'

export const router = Router()

// Get all quizzes for a course (teacher view)
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { courseId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own courses
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('teacher_email', userEmail)
      .single()

    if (courseError || !course) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  // Get quizzes
  const { data: quizzes, error: quizzesError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (quizzesError) {
    return res.status(500).json({ error: quizzesError.message })
  }

  res.json({ items: quizzes || [] })
}))

// Get module exam for a specific module
router.get('/module/:moduleId/exam', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { moduleId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get module to verify access
  const { data: module, error: moduleError } = await supabaseAdmin
    .from('modules')
    .select(`
      *,
      courses!inner(teacher_email)
    `)
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return res.status(404).json({ error: 'Module not found' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own modules
    if (module.courses.teacher_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', module.course_id)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  // Get module exam
  const { data: exam, error: examError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_module_exam', true)
    .eq('is_published', true)
    .single()

  if (examError) {
    if (examError.code === 'PGRST116') {
      return res.json({ exam: null })
    }
    return res.status(500).json({ error: examError.message })
  }

  res.json({ exam })
}))

// Create a new quiz (teacher only)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const {
    course_id,
    module_id,
    lesson_id,
    title,
    description,
    questions,
    time_limit_minutes,
    passing_score,
    max_attempts,
    is_module_exam = false
  } = req.body

  if (!course_id || !title || !questions) {
    return res.status(400).json({ error: 'course_id, title, and questions are required' })
  }

  // For module exams, module_id is required
  if (is_module_exam && !module_id) {
    return res.status(400).json({ error: 'module_id is required for module exams' })
  }

  // Check if teacher owns the course
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', course_id)
    .eq('teacher_email', userEmail)
    .single()

  if (courseError || !course) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Create quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .insert({
      course_id,
      module_id,
      lesson_id,
      title,
      description,
      questions,
      time_limit_minutes,
      passing_score: passing_score || 70,
      max_attempts: max_attempts || 1,
      is_module_exam,
      created_by: userEmail
    })
    .select()
    .single()

  if (quizError) {
    return res.status(500).json({ error: quizError.message })
  }

  res.status(201).json(quiz)
}))

// Get a specific quiz
router.get('/:quizId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { quizId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return res.status(404).json({ error: 'Quiz not found' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own quizzes
    if (quiz.created_by !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', quiz.course_id)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  res.json(quiz)
}))

// Start a quiz attempt
router.post('/:quizId/start', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { quizId } = req.params
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return res.status(404).json({ error: 'Quiz not found' })
  }

  // Check if student is enrolled in the course
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('course_id', quiz.course_id)
    .eq('student_email', userEmail)
    .single()

  if (enrollmentError || !enrollment) {
    return res.status(403).json({ error: 'Not enrolled in this course' })
  }

  // Check if student has exceeded max attempts
  const { data: existingAttempts, error: attemptsError } = await supabaseAdmin
    .from('quiz_attempts')
    .select('attempt_number')
    .eq('quiz_id', quizId)
    .eq('student_email', userEmail)
    .order('attempt_number', { ascending: false })
    .limit(1)

  if (attemptsError) {
    return res.status(500).json({ error: attemptsError.message })
  }

  const currentAttempts = existingAttempts?.length || 0
  if (currentAttempts >= quiz.max_attempts) {
    return res.status(400).json({ error: 'Maximum attempts exceeded' })
  }

  // Create new attempt
  const attemptNumber = currentAttempts + 1
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      student_email: userEmail,
      attempt_number: attemptNumber,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (attemptError) {
    return res.status(500).json({ error: attemptError.message })
  }

  // Log activity
  await supabaseAdmin
    .from('student_activities')
    .insert({
      student_email: userEmail,
      course_id: quiz.course_id,
      activity_type: 'quiz_started',
      description: `Started quiz: ${quiz.title}`,
      metadata: { quiz_id: quizId, attempt_number: attemptNumber }
    })

  res.json(attempt)
}))

// Submit quiz answers
router.post('/:quizId/submit', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { quizId } = req.params
  const { answers, time_taken_seconds } = req.body
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return res.status(404).json({ error: 'Quiz not found' })
  }

  // Get current attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_email', userEmail)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (attemptError || !attempt) {
    return res.status(400).json({ error: 'No active quiz attempt found' })
  }

  // Calculate score
  let correctAnswers = 0
  let totalQuestions = 0

  quiz.questions.forEach((question: any, index: number) => {
    totalQuestions++
    const studentAnswer = answers[question.id]
    
    if (question.type === 'multiple_choice') {
      if (studentAnswer === question.correct_answer) {
        correctAnswers++
      }
    } else if (question.type === 'true_false') {
      if (studentAnswer === question.correct_answer) {
        correctAnswers++
      }
    }
  })

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const passed = score >= quiz.passing_score

  // Update attempt
  const { data: updatedAttempt, error: updateError } = await supabaseAdmin
    .from('quiz_attempts')
    .update({
      answers,
      score,
      passed,
      time_taken_seconds,
      completed_at: new Date().toISOString()
    })
    .eq('id', attempt.id)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  // Record progress if passed
  if (passed) {
    await supabaseAdmin
      .from('student_progress')
      .upsert({
        student_email: userEmail,
        course_id: quiz.course_id,
        module_id: quiz.module_id,
        lesson_id: quiz.lesson_id,
        progress_type: 'quiz_passed',
        status: 'completed',
        score,
        time_spent_seconds: time_taken_seconds,
        metadata: { quiz_id: quizId, attempt_number: attempt.attempt_number, is_module_exam: quiz.is_module_exam }
      }, {
        onConflict: 'student_email,course_id,lesson_id,progress_type'
      })

    // If this is a module exam, check for module completion
    if (quiz.is_module_exam && quiz.module_id) {
      await checkModuleCompletion(userEmail, quiz.course_id, quiz.module_id)
    }
  }

  // Log activity
  await supabaseAdmin
    .from('student_activities')
    .insert({
      student_email: userEmail,
      course_id: quiz.course_id,
      activity_type: 'quiz_completed',
      description: `Completed quiz: ${quiz.title} (Score: ${score}%)`,
      metadata: { quiz_id: quizId, score, passed, attempt_number: attempt.attempt_number }
    })

  res.json(updatedAttempt)
}))

// Get quiz results for teacher
router.get('/:quizId/results', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { quizId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return res.status(404).json({ error: 'Quiz not found' })
  }

  // Check if teacher owns the quiz
  if (quiz.created_by !== userEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get all attempts for this quiz
  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from('quiz_attempts')
    .select(`
      *,
      students(name, email)
    `)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false })

  if (attemptsError) {
    return res.status(500).json({ error: attemptsError.message })
  }

  // Calculate statistics
  const totalAttempts = attempts?.length || 0
  const passedAttempts = attempts?.filter(a => a.passed).length || 0
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts?.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts)
    : 0

  const result = {
    quiz,
    total_attempts: totalAttempts,
    passed_attempts: passedAttempts,
    pass_rate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
    average_score: averageScore,
    attempts: attempts || []
  }

  res.json(result)
}))

// Helper function to check module completion
async function checkModuleCompletion(studentEmail: string, courseId: string, moduleId: string) {
  try {
    // Get all lessons in the module
    const { data: lessons, error: lessonsError } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('module_id', moduleId)

    if (lessonsError || !lessons || lessons.length === 0) return

    // Get completed lessons for this module
    const { data: completedLessons, error: completedError } = await supabaseAdmin
      .from('student_progress')
      .select('lesson_id')
      .eq('student_email', studentEmail)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .eq('progress_type', 'lesson_completed')
      .eq('status', 'completed')

    if (completedError) return

    // Check if all lessons are completed
    const completedLessonIds = completedLessons?.map(l => l.lesson_id) || []
    const allLessonsCompleted = lessons.every(lesson => completedLessonIds.includes(lesson.id))

    // Check if module exam is passed (if exists)
    const { data: moduleExam, error: examError } = await supabaseAdmin
      .from('quizzes')
      .select('id')
      .eq('module_id', moduleId)
      .eq('is_module_exam', true)
      .eq('is_published', true)
      .single()

    let moduleExamPassed = true // Default to true if no exam exists
    if (moduleExam && !examError) {
      const { data: examAttempt, error: attemptError } = await supabaseAdmin
        .from('quiz_attempts')
        .select('passed')
        .eq('quiz_id', moduleExam.id)
        .eq('student_email', studentEmail)
        .eq('passed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      moduleExamPassed = !attemptError && examAttempt?.passed === true
    }

    // Module is completed if all lessons are done AND exam is passed (if exists)
    if (allLessonsCompleted && moduleExamPassed) {
      // Check if module completion is already recorded
      const { data: existingModuleCompletion } = await supabaseAdmin
        .from('student_progress')
        .select('id')
        .eq('student_email', studentEmail)
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .eq('progress_type', 'module_completed')
        .single()

      if (!existingModuleCompletion) {
        // Record module completion
        const { data: moduleData } = await supabaseAdmin
          .from('modules')
          .select('title')
          .eq('id', moduleId)
          .single()

        const { data: courseData } = await supabaseAdmin
          .from('courses')
          .select('title, teacher_email')
          .eq('id', courseId)
          .single()

        await supabaseAdmin
          .from('student_progress')
          .insert({
            student_email: studentEmail,
            course_id: courseId,
            module_id: moduleId,
            progress_type: 'module_completed',
            status: 'completed',
            score: 100,
            time_spent_seconds: 0,
            metadata: {
              module_title: moduleData?.title,
              completed_at: new Date().toISOString(),
              has_exam: !!moduleExam
            }
          })

        // Send congratulatory notification to student
        await NotificationService.sendNotification({
          user_email: studentEmail,
          user_type: 'student',
          type: 'module_completion',
          title: '🎉 Module Completed!',
          message: `Congratulations! You have successfully completed the module "${moduleData?.title}" in the course "${courseData?.title}". ${moduleExam ? 'You passed the module exam!' : ''}`,
          data: {
            module_title: moduleData?.title,
            course_title: courseData?.title,
            course_id: courseId,
            module_id: moduleId,
            completion_date: new Date().toISOString(),
            has_exam: !!moduleExam
          }
        })

        // Send notification to teacher
        if (courseData?.teacher_email) {
          const { data: studentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('email', studentEmail)
            .eq('user_type', 'student')
            .single()

          await NotificationService.sendNotification({
            user_email: courseData.teacher_email,
            user_type: 'teacher',
            type: 'module_completion',
            title: 'Student Completed Module',
            message: `${studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail} has completed the module "${moduleData?.title}" in your course "${courseData?.title}". ${moduleExam ? 'They passed the module exam!' : ''}`,
            data: {
              student_name: studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : studentEmail,
              student_email: studentEmail,
              module_title: moduleData?.title,
              course_title: courseData?.title,
              course_id: courseId,
              module_id: moduleId,
              completion_date: new Date().toISOString(),
              has_exam: !!moduleExam
            }
          })
        }

        // Check if course is now completed
        await checkCourseCompletion(studentEmail, courseId)
      }
    }
  } catch (error) {
    console.error('Error checking module completion:', error)
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
      .eq('progress_type', 'module_completed')
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
        .eq('progress_type', 'course_completed')
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
            progress_type: 'course_completed',
            status: 'completed',
            score: 100,
            time_spent_seconds: 0,
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
          title: '🎉 Course Completed!',
          message: `Congratulations! You have successfully completed the course "${courseData?.title}"! Your certificate is now available for download.`,
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

export default router
