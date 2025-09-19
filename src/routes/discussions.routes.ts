import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// Get discussions for a course
router.get('/course/:courseId', requireAuth, asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Check if user has access to this course
    if (userRole === 'student') {
      // Check if student is enrolled in this course
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_email', userEmail)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - Not enrolled in this course' })
      }
    } else if (userRole === 'teacher') {
      // Check if teacher owns this course
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('teacher_email', userEmail)
        .single()

      if (courseError || !course) {
        return res.status(403).json({ error: 'Access denied - Not your course' })
      }
    }

    // Get discussions for the course
    const { data: discussions, error } = await supabaseAdmin
      .from('discussions')
      .select(`
        *,
        courses!inner(
          id,
          title,
          teacher_email,
          teacher_name
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching discussions:', error)
      return res.status(500).json({ error: 'Failed to fetch discussions' })
    }

    res.json(discussions || [])
  } catch (error) {
    console.error('Error in get course discussions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get a specific discussion with posts
router.get('/:discussionId', requireAuth, asyncHandler(async (req, res) => {
  const { discussionId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Get discussion details
    const { data: discussion, error: discussionError } = await supabaseAdmin
      .from('discussions')
      .select(`
        *,
        courses!inner(
          id,
          title,
          teacher_email,
          teacher_name
        )
      `)
      .eq('id', discussionId)
      .single()

    if (discussionError || !discussion) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_email', userEmail)
        .eq('course_id', discussion.course_id)
        .eq('status', 'active')
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - Not enrolled in this course' })
      }
    } else if (userRole === 'teacher') {
      if (discussion.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied - Not your course' })
      }
    }

    // Get posts for this discussion
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('discussion_posts')
      .select(`
        *,
        students!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('discussion_id', discussionId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })

    // Transform the data to match frontend expectations
    const transformedPosts = posts?.map(post => ({
      ...post,
      author_email: post.students?.email || post.created_by,
      author_name: post.students ? `${post.students.first_name} ${post.students.last_name}`.trim() : null,
      author_role: 'student'
    })) || []

    if (postsError) {
      console.error('Error fetching discussion posts:', postsError)
      return res.status(500).json({ error: 'Failed to fetch discussion posts' })
    }

    res.json({
      discussion,
      posts: transformedPosts
    })
  } catch (error) {
    console.error('Error in get discussion:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Create a new discussion post
router.post('/:discussionId/posts', requireAuth, asyncHandler(async (req, res) => {
  const { discussionId } = req.params
  const { content } = req.body
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' })
  }

  try {
    // Get discussion details to check access
    const { data: discussion, error: discussionError } = await supabaseAdmin
      .from('discussions')
      .select(`
        *,
        courses!inner(
          id,
          teacher_email
        )
      `)
      .eq('id', discussionId)
      .single()

    if (discussionError || !discussion) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_email', userEmail)
        .eq('course_id', discussion.course_id)
        .eq('status', 'active')
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - Not enrolled in this course' })
      }
    } else if (userRole === 'teacher') {
      if (discussion.courses.teacher_email !== userEmail) {
        return res.status(403).json({ error: 'Access denied - Not your course' })
      }
    }

    // Get student details for the post
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('email', userEmail)
      .single()

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    // Create the post
    const { data: post, error: postError } = await supabaseAdmin
      .from('discussion_posts')
      .insert({
        discussion_id: discussionId,
        student_id: student.id,
        content: content.trim(),
        is_approved: userRole === 'teacher' || !discussion.require_approval
      })
      .select(`
        *,
        students!inner(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (postError) {
      console.error('Error creating discussion post:', postError)
      return res.status(500).json({ error: 'Failed to create post' })
    }

    res.json(post)
  } catch (error) {
    console.error('Error in create discussion post:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Like a discussion
router.post('/:discussionId/like', requireAuth, asyncHandler(async (req, res) => {
  const { discussionId } = req.params
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role

  try {
    // Check if user has access to this discussion
    const { data: discussion, error: discussionError } = await supabaseAdmin
      .from('discussions')
      .select(`
        *,
        courses!inner(
          id,
          teacher_email
        )
      `)
      .eq('id', discussionId)
      .single()

    if (discussionError || !discussion) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Check access permissions
    if (userRole === 'student') {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_email', userEmail)
        .eq('course_id', discussion.course_id)
        .eq('status', 'active')
        .single()

      if (enrollmentError || !enrollment) {
        return res.status(403).json({ error: 'Access denied - Not enrolled in this course' })
      }
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student profile not found' })
    }

    // Check if already liked
    const { data: existingLike, error: likeError } = await supabaseAdmin
      .from('discussion_likes')
      .select('id')
      .eq('discussion_id', discussionId)
      .eq('student_id', student.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabaseAdmin
        .from('discussion_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return res.status(500).json({ error: 'Failed to remove like' })
      }

      res.json({ liked: false })
    } else {
      // Like
      const { error: insertError } = await supabaseAdmin
        .from('discussion_likes')
        .insert({
          discussion_id: discussionId,
          student_id: student.id
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return res.status(500).json({ error: 'Failed to add like' })
      }

      res.json({ liked: true })
    }
  } catch (error) {
    console.error('Error in like discussion:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))