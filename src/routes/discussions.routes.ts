import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Get all discussions for a course
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

    // Check if teacher allows student discussions
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('allow_discussions')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (!course.allow_discussions) {
      return res.status(403).json({ 
        error: 'discussions_disabled',
        message: 'The teacher has disabled discussions for this course.'
      })
    }
  }

  // Get discussions
  const { data: discussions, error: discussionsError } = await supabaseAdmin
    .from('discussions')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (discussionsError) {
    return res.status(500).json({ error: discussionsError.message })
  }

  res.json({ items: discussions || [] })
}))

// Create a new discussion (teacher only)
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
    allow_student_posts,
    require_approval
  } = req.body

  if (!course_id || !title) {
    return res.status(400).json({ error: 'course_id and title are required' })
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

  // Create discussion
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .insert({
      course_id,
      lesson_id,
      title,
      description,
      allow_student_posts: allow_student_posts !== undefined ? allow_student_posts : true,
      require_approval: require_approval || false,
      created_by: userEmail
    })
    .select()
    .single()

  if (discussionError) {
    return res.status(500).json({ error: discussionError.message })
  }

  res.status(201).json(discussion)
}))

// Get a specific discussion with posts
router.get('/:discussionId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { discussionId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get discussion
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only access their own discussions
    if (discussion.created_by !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', discussion.course_id)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  // Get posts
  let postsQuery = supabaseAdmin
    .from('discussion_posts')
    .select('*')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true })

  // Students can only see approved posts
  if (userRole === 'student') {
    postsQuery = postsQuery.eq('is_approved', true)
  }

  const { data: posts, error: postsError } = await postsQuery

  if (postsError) {
    return res.status(500).json({ error: postsError.message })
  }

  const result = {
    discussion,
    posts: posts || []
  }

  res.json(result)
}))

// Create a discussion post
router.post('/:discussionId/posts', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { discussionId } = req.params
  const { content, parent_post_id } = req.body
  
  if (!userEmail || !content) {
    return res.status(400).json({ error: 'content is required' })
  }

  // Get discussion
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Check access permissions
  if (userRole === 'teacher') {
    // Teacher can only post in their own discussions
    if (discussion.created_by !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student must be enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', discussion.course_id)
      .eq('student_email', userEmail)
      .single()

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }

    // Check if students are allowed to post
    if (!discussion.allow_student_posts) {
      return res.status(403).json({ error: 'Students are not allowed to post in this discussion' })
    }
  }

  // Create post
  const { data: post, error: postError } = await supabaseAdmin
    .from('discussion_posts')
    .insert({
      discussion_id: discussionId,
      author_email: userEmail,
      author_role: userRole,
      content,
      parent_post_id,
      is_approved: userRole === 'teacher' || !discussion.require_approval
    })
    .select()
    .single()

  if (postError) {
    return res.status(500).json({ error: postError.message })
  }

  // Record progress for students
  if (userRole === 'student') {
    await supabaseAdmin
      .from('student_progress')
      .upsert({
        student_email: userEmail,
        course_id: discussion.course_id,
        progress_type: 'discussion_participated',
        status: 'completed',
        metadata: { discussion_id: discussionId, post_id: post.id }
      }, {
        onConflict: 'student_email,course_id,lesson_id,progress_type'
      })

    // Log activity
    await supabaseAdmin
      .from('student_activities')
      .insert({
        student_email: userEmail,
        course_id: discussion.course_id,
        activity_type: 'discussion_posted',
        description: 'Posted in discussion',
        metadata: { discussion_id: discussionId, post_id: post.id }
      })
  }

  res.status(201).json(post)
}))

// Approve/reject a discussion post (teacher only)
router.post('/posts/:postId/approve', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { postId } = req.params
  const { is_approved } = req.body
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get post
  const { data: post, error: postError } = await supabaseAdmin
    .from('discussion_posts')
    .select(`
      *,
      discussions!inner(
        id,
        course_id,
        created_by
      )
    `)
    .eq('id', postId)
    .single()

  if (postError || !post) {
    return res.status(404).json({ error: 'Post not found' })
  }

  // Check if teacher owns the discussion
  if (post.discussions.created_by !== userEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Update post approval status
  const { data: updatedPost, error: updateError } = await supabaseAdmin
    .from('discussion_posts')
    .update({
      is_approved
    })
    .eq('id', postId)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  res.json(updatedPost)
}))

// Delete a discussion post
router.delete('/posts/:postId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { postId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get post
  const { data: post, error: postError } = await supabaseAdmin
    .from('discussion_posts')
    .select(`
      *,
      discussions!inner(
        id,
        course_id,
        created_by
      )
    `)
    .eq('id', postId)
    .single()

  if (postError || !post) {
    return res.status(404).json({ error: 'Post not found' })
  }

  // Check permissions
  if (userRole === 'teacher') {
    // Teacher can delete any post in their discussion
    if (post.discussions.created_by !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  } else if (userRole === 'student') {
    // Student can only delete their own posts
    if (post.author_email !== userEmail) {
      return res.status(403).json({ error: 'Access denied' })
    }
  }

  // Delete post
  const { error: deleteError } = await supabaseAdmin
    .from('discussion_posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message })
  }

  res.json({ success: true })
}))

// Get discussion statistics (teacher only)
router.get('/:discussionId/stats', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { discussionId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get discussion
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('*')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Check if teacher owns the discussion
  if (discussion.created_by !== userEmail) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Get all posts for this discussion
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('discussion_posts')
    .select('*')
    .eq('discussion_id', discussionId)

  if (postsError) {
    return res.status(500).json({ error: postsError.message })
  }

  // Calculate statistics
  const totalPosts = posts?.length || 0
  const approvedPosts = posts?.filter(p => p.is_approved).length || 0
  const pendingPosts = posts?.filter(p => !p.is_approved).length || 0
  const teacherPosts = posts?.filter(p => p.author_role === 'teacher').length || 0
  const studentPosts = posts?.filter(p => p.author_role === 'student').length || 0

  // Get unique participants
  const participants = [...new Set(posts?.map(p => p.author_email) || [])]
  const uniqueParticipants = participants.length

  const stats = {
    discussion,
    total_posts: totalPosts,
    approved_posts: approvedPosts,
    pending_posts: pendingPosts,
    teacher_posts: teacherPosts,
    student_posts: studentPosts,
    unique_participants: uniqueParticipants,
    participation_rate: uniqueParticipants > 0 ? Math.round((uniqueParticipants / 100) * 100) : 0
  }

  res.json(stats)
}))

export default router
