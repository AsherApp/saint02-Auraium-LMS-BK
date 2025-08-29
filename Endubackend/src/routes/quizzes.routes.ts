import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

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

// Create a new quiz (teacher only)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const {
    course_id,
    lesson_id,
    title,
    description,
    questions,
    time_limit_minutes,
    passing_score,
    max_attempts
  } = req.body

  if (!course_id || !title || !questions) {
    return res.status(400).json({ error: 'course_id, title, and questions are required' })
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
      lesson_id,
      title,
      description,
      questions,
      time_limit_minutes,
      passing_score: passing_score || 70,
      max_attempts: max_attempts || 1,
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
        progress_type: 'quiz_passed',
        status: 'completed',
        score,
        time_spent_seconds: time_taken_seconds,
        metadata: { quiz_id: quizId, attempt_number: attempt.attempt_number }
      }, {
        onConflict: 'student_email,course_id,lesson_id,progress_type'
      })
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

export default router
