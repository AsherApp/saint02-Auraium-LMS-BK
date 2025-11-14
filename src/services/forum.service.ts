import { supabaseAdmin } from '../lib/supabase.js'
import { getSocketServer } from '../lib/socket.io.js'

type Visibility = 'course' | 'institution' | 'public'

interface CategoryFilters {
  contextType?: string
  contextId?: string
  includeLocked?: boolean
}

interface ThreadFilters {
  categoryId: string
  includeLocked?: boolean
}

export interface CreateCategoryInput {
  title: string
  description?: string
  contextType?: string
  contextId?: string
  visibility?: Visibility
  metadata?: Record<string, any>
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  isLocked?: boolean
}

export interface CreateThreadInput {
  categoryId: string
  title: string
  content: string
  richContent?: Record<string, any>
  contextType?: string
  contextId?: string
  metadata?: Record<string, any>
  subscribe?: boolean
}

export interface UpdateThreadInput {
  title?: string
  content?: string
  richContent?: Record<string, any>
  metadata?: Record<string, any>
}

export interface CreatePostInput {
  content: string
  richContent?: Record<string, any>
  parentPostId?: string
}

export interface UpdatePostInput {
  content?: string
  richContent?: Record<string, any>
}

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

function sanitizeArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : []
}

export class ForumService {
  private static emitEvent(event: string, payload: Record<string, any>) {
    const io = getSocketServer()
    if (!io) return
    io.emit(event, payload)
  }

  static async listCategories(filters: CategoryFilters = {}) {
    let query = supabaseAdmin.from('forum_categories').select('*')

    if (filters.contextType) {
      query = query.eq('context_type', filters.contextType)
    }

    if (filters.contextId) {
      query = query.eq('context_id', filters.contextId)
    }

    if (!filters.includeLocked) {
      query = query.eq('is_locked', false)
    }

    query = query.order('order_index', { ascending: true }).order('created_at', {
      ascending: true
    })

    const { data, error } = await query
    if (error) {
      console.error('Error listing forum categories:', error)
      throw createHttpError(500, 'failed_to_list_forum_categories')
    }

    return sanitizeArray(data)
  }

  static async createCategory(authorEmail: string, payload: CreateCategoryInput) {
    const { data, error } = await supabaseAdmin
      .from('forum_categories')
      .insert({
        title: payload.title,
        description: payload.description || null,
        context_type: payload.contextType || null,
        context_id: payload.contextId || null,
        visibility: payload.visibility || 'course',
        created_by: authorEmail,
        metadata: payload.metadata || {}
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('Error creating forum category:', error)
      throw createHttpError(500, 'failed_to_create_forum_category')
    }

    this.emitEvent('forum:category_created', { categoryId: data.id })
    return data
  }

  static async updateCategory(
    categoryId: string,
    actorEmail: string,
    payload: UpdateCategoryInput
  ) {
    await this.assertCategoryOwner(categoryId, actorEmail)

    const updates: Record<string, any> = {}
    if (payload.title !== undefined) updates.title = payload.title
    if (payload.description !== undefined) updates.description = payload.description
    if (payload.contextType !== undefined) updates.context_type = payload.contextType
    if (payload.contextId !== undefined) updates.context_id = payload.contextId
    if (payload.visibility !== undefined) updates.visibility = payload.visibility
    if (payload.metadata !== undefined) updates.metadata = payload.metadata
    if (payload.isLocked !== undefined) updates.is_locked = payload.isLocked

    if (Object.keys(updates).length === 0) {
      return this.getCategory(categoryId)
    }

    const { error } = await supabaseAdmin
      .from('forum_categories')
      .update(updates)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating forum category:', error)
      throw createHttpError(500, 'failed_to_update_forum_category')
    }

    const category = await this.getCategory(categoryId)
    if (category) {
      this.emitEvent('forum:category_updated', { categoryId })
    }
    return category
  }

  static async deleteCategory(categoryId: string, actorEmail: string) {
    await this.assertCategoryOwner(categoryId, actorEmail)

    const { error } = await supabaseAdmin
      .from('forum_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting forum category:', error)
      throw createHttpError(500, 'failed_to_delete_forum_category')
    }

    this.emitEvent('forum:category_deleted', { categoryId })
    return { success: true }
  }

  static async listThreads(filters: ThreadFilters) {
    const { categoryId, includeLocked } = filters

    let query = supabaseAdmin
      .from('forum_recent_threads')
      .select('*')
      .eq('category_id', categoryId)

    if (!includeLocked) {
      query = query.eq('is_locked', false)
    }

    query = query.order('is_pinned', { ascending: false }).order('last_activity_at', {
      ascending: false
    })

    const { data, error } = await query

    if (error) {
      console.error('Error listing forum threads:', error)
      throw createHttpError(500, 'failed_to_list_forum_threads')
    }

    return sanitizeArray(data)
  }

  static async createThread(authorEmail: string, payload: CreateThreadInput) {
    const { data: thread, error } = await supabaseAdmin
      .from('forum_threads')
      .insert({
        category_id: payload.categoryId,
        title: payload.title,
        author_email: authorEmail,
        content: payload.content,
        rich_content: payload.richContent || {},
        context_type: payload.contextType || null,
        context_id: payload.contextId || null,
        metadata: payload.metadata || {}
      })
      .select('*')
      .single()

    if (error || !thread) {
      console.error('Error creating forum thread:', error)
      throw createHttpError(500, 'failed_to_create_forum_thread')
    }

    if (payload.subscribe) {
      await supabaseAdmin
        .from('forum_thread_subscriptions')
        .insert({
          thread_id: thread.id,
          user_email: authorEmail,
          notify: true
        })
        .single()
    }

    this.emitEvent('forum:thread_created', { categoryId: payload.categoryId, threadId: thread.id })
    return this.getThreadDetail(thread.id, authorEmail)
  }

  static async getThreadDetail(threadId: string, userEmail?: string) {
    const { data: thread, error } = await supabaseAdmin
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (error || !thread) {
      throw createHttpError(404, 'forum_thread_not_found')
    }

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('forum_posts')
      .select('*, reactions:forum_post_reactions(*)')
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (postsError) {
      console.error('Error fetching forum posts:', postsError)
      throw createHttpError(500, 'failed_to_fetch_forum_posts')
    }

    let subscription: any = null
    if (userEmail) {
      const { data: sub } = await supabaseAdmin
        .from('forum_thread_subscriptions')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_email', userEmail)
        .single()
      subscription = sub || null
    }

    return {
      thread,
      posts: sanitizeArray(posts),
      subscription
    }
  }

  static async updateThread(threadId: string, actorEmail: string, payload: UpdateThreadInput) {
    const { thread } = await this.assertThreadAccess(threadId, actorEmail)

    const updates: Record<string, any> = {}
    if (payload.title !== undefined) updates.title = payload.title
    if (payload.content !== undefined) updates.content = payload.content
    if (payload.richContent !== undefined) updates.rich_content = payload.richContent
    if (payload.metadata !== undefined) updates.metadata = payload.metadata

    if (!Object.keys(updates).length) {
      return this.getThreadDetail(threadId, actorEmail)
    }

    const { error } = await supabaseAdmin
      .from('forum_threads')
      .update(updates)
      .eq('id', threadId)

    if (error) {
      console.error('Error updating forum thread:', error)
      throw createHttpError(500, 'failed_to_update_forum_thread')
    }

    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:thread_updated', { categoryId: thread.category_id, threadId })
    return detail
  }

  static async deleteThread(threadId: string, actorEmail: string) {
    await this.assertThreadAccess(threadId, actorEmail)

    const { error } = await supabaseAdmin
      .from('forum_threads')
      .delete()
      .eq('id', threadId)

    if (error) {
      console.error('Error deleting forum thread:', error)
      throw createHttpError(500, 'failed_to_delete_forum_thread')
    }

    this.emitEvent('forum:thread_deleted', { threadId })
    return { success: true }
  }

  static async addPost(threadId: string, actorEmail: string, payload: CreatePostInput) {
    const { thread } = await this.assertThreadAccess(threadId, actorEmail)

    if (thread.is_locked) {
      throw createHttpError(400, 'thread_locked')
    }

    const { data: post, error } = await supabaseAdmin
      .from('forum_posts')
      .insert({
        thread_id: threadId,
        author_email: actorEmail,
        parent_post_id: payload.parentPostId || null,
        content: payload.content,
        rich_content: payload.richContent || {}
      })
      .select('*')
      .single()

    if (error || !post) {
      console.error('Error creating forum post:', error)
      throw createHttpError(500, 'failed_to_create_forum_post')
    }

    this.emitEvent('forum:post_created', { threadId, postId: post.id })
    return this.getThreadDetail(threadId, actorEmail)
  }

  static async updatePost(threadId: string, postId: string, actorEmail: string, payload: UpdatePostInput) {
    await this.assertThreadAccess(threadId, actorEmail)

    const { data: post, error } = await supabaseAdmin
      .from('forum_posts')
      .select('author_email')
      .eq('id', postId)
      .eq('thread_id', threadId)
      .single()

    if (error || !post) {
      throw createHttpError(404, 'forum_post_not_found')
    }

    if (post.author_email !== actorEmail) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const updates: Record<string, any> = {}
    if (payload.content !== undefined) updates.content = payload.content
    if (payload.richContent !== undefined) updates.rich_content = payload.richContent
    updates.edited_at = new Date().toISOString()

    const { error: updateError } = await supabaseAdmin
      .from('forum_posts')
      .update(updates)
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating forum post:', updateError)
      throw createHttpError(500, 'failed_to_update_forum_post')
    }

    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:post_updated', { threadId, postId })
    return detail
  }

  static async deletePost(threadId: string, postId: string, actorEmail: string) {
    await this.assertThreadAccess(threadId, actorEmail)

    const { data: post, error } = await supabaseAdmin
      .from('forum_posts')
      .select('author_email')
      .eq('id', postId)
      .eq('thread_id', threadId)
      .single()

    if (error || !post) {
      throw createHttpError(404, 'forum_post_not_found')
    }

    if (post.author_email !== actorEmail) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const { error: deleteError } = await supabaseAdmin
      .from('forum_posts')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', postId)

    if (deleteError) {
      console.error('Error deleting forum post:', deleteError)
      throw createHttpError(500, 'failed_to_delete_forum_post')
    }

    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:post_deleted', { threadId, postId })
    return detail
  }

  static async pinThread(threadId: string, actorEmail: string) {
    await this.assertThreadModerationRights(threadId, actorEmail)
    const { error } = await supabaseAdmin
      .from('forum_threads')
      .update({ is_pinned: true })
      .eq('id', threadId)

    if (error) {
      console.error('Error pinning forum thread:', error)
      throw createHttpError(500, 'failed_to_pin_forum_thread')
    }
    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:thread_updated', { categoryId: detail.thread.category_id, threadId })
    return detail
  }

  static async unpinThread(threadId: string, actorEmail: string) {
    await this.assertThreadModerationRights(threadId, actorEmail)

    const { error } = await supabaseAdmin
      .from('forum_threads')
      .update({ is_pinned: false })
      .eq('id', threadId)

    if (error) {
      console.error('Error unpinning forum thread:', error)
      throw createHttpError(500, 'failed_to_unpin_forum_thread')
    }

    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:thread_updated', { categoryId: detail.thread.category_id, threadId })
    return detail
  }

  static async lockThread(threadId: string, actorEmail: string) {
    await this.assertThreadModerationRights(threadId, actorEmail)
    const { error } = await supabaseAdmin
      .from('forum_threads')
      .update({ is_locked: true })
      .eq('id', threadId)

    if (error) {
      console.error('Error locking forum thread:', error)
      throw createHttpError(500, 'failed_to_lock_forum_thread')
    }
    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:thread_updated', { categoryId: detail.thread.category_id, threadId })
    return detail
  }

  static async unlockThread(threadId: string, actorEmail: string) {
    await this.assertThreadModerationRights(threadId, actorEmail)
    const { error } = await supabaseAdmin
      .from('forum_threads')
      .update({ is_locked: false })
      .eq('id', threadId)

    if (error) {
      console.error('Error unlocking forum thread:', error)
      throw createHttpError(500, 'failed_to_unlock_forum_thread')
    }
    const detail = await this.getThreadDetail(threadId, actorEmail)
    this.emitEvent('forum:thread_updated', { categoryId: detail.thread.category_id, threadId })
    return detail
  }

  static async subscribe(threadId: string, userEmail: string) {
    const { data: subscription, error } = await supabaseAdmin
      .from('forum_thread_subscriptions')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_email', userEmail)
      .single()

    if (error || !subscription) {
      await supabaseAdmin
        .from('forum_thread_subscriptions')
        .insert({
          thread_id: threadId,
          user_email: userEmail,
          notify: true
        })
        .single()
    }

    this.emitEvent('forum:subscription_changed', { threadId, userEmail, subscribed: true })
    return subscription
  }

  static async unsubscribe(threadId: string, userEmail: string) {
    await supabaseAdmin
      .from('forum_thread_subscriptions')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_email', userEmail)
    this.emitEvent('forum:subscription_changed', { threadId, userEmail, subscribed: false })
    return { success: true }
  }

  private static async getCategory(categoryId: string) {
    const { data, error } = await supabaseAdmin
      .from('forum_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error || !data) {
      throw createHttpError(404, 'forum_category_not_found')
    }

    return data
  }

  private static async assertCategoryOwner(categoryId: string, actorEmail: string) {
    const category = await this.getCategory(categoryId)
    if (category.created_by !== actorEmail) {
      throw createHttpError(403, 'insufficient_permissions')
    }
    return category
  }

  private static async assertThreadAccess(threadId: string, actorEmail: string) {
    const { data: thread, error } = await supabaseAdmin
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (error || !thread) {
      throw createHttpError(404, 'forum_thread_not_found')
    }

    if (thread.author_email !== actorEmail) {
      const hasModeratorRights = await this.hasModeratorRights(threadId, actorEmail)
      if (!hasModeratorRights) {
        throw createHttpError(403, 'insufficient_permissions')
      }
    }

    return { thread }
  }

  private static async assertThreadModerationRights(threadId: string, actorEmail: string) {
    const hasModeratorRights = await this.hasModeratorRights(threadId, actorEmail)
    if (!hasModeratorRights) {
      throw createHttpError(403, 'insufficient_permissions')
    }
  }

  private static async hasModeratorRights(threadId: string, actorEmail: string) {
    const { data: thread } = await supabaseAdmin
      .from('forum_threads')
      .select('category_id, context_type, context_id')
      .eq('id', threadId)
      .single()

    if (!thread) return false

    const { data: category } = await supabaseAdmin
      .from('forum_categories')
      .select('created_by, context_type, context_id')
      .eq('id', thread.category_id)
      .single()

    if (category?.created_by === actorEmail) {
      return true
    }

    if (category?.context_type === 'course' || thread.context_type === 'course') {
      const courseId = category?.context_id || thread.context_id
      if (!courseId) return false

      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('teacher_email')
        .eq('id', courseId)
        .single()

      return course?.teacher_email === actorEmail
    }

    return false
  }
}

