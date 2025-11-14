import { supabaseAdmin } from '../lib/supabase.js'
import { getSocketServer } from '../lib/socket.io.js'

type DiscussionVisibility = 'private' | 'course' | 'institution'
type DiscussionType =
  | 'direct'
  | 'course'
  | 'study_group_student'
  | 'study_group_course'
  | 'forum_bridge'

type ParticipantRole = 'owner' | 'moderator' | 'participant' | 'leader' | 'co_leader'

export interface DiscussionFilters {
  discussionType?: DiscussionType
  visibility?: DiscussionVisibility
  contextType?: string
  contextId?: string
  studyGroup?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface CreateDiscussionInput {
  title: string
  description?: string
  discussionType: DiscussionType
  visibility?: DiscussionVisibility
  contextType?: string
  contextId?: string
  metadata?: Record<string, any>
  participants?: Array<{
    email: string
    role?: ParticipantRole
  }>
  initialMessage?: {
    content: string
    richContent?: Record<string, any>
    mentions?: string[]
    attachments?: DiscussionAttachmentInput[]
  }
}

export interface DiscussionAttachmentInput {
  fileUrl: string
  fileName?: string
  fileType?: string
  fileSize?: number
  metadata?: Record<string, any>
}

export interface CreatePostInput {
  content: string
  richContent?: Record<string, any>
  parentPostId?: string
  mentions?: string[]
  attachments?: DiscussionAttachmentInput[]
}

export interface UpdateDiscussionInput {
  title?: string
  description?: string
  visibility?: DiscussionVisibility
  isArchived?: boolean
  metadata?: Record<string, any>
  allowTeacherOverride?: boolean
}

export interface UpdatePostInput {
  content?: string
  richContent?: Record<string, any>
  mentions?: string[]
}

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

function sanitizeArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : []
}

export class DiscussionService {
  static async listDiscussions(userEmail: string, filters: DiscussionFilters = {}) {
    if (!userEmail) {
      throw createHttpError(401, 'user_email_required')
    }

    const limit = Math.min(filters.limit ?? 50, 100)
    const offset = filters.offset ?? 0

    let query = supabaseAdmin
      .from('discussion_inbox_summary')
      .select('*')
      .eq('user_email', userEmail)

    if (filters.discussionType) {
      query = query.eq('discussion_type', filters.discussionType)
    }

    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility)
    }

    if (filters.contextType) {
      query = query.eq('context_type', filters.contextType)
    }

    if (filters.contextId) {
      query = query.eq('context_id', filters.contextId)
    }

    if (filters.studyGroup) {
      query = query.in('discussion_type', ['study_group_student', 'study_group_course'])
    }

    if (filters.search) {
      const searchValue = filters.search.trim()
      if (searchValue) {
        query = query.ilike('title', `%${searchValue}%`)
      }
    }

    query = query
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error listing discussions:', error)
      throw createHttpError(500, 'failed_to_list_discussions')
    }

    return sanitizeArray(data)
  }

  static async getDiscussionDetail(discussionId: string, userEmail: string) {
    const { discussion } = await this.assertAccess(discussionId, userEmail)

    const [{ data: participants, error: participantsError }, { data: posts, error: postsError }] =
      await Promise.all([
        supabaseAdmin
          .from('discussion_participants')
          .select('*')
          .eq('discussion_id', discussionId)
          .order('participant_role', { ascending: true })
          .order('joined_at', { ascending: true }),
        supabaseAdmin
          .from('discussion_posts')
          .select(
            '*, attachments:discussion_attachments(*), reactions:discussion_post_reactions(*)'
          )
          .eq('discussion_id', discussionId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
      ])

    if (participantsError) {
      console.error('Error fetching discussion participants:', participantsError)
      throw createHttpError(500, 'failed_to_fetch_participants')
    }

    if (postsError) {
      console.error('Error fetching discussion posts:', postsError)
      throw createHttpError(500, 'failed_to_fetch_posts')
    }

    return {
      discussion,
      participants: sanitizeArray(participants),
      posts: sanitizeArray(posts)
    }
  }

  static async createDiscussion(
    ownerEmail: string,
    ownerRole: string,
    payload: CreateDiscussionInput
  ) {
    if (!ownerEmail) {
      throw createHttpError(401, 'user_email_required')
    }

    let contextSnapshot: Record<string, any> | null = null

    if (payload.contextType === 'course' && payload.contextId) {
      const { data: courseInfo, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('id', payload.contextId)
        .single()

      if (courseError) {
        console.error('Failed to fetch course for discussion context snapshot:', courseError)
      } else if (courseInfo) {
        contextSnapshot = {
          id: courseInfo.id,
          title: courseInfo.title
        }
        payload.metadata = payload.metadata || {}
        if (!payload.metadata.contextTitle && courseInfo.title) {
          payload.metadata.contextTitle = courseInfo.title
        }
      }
    }

    const { data: discussion, error } = await supabaseAdmin
      .from('discussions')
      .insert({
        title: payload.title,
        description: payload.description || null,
        owner_email: ownerEmail,
        owner_role: ownerRole,
        discussion_type: payload.discussionType,
        visibility: payload.visibility || 'private',
        context_type: payload.contextType || null,
        context_id: payload.contextId || null,
        context_snapshot: contextSnapshot,
        metadata: payload.metadata || {}
      })
      .select('*')
      .single()

    if (error || !discussion) {
      console.error('Error creating discussion:', error)
      throw createHttpError(500, 'failed_to_create_discussion')
    }

    await this.syncParticipantsAfterCreation(discussion.id, ownerEmail, ownerRole, payload.participants)

    if (payload.initialMessage?.content) {
      await this.addPost(discussion.id, ownerEmail, {
        content: payload.initialMessage.content,
        richContent: payload.initialMessage.richContent,
        mentions: payload.initialMessage.mentions,
        attachments: payload.initialMessage.attachments
      })
    }

    const detail = await this.getDiscussionDetail(discussion.id, ownerEmail)
    this.emitEvent('discussion:created', { discussionId: discussion.id })
    return detail
  }

  static async updateDiscussion(
    discussionId: string,
    userEmail: string,
    payload: UpdateDiscussionInput
  ) {
    const { discussion, participant } = await this.assertAccess(discussionId, userEmail)

    const isOwner = discussion.owner_email === userEmail
    const isModerator =
      participant?.participant_role &&
      ['owner', 'moderator', 'leader', 'co_leader'].includes(participant.participant_role)

    if (!isOwner && !isModerator) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const updates: Record<string, any> = {}

    if (payload.title !== undefined) updates.title = payload.title
    if (payload.description !== undefined) updates.description = payload.description
    if (payload.visibility !== undefined) updates.visibility = payload.visibility
    if (payload.isArchived !== undefined) updates.is_archived = payload.isArchived
    if (payload.metadata !== undefined) updates.metadata = payload.metadata
    if (payload.allowTeacherOverride !== undefined) {
      updates.allow_teacher_override = payload.allowTeacherOverride
    }

    if (Object.keys(updates).length === 0) {
      return this.getDiscussionDetail(discussionId, userEmail)
    }

    const { error } = await supabaseAdmin
      .from('discussions')
      .update(updates)
      .eq('id', discussionId)

    if (error) {
      console.error('Error updating discussion:', error)
      throw createHttpError(500, 'failed_to_update_discussion')
    }

    const detail = await this.getDiscussionDetail(discussionId, userEmail)
    this.emitEvent('discussion:updated', { discussionId })
    return detail
  }

  static async addParticipants(
    discussionId: string,
    actorEmail: string,
    participants: Array<{ email: string; role?: ParticipantRole }>
  ) {
    const { discussion, participant } = await this.assertAccess(discussionId, actorEmail)

    const isOwner = discussion.owner_email === actorEmail
    const isModerator =
      participant?.participant_role &&
      ['owner', 'moderator', 'leader', 'co_leader'].includes(participant.participant_role)

    if (!isOwner && !isModerator) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const incomingParticipants = sanitizeArray(participants)
      .map((participant) => ({
        email: participant.email.toLowerCase(),
        role: participant.role || 'participant'
      }))
      .filter((participant) => participant.email !== actorEmail)

    if (!incomingParticipants.length) {
      return this.getDiscussionDetail(discussionId, actorEmail)
    }

    const { data: existingParticipants, error: existingError } = await supabaseAdmin
      .from('discussion_participants')
      .select('user_email')
      .eq('discussion_id', discussionId)

    if (existingError) {
      console.error('Error checking existing participants:', existingError)
      throw createHttpError(500, 'failed_to_update_participants')
    }

    const existingEmails = new Set(
      sanitizeArray(existingParticipants).map((participant) => participant.user_email.toLowerCase())
    )

    const participantsToInsert = incomingParticipants.filter(
      (participant) => !existingEmails.has(participant.email)
    )

    if (participantsToInsert.length) {
      const { error: insertError } = await supabaseAdmin.from('discussion_participants').insert(
        participantsToInsert.map((participant) => ({
          discussion_id: discussionId,
          user_email: participant.email,
          user_role: participant.role === 'owner' ? 'teacher' : null,
          participant_role: participant.role,
          status: 'active'
        }))
      )

      if (insertError) {
        console.error('Error inserting participants:', insertError)
        throw createHttpError(500, 'failed_to_update_participants')
      }
    }

    const detail = await this.getDiscussionDetail(discussionId, actorEmail)
    this.emitEvent('discussion:updated', { discussionId })
    return detail
  }

  static async addPost(
    discussionId: string,
    authorEmail: string,
    payload: CreatePostInput
  ) {
    await this.assertAccess(discussionId, authorEmail)

    const { data: post, error } = await supabaseAdmin
      .from('discussion_posts')
      .insert({
        discussion_id: discussionId,
        author_email: authorEmail,
        parent_post_id: payload.parentPostId || null,
        content: payload.content,
        rich_content: payload.richContent || {},
        mentions: sanitizeArray(payload.mentions)
      })
      .select('*')
      .single()

    if (error || !post) {
      console.error('Error creating discussion post:', error)
      throw createHttpError(500, 'failed_to_create_post')
    }

    const attachments = sanitizeArray(payload.attachments)
    if (attachments.length) {
      const attachmentRows = attachments.map((attachment) => ({
        post_id: post.id,
        file_url: attachment.fileUrl,
        file_name: attachment.fileName || null,
        file_type: attachment.fileType || null,
        file_size: attachment.fileSize || null,
        metadata: attachment.metadata || {}
      }))

      const { error: attachmentError } = await supabaseAdmin
        .from('discussion_attachments')
        .insert(attachmentRows)

      if (attachmentError) {
        console.error('Error inserting attachments:', attachmentError)
        throw createHttpError(500, 'failed_to_create_post')
      }
    }

    await this.incrementUnreadCounts(discussionId, authorEmail)

    const detail = await this.getDiscussionDetail(discussionId, authorEmail)
    this.emitEvent('discussion:post_created', { discussionId, postId: post.id })
    return detail
  }

  static async updatePost(
    discussionId: string,
    postId: string,
    userEmail: string,
    payload: UpdatePostInput
  ) {
    const { participant } = await this.assertAccess(discussionId, userEmail)

    const { data: post, error } = await supabaseAdmin
      .from('discussion_posts')
      .select('author_email')
      .eq('id', postId)
      .eq('discussion_id', discussionId)
      .single()

    if (error || !post) {
      throw createHttpError(404, 'post_not_found')
    }

    const isAuthor = post.author_email === userEmail
    const isModerator =
      participant?.participant_role &&
      ['owner', 'moderator', 'leader', 'co_leader'].includes(participant.participant_role)

    if (!isAuthor && !isModerator) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const updates: Record<string, any> = {}

    if (payload.content !== undefined) updates.content = payload.content
    if (payload.richContent !== undefined) updates.rich_content = payload.richContent
    if (payload.mentions !== undefined) updates.mentions = payload.mentions

    updates.edited_at = new Date().toISOString()

    const { error: updateError } = await supabaseAdmin
      .from('discussion_posts')
      .update(updates)
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating discussion post:', updateError)
      throw createHttpError(500, 'failed_to_update_post')
    }

    const detail = await this.getDiscussionDetail(discussionId, userEmail)
    this.emitEvent('discussion:post_updated', { discussionId, postId })
    return detail
  }

  static async deletePost(discussionId: string, postId: string, userEmail: string) {
    const { participant } = await this.assertAccess(discussionId, userEmail)

    const { data: post, error } = await supabaseAdmin
      .from('discussion_posts')
      .select('author_email')
      .eq('id', postId)
      .eq('discussion_id', discussionId)
      .single()

    if (error || !post) {
      throw createHttpError(404, 'post_not_found')
    }

    const isAuthor = post.author_email === userEmail
    const isModerator =
      participant?.participant_role &&
      ['owner', 'moderator', 'leader', 'co_leader'].includes(participant.participant_role)

    if (!isAuthor && !isModerator) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    const { error: updateError } = await supabaseAdmin
      .from('discussion_posts')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error deleting discussion post:', updateError)
      throw createHttpError(500, 'failed_to_delete_post')
    }

    const detail = await this.getDiscussionDetail(discussionId, userEmail)
    this.emitEvent('discussion:post_deleted', { discussionId, postId })
    return detail
  }

  static async markDiscussionRead(discussionId: string, userEmail: string) {
    await this.assertAccess(discussionId, userEmail)

    const { error } = await supabaseAdmin
      .from('discussion_participants')
      .update({
        last_seen_at: new Date().toISOString(),
        unread_count: 0
      })
      .eq('discussion_id', discussionId)
      .eq('user_email', userEmail)

    if (error) {
      console.error('Error marking discussion read:', error)
      throw createHttpError(500, 'failed_to_mark_read')
    }

    return { success: true }
  }

  private static async syncParticipantsAfterCreation(
    discussionId: string,
    ownerEmail: string,
    ownerRole: string,
    participants?: Array<{ email: string; role?: ParticipantRole }>
  ) {
    const participantRows: Array<Record<string, any>> = [
      {
        discussion_id: discussionId,
        user_email: ownerEmail,
        user_role: ownerRole || null,
        participant_role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      }
    ]

    const additionalParticipants = sanitizeArray(participants)
      .map((participant) => ({
        discussion_id: discussionId,
        user_email: participant.email.toLowerCase(),
        user_role: participant.role === 'owner' ? 'teacher' : null,
        participant_role: participant.role || 'participant',
        status: 'active',
        joined_at: new Date().toISOString()
      }))
      .filter((participant) => participant.user_email !== ownerEmail)

    participantRows.push(...additionalParticipants)

    const { error } = await supabaseAdmin.from('discussion_participants').insert(participantRows)

    if (error) {
      console.error('Error inserting discussion participants:', error)
      throw createHttpError(500, 'failed_to_add_participants')
    }
  }

  private static async incrementUnreadCounts(discussionId: string, authorEmail: string) {
    const { data: participants, error } = await supabaseAdmin
      .from('discussion_participants')
      .select('id, user_email, unread_count')
      .eq('discussion_id', discussionId)
      .neq('user_email', authorEmail)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching participants to increment unread count:', error)
      return
    }

    const updates = sanitizeArray(participants)

    for (const participant of updates) {
      const nextUnread = (participant.unread_count ?? 0) + 1
      const { error: updateError } = await supabaseAdmin
        .from('discussion_participants')
        .update({
          unread_count: nextUnread
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error('Error updating unread count:', updateError)
      }
    }
  }

  private static async assertAccess(discussionId: string, userEmail: string) {
    if (!userEmail) {
      throw createHttpError(401, 'user_email_required')
    }

    const { data: discussion, error } = await supabaseAdmin
      .from('discussions')
      .select('*')
      .eq('id', discussionId)
      .single()

    if (error || !discussion) {
      throw createHttpError(404, 'discussion_not_found')
    }

    if (discussion.owner_email === userEmail) {
      return { discussion, participant: { participant_role: 'owner', status: 'active' } }
    }

    const { data: participant } = await supabaseAdmin
      .from('discussion_participants')
      .select('*')
      .eq('discussion_id', discussionId)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single()

    if (!participant) {
      throw createHttpError(403, 'access_denied')
    }

    return { discussion, participant }
  }

  private static emitEvent(event: string, payload: Record<string, any>) {
    const io = getSocketServer()
    if (!io) return
    io.emit(event, payload)
  }
}

