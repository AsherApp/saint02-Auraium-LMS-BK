import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const router = Router()

// Get user profile by ID
router.get('/:userId', requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params
  
  // Check if user is a teacher
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .select('id, email, first_name, last_name, subscription_status, max_students_allowed')
    .eq('id', userId)
    .single()

  if (teacher) {
    return res.json({
      id: teacher.id,
      email: teacher.email,
      role: 'teacher',
      name: `${teacher.first_name} ${teacher.last_name}`,
      subscription_status: teacher.subscription_status,
      max_students_allowed: teacher.max_students_allowed
    })
  }

  // Check if user is a student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, email, name, status')
    .eq('id', userId)
    .single()

  if (student) {
    return res.json({
      id: student.id,
      email: student.email,
      role: 'student',
      name: student.name,
      status: student.status
    })
  }

  // User not found
  return res.status(404).json({ error: 'user_not_found' })
}))

// Get user profile by email (for backward compatibility)
router.get('/email/:userEmail', requireAuth, asyncHandler(async (req, res) => {
  const { userEmail } = req.params
  
  // Check if user is a teacher
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .select('id, email, first_name, last_name, subscription_status, max_students_allowed')
    .eq('email', userEmail.toLowerCase())
    .single()

  if (teacher) {
    return res.json({
      id: teacher.id,
      email: teacher.email,
      role: 'teacher',
      name: `${teacher.first_name} ${teacher.last_name}`,
      subscription_status: teacher.subscription_status,
      max_students_allowed: teacher.max_students_allowed
    })
  }

  // Check if user is a student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, email, name, status')
    .eq('email', userEmail.toLowerCase())
    .single()

  if (student) {
    return res.json({
      id: student.id,
      email: student.email,
      role: 'student',
      name: student.name,
      status: student.status
    })
  }

  // User not found
  return res.status(404).json({ error: 'user_not_found' })
}))

// Update user profile by email
router.put('/email/:userEmail', requireAuth, asyncHandler(async (req, res) => {
  const { userEmail } = req.params
  const updateData = req.body
  
  // Check if user is a teacher
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .select('id, email')
    .eq('email', userEmail.toLowerCase())
    .single()

  if (teacher) {
    // Update teacher profile
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .update(updateData)
      .eq('email', userEmail.toLowerCase())
      .select('id, email, first_name, last_name, subscription_status, max_students_allowed')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'teacher',
      name: `${data.first_name} ${data.last_name}`,
      subscription_status: data.subscription_status,
      max_students_allowed: data.max_students_allowed
    })
  }

  // Check if user is a student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, email')
    .eq('email', userEmail.toLowerCase())
    .single()

  if (student) {
    // Update student profile
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('email', userEmail.toLowerCase())
      .select('id, email, name, status')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'student',
      name: data.name,
      status: data.status
    })
  }

  // User not found
  return res.status(404).json({ error: 'user_not_found' })
}))

// Update user profile by ID
router.put('/:userId', requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params
  const updateData = req.body
  
  // Check if user is a teacher
  const { data: teacher, error: teacherError } = await supabaseAdmin
    .from('teachers')
    .select('id, email')
    .eq('id', userId)
    .single()

  if (teacher) {
    // Update teacher profile
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, first_name, last_name, subscription_status, max_students_allowed')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'teacher',
      name: `${data.first_name} ${data.last_name}`,
      subscription_status: data.subscription_status,
      max_students_allowed: data.max_students_allowed
    })
  }

  // Check if user is a student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('id, email')
    .eq('id', userId)
    .single()

  if (student) {
    // Update student profile
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, status')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'student',
      name: data.name,
      status: data.status
    })
  }

  // User not found
  return res.status(404).json({ error: 'user_not_found' })
}))

// Create user profile
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const profileData = req.body
  
  if (profileData.role === 'teacher') {
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .insert(profileData)
      .select('id, email, first_name, last_name, subscription_status, max_students_allowed')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'teacher',
      name: `${data.first_name} ${data.last_name}`,
      subscription_status: data.subscription_status,
      max_students_allowed: data.max_students_allowed
    })
  } else if (profileData.role === 'student') {
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert(profileData)
      .select('id, email, name, status')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({
      id: data.id,
      email: data.email,
      role: 'student',
      name: data.name,
      status: data.status
    })
  }

  return res.status(400).json({ error: 'invalid_role' })
})) 