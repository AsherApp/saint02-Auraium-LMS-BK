import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

type EnrollmentRow = {
  id: string
  student_email: string
  student_code: string | null
  status: string
  created_at: string
}

type UserProfileRow = {
  email: string
  first_name: string | null
  last_name: string | null
  student_code: string | null
}

export const router = Router()

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userEmail = (req as any).user?.email as string | undefined
    const userRole = (req as any).user?.role as string | undefined
    const courseId = req.query.course_id

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ error: 'course_id_required' })
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('teacher_email, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return res.status(404).json({ error: 'course_not_found' })
    }

    const isCourseTeacher = course.teacher_email === userEmail
    const isStaff = userRole === 'admin' || userRole === 'super_admin'
    let isEnrolledStudent = false

    if (!isCourseTeacher && !isStaff && userRole === 'student') {
      const { data: enrollmentCheck, error: enrollmentCheckError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_email', userEmail)
        .limit(1)

      if (enrollmentCheckError) {
        console.error('Error verifying student enrollment:', enrollmentCheckError)
        return res.status(500).json({ error: 'failed_to_verify_student' })
      }

      isEnrolledStudent = Array.isArray(enrollmentCheck) && enrollmentCheck.length > 0
    }

    if (!isCourseTeacher && !isStaff && !isEnrolledStudent) {
      return res.status(403).json({ error: 'forbidden' })
    }

    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select('id, student_email, student_code, status, created_at')
      .eq('course_id', courseId)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return res.status(500).json({
        error: 'failed_to_fetch_enrollments',
        details: enrollmentsError?.message ?? enrollmentsError
      })
    }

    const emailSet = new Set<string>()
    enrollments?.forEach((row) => {
      if (row.student_email) {
        emailSet.add(row.student_email.toLowerCase())
      }
    })
    if (course.teacher_email) {
      emailSet.add(course.teacher_email.toLowerCase())
    }

    let profiles: UserProfileRow[] = []
    if (emailSet.size > 0) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('email, first_name, last_name, student_code')
        .in('email', Array.from(emailSet))

      if (profileError) {
      console.error('Error fetching user profiles:', profileError)
      return res.status(500).json({
        error: 'failed_to_fetch_profiles',
        details: profileError?.message ?? profileError
      })
      }

      profiles = profileData || []
    }

    const profileMap = new Map(
      profiles.map((profile) => [profile.email?.toLowerCase() ?? '', profile])
    )

    const studentItems = (enrollments || []).map((row: EnrollmentRow) => {
      const profile = profileMap.get(row.student_email.toLowerCase())
      const firstName = profile?.first_name?.trim() ?? ''
      const lastName = profile?.last_name?.trim() ?? ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
      const studentCode = profile?.student_code ?? row.student_code ?? null

      return {
        role: 'student',
        enrollmentId: row.id,
        student_email: row.student_email,
        student_name: fullName || row.student_email,
        student_code: studentCode,
        status: row.status,
        joined_at: row.created_at,
        avatar_url: null
      }
    })

    let teacherEntry = null
    if (course.teacher_email) {
      const teacherProfile = profileMap.get(course.teacher_email.toLowerCase())
      const teacherFirst = teacherProfile?.first_name?.trim() ?? ''
      const teacherLast = teacherProfile?.last_name?.trim() ?? ''
      const teacherName = [teacherFirst, teacherLast].filter(Boolean).join(' ').trim()

      teacherEntry = {
        role: 'teacher',
        enrollmentId: null,
        student_email: course.teacher_email,
        student_name: teacherName || course.teacher_email,
        student_code: null,
        status: 'teacher',
        joined_at: null,
        avatar_url: null
      }
    }

    const items = teacherEntry ? [teacherEntry, ...studentItems] : studentItems

    res.json({
      items,
      course: {
        id: courseId,
        title: course.title ?? null,
        teacher_email: course.teacher_email ?? null
      }
    })
  })
)

