import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const router = Router()

// Get comprehensive teacher analytics
router.get('/analytics', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = req.user?.email
  
  if (!teacherEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get total students enrolled in teacher's courses
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        student_email,
        courses!inner(teacher_email)
      `)
      .eq('courses.teacher_email', teacherEmail)

    if (enrollmentsError) throw enrollmentsError

    const uniqueStudents = new Set(enrollments?.map(e => e.student_email) || [])
    const totalStudents = uniqueStudents.size

    // Get total courses
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status')
      .eq('teacher_email', teacherEmail)

    if (coursesError) throw coursesError

    const totalCourses = courses?.length || 0
    const activeCourses = courses?.filter(c => c.status === 'published').length || 0

    // Get total assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .in('course_id', courses?.map(c => c.id) || [])

    if (assignmentsError) throw assignmentsError

    const totalAssignments = assignments?.length || 0

    // Calculate average completion rate
    let averageCompletion = 0
    if (courses && courses.length > 0) {
      const courseIds = courses.map(c => c.id)
      
      // Get student progress for all courses
      const { data: progressData, error: progressError } = await supabaseAdmin
        .from('student_progress')
        .select('course_id, progress_percentage')
        .in('course_id', courseIds)

      if (!progressError && progressData && progressData.length > 0) {
        const totalProgress = progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0)
        averageCompletion = Math.round(totalProgress / progressData.length)
      }
    }

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('student_activities')
      .select(`
        id,
        activity_type,
        description,
        created_at,
        student_email,
        course_id
      `)
      .in('course_id', courses?.map(c => c.id) || [])
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) throw activityError

    // Format recent activity
    const formattedActivity = recentActivity?.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      student: activity.student_email || 'Unknown Student',
      course: activity.course_id || 'Unknown Course',
      time: new Date(activity.created_at).toLocaleString(),
      description: activity.description
    })) || []

    // Get course performance data
    const coursePerformance = await Promise.all(
      (courses || []).map(async (course) => {
        // Get student count for this course
        const { data: courseEnrollments, error: enrollError } = await supabaseAdmin
          .from('enrollments')
          .select('student_email')
          .eq('course_id', course.id)

        if (enrollError) return null

        const studentCount = courseEnrollments?.length || 0

        // Get average completion for this course
        const { data: courseProgress, error: progressError } = await supabaseAdmin
          .from('student_progress')
          .select('progress_percentage')
          .eq('course_id', course.id)

        if (progressError) return null

        const avgCompletion = courseProgress && courseProgress.length > 0
          ? Math.round(courseProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / courseProgress.length)
          : 0

        // Get average grade for this course
        const { data: grades, error: gradesError } = await supabaseAdmin
          .from('student_grades')
          .select('grade_percentage')
          .eq('course_id', course.id)

        if (gradesError) return null

        const avgGrade = grades && grades.length > 0
          ? Math.round(grades.reduce((sum, g) => sum + (g.grade_percentage || 0), 0) / grades.length)
          : 0

        return {
          id: course.id,
          title: course.title,
          status: course.status,
          studentCount,
          avgCompletion,
          avgGrade
        }
      })
    )

    const validCoursePerformance = coursePerformance.filter(Boolean)

    res.json({
      totalStudents,
      totalCourses: activeCourses,
      totalAssignments,
      averageCompletion,
      recentActivity: formattedActivity,
      coursePerformance: validCoursePerformance,
      // Additional metrics
      totalEnrollments: enrollments?.length || 0,
      draftCourses: courses?.filter(c => c.status === 'draft').length || 0,
      publishedCourses: activeCourses
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: error.message })
  }
}))

// Get detailed course analytics
router.get('/courses/:courseId/analytics', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const teacherEmail = req.user?.email

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Verify teacher owns this course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, teacher_email')
      .eq('id', courseId)
      .eq('teacher_email', teacherEmail)
      .single()

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Get course analytics
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select('student_email')
      .eq('course_id', courseId)

    if (enrollmentsError) throw enrollmentsError

    const studentCount = enrollments?.length || 0

    // Get assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('id, title, type')
      .eq('course_id', courseId)

    if (assignmentsError) throw assignmentsError

    const assignmentCount = assignments?.length || 0

    // Get average progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('student_progress')
      .select('progress_percentage')
      .eq('course_id', courseId)

    if (progressError) throw progressError

    const avgProgress = progress && progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / progress.length)
      : 0

    // Get average grade
    const { data: grades, error: gradesError } = await supabaseAdmin
      .from('student_grades')
      .select('grade_percentage')
      .eq('course_id', courseId)

    if (gradesError) throw gradesError

    const avgGrade = grades && grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + (g.grade_percentage || 0), 0) / grades.length)
      : 0

    res.json({
      courseId,
      courseTitle: course.title,
      studentCount,
      assignmentCount,
      avgProgress,
      avgGrade,
      assignments: assignments || []
    })

  } catch (error: any) {
    console.error('Course analytics error:', error)
    res.status(500).json({ error: error.message })
  }
}))

export default router
