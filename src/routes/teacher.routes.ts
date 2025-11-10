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

    // Placeholder for Recent Reports
    const recentReports = [
      { name: 'Student Progress Report - Q3', generatedAt: '2023-09-30', url: '#' },
      { name: 'Course Analytics Summary - October', generatedAt: '2023-10-31', url: '#' },
    ]

    res.json({
      totalStudents,
      totalCourses: activeCourses,
      totalAssignments,
      averageCompletion,
      recentActivity: formattedActivity,
      coursePerformance: validCoursePerformance,
      pollParticipation: [],
      discussionParticipation: [],
      recentReports: recentReports,
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

// New endpoint for generating reports
router.get('/reports/export', requireAuth, asyncHandler(async (req, res) => {
  const teacherEmail = req.user?.email
  const { reportType } = req.query

  if (!teacherEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let csvContent = ""
  let filename = ""

  switch (reportType) {
    case 'Student Progress':
      filename = 'student_progress_report.csv'
      csvContent = "Student Name,Student Email,Course Title,Completion %,Lessons Completed,Total Lessons,Assignments Completed,Total Assignments,Quizzes Passed,Total Quizzes,Average Grade\n"

      // Fetch all student progress data for the teacher's courses
      const { data: teacherCourses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('teacher_email', teacherEmail)

      if (coursesError) throw coursesError

      const teacherCourseIds = teacherCourses?.map(c => c.id) || []

      const { data: progressData, error: progressError } = await supabaseAdmin
        .from('student_course_progress')
        .select(`
          student_email,
          course_id,
          completion_percentage,
          completed_lessons,
          total_lessons,
          completed_assignments,
          total_assignments,
          passed_quizzes,
          total_quizzes,
          average_grade,
          students(name)
        `)
        .in('course_id', teacherCourseIds)

      if (progressError) throw progressError

      progressData?.forEach((item: any) => {
        const courseTitle = teacherCourses?.find(c => c.id === item.course_id)?.title || 'N/A'
        const studentName = item.students?.name || 'N/A'
        const completionPercent = Math.round(item.completion_percentage || 0)
        const lessonsCompleted = `${item.completed_lessons || 0}/${item.total_lessons || 0}`
        const assignmentsCompleted = `${item.completed_assignments || 0}/${item.total_assignments || 0}`
        const quizzesPassed = `${item.passed_quizzes || 0}/${item.total_quizzes || 0}`
        const avgGrade = Math.round(item.average_grade || 0)

        csvContent += `${studentName},${item.student_email},${courseTitle},${completionPercent},${lessonsCompleted},${assignmentsCompleted},${quizzesPassed},${avgGrade}\n`
      })
      break
    case 'Course Analytics':
      filename = 'course_analytics_report.csv'
      csvContent = "Course Title,Total Students,Avg. Completion %,Avg. Grade\n"

      // Fetch all courses for the teacher
      const { data: analyticsCourses, error: analyticsCoursesError } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('teacher_email', teacherEmail)

      if (analyticsCoursesError) throw analyticsCoursesError

      for (const course of analyticsCourses || []) {
        // Get enrollment count
        const { count: enrollmentCount, error: enrollmentError } = await supabaseAdmin
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id)

        if (enrollmentError) throw enrollmentError

        // Get completion statistics
        const { data: completionStats, error: completionStatsError } = await supabaseAdmin
          .from('student_course_progress')
          .select('completion_percentage, average_grade')
          .eq('course_id', course.id)

        if (completionStatsError) throw completionStatsError

        const totalStudents = enrollmentCount || 0
        const averageCompletion = completionStats?.length > 0 
          ? completionStats.reduce((sum, c) => sum + c.completion_percentage, 0) / completionStats.length 
          : 0
        const averageGrade = completionStats?.length > 0 
          ? completionStats.reduce((sum, c) => sum + (c.average_grade || 0), 0) / completionStats.length 
          : 0

        csvContent += `${course.title},${totalStudents},${Math.round(averageCompletion)},${Math.round(averageGrade)}\n`
      }
      break
    case 'Performance Analytics':
      filename = 'performance_analytics_report.csv'
      csvContent = "Metric,Value\n"

      // Reuse analytics logic to get overall metrics
      const { data: perfEnrollments, error: perfEnrollmentsError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          student_email,
          courses!inner(teacher_email)
        `)
        .eq('courses.teacher_email', teacherEmail)

      if (perfEnrollmentsError) throw perfEnrollmentsError

      const uniqueStudents = new Set(perfEnrollments?.map(e => e.student_email) || [])
      const totalStudents = uniqueStudents.size

      const { data: perfCourses, error: perfCoursesError } = await supabaseAdmin
        .from('courses')
        .select('id, status')
        .eq('teacher_email', teacherEmail)

      if (perfCoursesError) throw perfCoursesError

      const activeCourses = perfCourses?.filter(c => c.status === 'published').length || 0

      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('assignments')
        .select('id')
        .in('course_id', perfCourses?.map(c => c.id) || [])

      if (assignmentsError) throw assignmentsError

      const totalAssignments = assignments?.length || 0

      let averageCompletion = 0
      if (perfCourses && perfCourses.length > 0) {
        const courseIds = perfCourses.map(c => c.id)
        const { data: perfProgressData, error: perfProgressError } = await supabaseAdmin
          .from('student_progress')
          .select('course_id, progress_percentage')
          .in('course_id', courseIds)

        if (!perfProgressError && perfProgressData && perfProgressData.length > 0) {
          const totalProgress = perfProgressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0)
          averageCompletion = Math.round(totalProgress / perfProgressData.length)
        }
      }

      csvContent += `Total Students,${totalStudents}\n`
      csvContent += `Total Courses,${activeCourses}\n`
      csvContent += `Total Assignments,${totalAssignments}\n`
      csvContent += `Average Completion,${averageCompletion}%\n`
      break
    default:
      filename = 'report.csv'
      csvContent = "Report Type,Status\n"
      csvContent += `${reportType || 'Unknown'},Not Implemented\n`
      break
  }

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.status(200).send(csvContent)
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
