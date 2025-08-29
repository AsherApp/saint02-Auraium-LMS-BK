import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Get student analytics
router.get('/analytics', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get course completions
  const { data: courseCompletions, error: completionsError } = await supabaseAdmin
    .from('course_completions')
    .select(`
      *,
      courses(title, description)
    `)
    .eq('student_email', userEmail)

  if (completionsError) {
    return res.status(500).json({ error: completionsError.message })
  }

  // Get recent activities
  const { data: activities, error: activitiesError } = await supabaseAdmin
    .from('student_activities')
    .select('*')
    .eq('student_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(50)

  if (activitiesError) {
    return res.status(500).json({ error: activitiesError.message })
  }

  // Get recent notes
  const { data: notes, error: notesError } = await supabaseAdmin
    .from('student_notes')
    .select('*')
    .eq('student_email', userEmail)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (notesError) {
    return res.status(500).json({ error: notesError.message })
  }

  // Get quiz attempts
  const { data: quizAttempts, error: quizError } = await supabaseAdmin
    .from('quiz_attempts')
    .select(`
      *,
      quizzes(title, course_id)
    `)
    .eq('student_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(10)

  if (quizError) {
    return res.status(500).json({ error: quizError.message })
  }

  // Get poll responses
  const { data: pollResponses, error: pollError } = await supabaseAdmin
    .from('poll_responses')
    .select(`
      *,
      polls(question, course_id)
    `)
    .eq('student_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(10)

  if (pollError) {
    return res.status(500).json({ error: pollError.message })
  }

  // Get discussion posts
  const { data: discussionPosts, error: discussionError } = await supabaseAdmin
    .from('discussion_posts')
    .select(`
      *,
      discussions(title, course_id)
    `)
    .eq('author_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(10)

  if (discussionError) {
    return res.status(500).json({ error: discussionError.message })
  }

  // Calculate analytics
  const totalCourses = courseCompletions?.length || 0
  const activeCourses = courseCompletions?.filter(c => c.courses?.status === 'published').length || 0
  const completedCourses = courseCompletions?.filter(c => c.completion_percentage === 100).length || 0
  const overallProgress = totalCourses > 0 
    ? Math.round(courseCompletions?.reduce((sum, c) => sum + (c.completion_percentage || 0), 0) / totalCourses)
    : 0

  const totalActivities = activities?.length || 0
  const recentActivities = activities?.slice(0, 10) || []

  const totalNotes = notes?.length || 0
  const totalQuizzes = quizAttempts?.length || 0
  const passedQuizzes = quizAttempts?.filter(q => q.passed).length || 0
  const totalPolls = pollResponses?.length || 0
  const totalDiscussions = discussionPosts?.length || 0

  // Activity breakdown by type
  const activityBreakdown = {
    lesson_completed: activities?.filter(a => a.activity_type === 'lesson_completed').length || 0,
    quiz_completed: activities?.filter(a => a.activity_type === 'quiz_completed').length || 0,
    assignment_submitted: activities?.filter(a => a.activity_type === 'assignment_submitted').length || 0,
    discussion_posted: activities?.filter(a => a.activity_type === 'discussion_posted').length || 0,
    poll_responded: activities?.filter(a => a.activity_type === 'poll_responded').length || 0,
    note_created: activities?.filter(a => a.activity_type === 'note_created').length || 0
  }

  const analytics = {
    overview: {
      total_courses: totalCourses,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      overall_progress: overallProgress
    },
    activities: {
      total_activities: totalActivities,
      recent_activities: recentActivities,
      breakdown: activityBreakdown
    },
    content: {
      total_notes: totalNotes,
      total_quizzes: totalQuizzes,
      passed_quizzes: passedQuizzes,
      quiz_pass_rate: totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0,
      total_polls: totalPolls,
      total_discussions: totalDiscussions
    },
    recent_content: {
      notes: notes || [],
      quiz_attempts: quizAttempts || [],
      poll_responses: pollResponses || [],
      discussion_posts: discussionPosts || []
    }
  }

  res.json(analytics)
}))

// Get student progress overview
router.get('/progress', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'student') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get course completions
  const { data: courseCompletions, error: completionsError } = await supabaseAdmin
    .from('course_completions')
    .select(`
      *,
      courses(title, description, status)
    `)
    .eq('student_email', userEmail)

  if (completionsError) {
    return res.status(500).json({ error: completionsError.message })
  }

  // Get module completions
  const { data: moduleCompletions, error: moduleError } = await supabaseAdmin
    .from('module_completions')
    .select(`
      *,
      modules(title, description),
      courses(title)
    `)
    .eq('student_email', userEmail)

  if (moduleError) {
    return res.status(500).json({ error: moduleError.message })
  }

  // Get recent progress activities
  const { data: progressActivities, error: progressError } = await supabaseAdmin
    .from('student_progress')
    .select('*')
    .eq('student_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(20)

  if (progressError) {
    return res.status(500).json({ error: progressError.message })
  }

  // Calculate overall statistics
  const totalCourses = courseCompletions?.length || 0
  const activeCourses = courseCompletions?.filter(c => c.courses?.status === 'published').length || 0
  const completedCourses = courseCompletions?.filter(c => c.completion_percentage === 100).length || 0
  const overallProgress = totalCourses > 0 
    ? Math.round(courseCompletions?.reduce((sum, c) => sum + (c.completion_percentage || 0), 0) / totalCourses)
    : 0

  const totalModules = moduleCompletions?.length || 0
  const completedModules = moduleCompletions?.filter(m => m.completion_percentage === 100).length || 0

  const progress = {
    overview: {
      total_courses: totalCourses,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      overall_progress: overallProgress,
      total_modules: totalModules,
      completed_modules: completedModules
    },
    course_progress: courseCompletions || [],
    module_progress: moduleCompletions || [],
    recent_activities: progressActivities || []
  }

  res.json(progress)
}))

// Get student's courses
router.get('/:email/courses', requireAuth, asyncHandler(async (req, res) => {
  const { email } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if user can access this data
  if (userRole === 'student' && userEmail !== email) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get enrolled courses
  const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      courses(
        id,
        title,
        description,
        status,
        teacher_email,
        created_at,
        updated_at
      )
    `)
    .eq('student_email', email)

  if (enrollmentsError) {
    return res.status(500).json({ error: enrollmentsError.message })
  }

  // Transform data
  const courses = enrollments?.map(enrollment => ({
    ...enrollment.courses,
    enrolled_at: enrollment.created_at
  })) || []

  res.json({ items: courses })
}))

// Get student profile
router.get('/:email/profile', requireAuth, asyncHandler(async (req, res) => {
  const { email } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if user can access this data
  if (userRole === 'student' && userEmail !== email) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get student profile
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email)
    .single()

  if (studentError) {
    return res.status(404).json({ error: 'Student not found' })
  }

  res.json(student)
}))

// Update student profile
router.put('/:email/profile', requireAuth, asyncHandler(async (req, res) => {
  const { email } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if user can update this profile
  if (userRole === 'student' && userEmail !== email) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const updateData = req.body

  // Update student profile
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .update(updateData)
    .eq('email', email)
    .select()
    .single()

  if (studentError) {
    return res.status(500).json({ error: studentError.message })
  }

  res.json(student)
}))

export default router
