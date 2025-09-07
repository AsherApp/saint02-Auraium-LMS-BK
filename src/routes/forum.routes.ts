import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'

export const router = Router()

// ===== FORUM CATEGORIES ENDPOINTS =====

// Get all forum categories
router.get('/categories', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get categories from forum_categories table
  const { data: categories, error } = await supabaseAdmin
    .from('forum_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Transform data to match frontend expectations
  const transformedCategories = (categories || []).map(category => ({
    id: category.id,
    name: category.name,
    description: category.description || '',
    color: '#3b82f6', // Default blue color
    icon: 'message-circle' // Default icon
  }))

  res.json(transformedCategories)
}))

// Create a new forum category (admin/teacher only)
router.post('/categories', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { name, description } = req.body
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (!name) {
    return res.status(400).json({ error: 'name is required' })
  }

  const { data, error } = await supabaseAdmin
    .from('forum_categories')
    .insert({
      name,
      description,
      is_active: true,
      created_by: userEmail
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// ===== FORUM DISCUSSIONS ENDPOINTS =====

// Get forum discussions with pagination
router.get('/posts', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { categoryId, page = 1, limit = 20 } = req.query
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const offset = (Number(page) - 1) * Number(limit)
  
  let query = supabaseAdmin
    .from('discussions')
    .select('*', { count: 'exact' })

  if (categoryId) {
    query = query.eq('course_id', categoryId)
  }

  const { data: discussions, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Get user profile information for each discussion creator
  const transformedPosts = await Promise.all((discussions || []).map(async (discussion) => {
    // Get user profile from user_profiles view
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', discussion.created_by)
      .single()

    return {
      id: discussion.id,
      categoryId: discussion.course_id,
      title: discussion.title,
      content: discussion.description || '',
      authorEmail: discussion.created_by,
      authorName: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : discussion.created_by?.split('@')[0] || 'Unknown',
      isPinned: false, // Not available in current schema
      isLocked: false, // Not available in current schema
      replyCount: 0, // We'll calculate this later
      viewCount: 0, // Not available in current schema
      lastReplyAt: discussion.updated_at,
      createdAt: discussion.created_at,
      updatedAt: discussion.updated_at
    }
  }))

  res.json({
    posts: transformedPosts,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  })
}))

// Create a new forum discussion
router.post('/posts', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { categoryId, title, content } = req.body
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (!categoryId || !title || !content) {
    return res.status(400).json({ error: 'categoryId, title, and content are required' })
  }

  const { data, error } = await supabaseAdmin
    .from('discussions')
    .insert({
      category_id: categoryId,
      title,
      content,
      created_by: userEmail,
      is_pinned: false,
      is_locked: false,
      view_count: 0
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// Get a specific forum discussion
router.get('/posts/:discussionId', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { discussionId } = req.params
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: discussion, error } = await supabaseAdmin
    .from('discussions')
    .select(`
      *,
      category:forum_categories(name),
      posts:discussion_posts(count)
    `)
    .eq('id', discussionId)
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Increment view count
  await supabaseAdmin
    .from('discussions')
    .update({ view_count: (discussion.view_count || 0) + 1 })
    .eq('id', discussionId)

  // Get user profile information for the discussion creator
  const { data: userProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('first_name, last_name, email')
    .eq('email', discussion.created_by)
    .single()

  // Transform data to match frontend expectations
  const transformedPost = {
    id: discussion.id,
    categoryId: discussion.category_id,
    title: discussion.title,
    content: discussion.content,
    authorEmail: discussion.created_by,
    authorName: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : discussion.created_by?.split('@')[0] || 'Unknown',
    isPinned: discussion.is_pinned,
    isLocked: discussion.is_locked,
    replyCount: discussion.posts?.[0]?.count || 0,
    viewCount: discussion.view_count || 0,
    lastReplyAt: discussion.last_reply_at,
    createdAt: discussion.created_at,
    updatedAt: discussion.updated_at
  }

  res.json(transformedPost)
}))

// ===== FORUM REPLIES ENDPOINTS =====

// Get replies for a discussion
router.get('/posts/:discussionId/replies', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { discussionId } = req.params
  const { page = 1, limit = 20 } = req.query
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const offset = (Number(page) - 1) * Number(limit)

  const { data: posts, error, count } = await supabaseAdmin
    .from('discussion_posts')
    .select('*', { count: 'exact' })
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true })
    .range(offset, offset + Number(limit) - 1)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Get user profile information for each reply author
  const transformedReplies = await Promise.all((posts || []).map(async (post) => {
    // Get user profile from user_profiles view
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('email', post.author_email)
      .single()

    return {
      id: post.id,
      postId: post.discussion_id,
      content: post.content,
      authorEmail: post.author_email,
      authorName: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : post.author_email?.split('@')[0] || 'Unknown',
      createdAt: post.created_at,
      updatedAt: post.updated_at
    }
  }))

  res.json({
    replies: transformedReplies,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  })
}))

// Create a reply to a discussion
router.post('/posts/:discussionId/replies', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const { discussionId } = req.params
  const { content } = req.body
  
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  if (!content) {
    return res.status(400).json({ error: 'content is required' })
  }

  // Check if discussion exists and is not locked
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('is_locked')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  if (discussion.is_locked) {
    return res.status(403).json({ error: 'Discussion is locked' })
  }

  const { data, error } = await supabaseAdmin
    .from('discussion_posts')
    .insert({
      discussion_id: discussionId,
      content,
      created_by: userEmail
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Update discussion's last_reply_at
  await supabaseAdmin
    .from('discussions')
    .update({ last_reply_at: new Date().toISOString() })
    .eq('id', discussionId)

  res.json(data)
}))

// ===== FORUM DISCUSSION MODERATION ENDPOINTS =====

// Toggle pin status of a discussion (teacher only)
router.patch('/posts/:discussionId/pin', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { discussionId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get current discussion status
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('is_pinned')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Toggle pin status
  const { data, error } = await supabaseAdmin
    .from('discussions')
    .update({ is_pinned: !discussion.is_pinned })
    .eq('id', discussionId)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))

// Toggle lock status of a discussion (teacher only)
router.patch('/posts/:discussionId/lock', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  const { discussionId } = req.params
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get current discussion status
  const { data: discussion, error: discussionError } = await supabaseAdmin
    .from('discussions')
    .select('is_locked')
    .eq('id', discussionId)
    .single()

  if (discussionError || !discussion) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Toggle lock status
  const { data, error } = await supabaseAdmin
    .from('discussions')
    .update({ is_locked: !discussion.is_locked })
    .eq('id', discussionId)
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
}))
