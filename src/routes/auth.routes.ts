import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { generateStudentCode } from '../utils/student-code.js'
import { requireAuth } from '../middlewares/auth.js'
import { generateToken } from '../lib/jwt.js'

export const router = Router()

// Get current user info (requires JWT token)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  
  if (!user) {
    return res.status(401).json({ error: 'user_not_found' })
  }

  res.json({
    email: user.email,
    role: user.role,
    name: user.name,
    student_code: user.student_code,
    subscription_status: user.subscription_status,
    max_students_allowed: user.max_students_allowed
  })
}))

// Teacher sign in
router.post('/teacher/signin', asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Get teacher with password hash
  const { data: teacher, error } = await supabaseAdmin
    .from('teachers')
    .select('email, first_name, last_name, password_hash, subscription_status, max_students_allowed')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !teacher) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Verify password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.compare(password, teacher.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Generate JWT token
  const token = await generateToken({
    email: teacher.email,
    role: 'teacher',
    name: `${teacher.first_name} ${teacher.last_name}`,
    subscription_status: teacher.subscription_status,
    max_students_allowed: teacher.max_students_allowed
  })

  res.json({
    user: {
      email: teacher.email,
      role: 'teacher',
      name: `${teacher.first_name} ${teacher.last_name}`,
      subscription_status: teacher.subscription_status,
      max_students_allowed: teacher.max_students_allowed
    },
    token
  })
}))

// Student sign in with code
router.post('/student/signin-code', asyncHandler(async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Check if the code exists and is valid
  const { data: loginCode, error: codeError } = await supabaseAdmin
    .from('student_login_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (codeError || !loginCode) {
    return res.status(401).json({ error: 'invalid_code' })
  }

  // Get student info
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('email, name, status')
    .eq('email', email.toLowerCase())
    .single()

  if (studentError || !student) {
    return res.status(401).json({ error: 'student_not_found' })
  }

  if (student.status !== 'active') {
    return res.status(403).json({ error: 'account_suspended' })
  }

  // Mark code as used
  await supabaseAdmin
    .from('student_login_codes')
    .update({ used: true })
    .eq('id', loginCode.id)

  // Generate JWT token
  const token = await generateToken({
    email: student.email,
    role: 'student',
    name: student.name
  })

  res.json({
    user: {
      email: student.email,
      role: 'student',
      name: student.name
    },
    token
  })
}))

// Get all students for a teacher (for invite modal)
router.get('/teacher/students', requireAuth, asyncHandler(async (req, res) => {
  const user = (req as any).user
  
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'teacher_access_required' })
  }

  // Get all students that the teacher can see (either enrolled in their courses or available for invitation)
  const { data: students, error } = await supabaseAdmin
    .from('students')
    .select('email, name, status, created_at')
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json({ items: students || [] })
}))

// Student sign in with student code and password
router.post('/student/signin', asyncHandler(async (req, res) => {
  const { student_code, password } = req.body
  if (!student_code || !password) {
    return res.status(400).json({ error: 'missing_credentials' })
  }

  // Get student with password hash
  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('email, name, student_code, password_hash, status')
    .eq('student_code', student_code.toUpperCase())
    .single()

  if (error || !student) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  if (student.status !== 'active') {
    return res.status(403).json({ error: 'account_suspended' })
  }

  // Check if student has a password set
  if (!student.password_hash) {
    return res.status(401).json({ error: 'password_not_set' })
  }

  // Verify password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.compare(password, student.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // Generate JWT token
  const token = await generateToken({
    email: student.email,
    role: 'student',
    name: student.name,
    student_code: student.student_code
  })

  res.json({
    user: {
      email: student.email,
      role: 'student',
      name: student.name,
      student_code: student.student_code
    },
    token
  })
}))

// Create student login code
router.post('/student/login-code', asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'missing_email' })
  }

  // Check if student exists
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('email')
    .eq('email', email.toLowerCase())
    .single()

  if (studentError || !student) {
    return res.status(404).json({ error: 'student_not_found' })
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create login code
  const { data: loginCode, error: codeError } = await supabaseAdmin
    .from('student_login_codes')
    .insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (codeError) {
    return res.status(500).json({ error: codeError.message })
  }

  res.json({ code, expires_at: expiresAt.toISOString() })
}))

// Student registration with invite
router.post('/student/register', asyncHandler(async (req, res) => {
  const { invite_code, first_name, last_name, email, password } = req.body
  
  if (!invite_code || !first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  // Validate invite
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('*')
    .eq('code', invite_code)
    .single()

  if (inviteError || !invite) {
    return res.status(400).json({ error: 'Invalid invite code' })
  }

  if (invite.used) {
    return res.status(400).json({ error: 'Invite has already been used' })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invite has expired' })
  }

  // Check if student already exists
  const { data: existingStudent } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingStudent) {
    return res.status(400).json({ error: 'Student with this email already exists' })
  }

  // Generate student code
  const studentCode = generateStudentCode(first_name, last_name)
  
  // Hash password
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.hash(password, 10)

  // Create student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      email: email.toLowerCase(),
      name: `${first_name} ${last_name}`,
      first_name,
      last_name,
      student_code: studentCode,
      password_hash: passwordHash,
      status: 'active',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (studentError) {
    return res.status(500).json({ error: studentError.message })
  }

  // Mark invite as used
  await supabaseAdmin
    .from('invites')
    .update({ used: true })
    .eq('code', invite_code)

  // Create enrollment if course_id is provided
  if (invite.course_id) {
    await supabaseAdmin
      .from('enrollments')
      .insert({
        course_id: invite.course_id,
        student_email: email.toLowerCase(),
        enrolled_at: new Date().toISOString()
      })
  }

  res.json({ 
    message: 'Student registered successfully',
    student_code: studentCode,
    student: {
      email: student.email,
      name: student.name,
      student_code: student.student_code
    }
  })
}))

// Teacher registration
router.post('/teacher/register', asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password } = req.body
  
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  // Check if teacher already exists
  const { data: existingTeacher } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingTeacher) {
    return res.status(400).json({ error: 'Teacher with this email already exists' })
  }

  // Hash password
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.hash(password, 10)

  // Create teacher with complete profile
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .insert({
      email: email.toLowerCase(),
      first_name,
      last_name,
      password_hash: passwordHash,
      subscription_status: 'free',
      max_students_allowed: 50,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (teacherError) {
    return res.status(500).json({ error: teacherError.message })
  }

  res.json({ 
    message: 'Teacher registered successfully',
    teacher: {
      email: teacher.email,
      name: `${first_name} ${last_name}`,
      subscription_status: teacher.subscription_status
    }
  })
}))

// Change student password
router.post('/student/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body
  
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Get student with current password
  const { data: student, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (fetchError || !student) {
    return res.status(404).json({ error: 'Student not found' })
  }

  // Verify current password
  const bcrypt = await import('bcrypt')
  const isValidPassword = await bcrypt.default.compare(currentPassword, student.password_hash)
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  // Hash new password
  const newPasswordHash = await bcrypt.default.hash(newPassword, 10)

  // Update password
  const { error: updateError } = await supabaseAdmin
    .from('students')
    .update({ password_hash: newPasswordHash })
    .eq('email', email.toLowerCase())

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.json({ message: 'Password changed successfully' })
}))