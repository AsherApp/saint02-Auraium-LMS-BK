import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Log student activity
router.post('/log', requireAuth, asyncHandler(async (req, res) => {
  const { student_id, activity_type, activity_data, course_id, lesson_id, assignment_id } = req.body
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (!student_id || !activity_type) {
    return res.status(400).json({ error: 'student_id and activity_type are required' })
  }

  try {
    // Verify the student exists and user has access
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, email, first_name, last_name')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Check access permissions
    if (userRole === 'teacher') {
      // Check if teacher has access to this student through courses
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id,
          courses!inner(
            id,
            teacher_email
          )
        `)
        .eq('student_email', student.email)
        .eq('courses.teacher_email', userEmail)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - No access to this student' })
      }
    } else if (userRole === 'student') {
      // Students can only log their own activity
      if (student.email !== userEmail) {
        return res.status(403).json({ error: 'Access denied - Can only log your own activity' })
      }
    }

    // Create activity log entry
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('student_activities')
      .insert({
        student_id,
        activity_type,
        activity_data: activity_data || {},
        course_id,
        lesson_id,
        assignment_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (activityError) {
      console.error('Error creating activity log:', activityError)
      return res.status(500).json({ error: 'Failed to log activity' })
    }

    // Update student's latest activity timestamp
    await supabaseAdmin
      .from('students')
      .update({ 
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)

    res.json(activity)
  } catch (error) {
    console.error('Error in log student activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get student activity history
router.get('/student/:studentId', requireAuth, asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { limit = 50, offset = 0, activity_type } = req.query
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Verify access to this student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, email')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      if (student.email !== userEmail) {
        return res.status(403).json({ error: 'Access denied - Can only view your own activity' })
      }
    } else if (userRole === 'teacher') {
      // Check if teacher has access to this student
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id,
          courses!inner(
            id,
            teacher_email
          )
        `)
        .eq('student_email', student.email)
        .eq('courses.teacher_email', userEmail)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - No access to this student' })
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('student_activities')
      .select(`
        *,
        courses(
          id,
          title
        ),
        lessons(
          id,
          title
        ),
        assignments(
          id,
          title
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    // Filter by activity type if specified
    if (activity_type) {
      query = query.eq('activity_type', activity_type)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching student activities:', error)
      return res.status(500).json({ error: 'Failed to fetch activities' })
    }

    res.json({ items: activities || [] })
  } catch (error) {
    console.error('Error in get student activities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get activity summary for a student
router.get('/student/:studentId/summary', requireAuth, asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Verify access to this student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, email')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      if (student.email !== userEmail) {
        return res.status(403).json({ error: 'Access denied - Can only view your own activity' })
      }
    } else if (userRole === 'teacher') {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id,
          courses!inner(
            id,
            teacher_email
          )
        `)
        .eq('student_email', student.email)
        .eq('courses.teacher_email', userEmail)
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - No access to this student' })
      }
    }

    // Get activity summary
    const { data: activities, error } = await supabaseAdmin
      .from('student_activities')
      .select('activity_type, created_at')
      .eq('student_id', studentId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) {
      console.error('Error fetching activity summary:', error)
      return res.status(500).json({ error: 'Failed to fetch activity summary' })
    }

    // Calculate summary statistics
    const summary: {
      total_activities: number;
      activities_by_type: Record<string, number>;
      last_activity: string | null;
      activity_trend: Array<{ date: string; count: number }>;
    } = {
      total_activities: activities?.length || 0,
      activities_by_type: {},
      last_activity: null,
      activity_trend: []
    }

    if (activities && activities.length > 0) {
      // Group by activity type
      activities.forEach(activity => {
        if (!summary.activities_by_type[activity.activity_type]) {
          summary.activities_by_type[activity.activity_type] = 0
        }
        summary.activities_by_type[activity.activity_type]++
      })

      // Get last activity
      summary.last_activity = activities[0].created_at

      // Calculate daily activity trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      summary.activity_trend = last7Days.map(date => {
        const dayActivities = activities.filter(activity => 
          activity.created_at.startsWith(date)
        )
        return {
          date,
          count: dayActivities.length
        }
      })
    }

    res.json(summary)
  } catch (error) {
    console.error('Error in get activity summary:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get all students activity overview (for teachers)
router.get('/overview', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied - Teachers only' })
  }

  try {
    // Get all students enrolled in teacher's courses
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        student_email,
        courses!inner(
          id,
          teacher_email
        )
      `)
      .eq('courses.teacher_email', userEmail)
      .eq('status', 'active')

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return res.status(500).json({ error: 'Failed to fetch enrollments' })
    }

    const studentEmails = enrollments?.map(e => e.student_email) || []

    if (studentEmails.length === 0) {
      return res.json({ items: [] })
    }

    // Get activity overview for all students
    const { data: activities, error } = await supabaseAdmin
      .from('student_activities')
      .select(`
        *,
        students!inner(
          id,
          email,
          first_name,
          last_name,
          student_code
        ),
        courses(
          id,
          title
        )
      `)
      .in('students.email', studentEmails)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities overview:', error)
      return res.status(500).json({ error: 'Failed to fetch activities overview' })
    }

    res.json({ items: activities || [] })
  } catch (error) {
    console.error('Error in get activities overview:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))
