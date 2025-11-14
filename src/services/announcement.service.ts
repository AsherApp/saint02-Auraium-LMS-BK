import { supabaseAdmin } from '../lib/supabase.js'

type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'cancelled' | 'expired'
type AnnouncementDisplayType = 'banner' | 'modal' | 'email'
type AnnouncementPriority = 'normal' | 'high' | 'critical'

interface PaginationOptions {
  limit?: number
  offset?: number
  sortBy?: 'starts_at' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface AnnouncementFilters extends PaginationOptions {
  authorEmail?: string
  contextType?: string
  contextId?: string
  status?: AnnouncementStatus | AnnouncementStatus[]
  includeExpired?: boolean
  search?: string
}

export interface AudienceInput {
  audienceType: string
  audienceId?: string
  audienceValue?: string
}

export interface CreateAnnouncementInput {
  title: string
  content: string
  richContent?: Record<string, any>
  displayType?: AnnouncementDisplayType
  priority?: AnnouncementPriority
  contextType?: string
  contextId?: string
  startsAt?: string
  endsAt?: string
  recurrence?: {
    rule: string
    endsAt?: string
  }
  audience?: AudienceInput[]
  metadata?: Record<string, any>
}

export interface UpdateAnnouncementInput {
  title?: string
  content?: string
  richContent?: Record<string, any>
  displayType?: AnnouncementDisplayType
  priority?: AnnouncementPriority
  contextType?: string
  contextId?: string
  startsAt?: string | null
  endsAt?: string | null
  status?: AnnouncementStatus
  recurrence?: {
    rule: string
    endsAt?: string
  } | null
  audience?: AudienceInput[]
  metadata?: Record<string, any>
}

function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

function sanitizeArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : []
}

export class AnnouncementService {
  static async listAnnouncements(filters: AnnouncementFilters = {}) {
    let query = supabaseAdmin
      .from('announcements')
      .select('*')

    if (filters.authorEmail) {
      query = query.eq('author_email', filters.authorEmail)
    }

    if (filters.contextType) {
      query = query.eq('context_type', filters.contextType)
    }

    if (filters.contextId) {
      query = query.eq('context_id', filters.contextId)
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (!filters.includeExpired) {
      query = query.or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())
    }

    if (filters.search) {
      const searchValue = filters.search.trim()
      if (searchValue) {
        query = query.ilike('title', `%${searchValue}%`)
      }
    }

    const limit = Math.min(filters.limit ?? 50, 100)
    const offset = filters.offset ?? 0
    const sortBy = filters.sortBy ?? 'starts_at'
    const sortOrder = filters.sortOrder ?? 'desc'

    query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(
      offset,
      offset + limit - 1
    )

    const { data, error } = await query

    if (error) {
      console.error('Error listing announcements:', error)
      throw createHttpError(500, 'failed_to_list_announcements')
    }

    return sanitizeArray(data)
  }

  static async getAnnouncement(announcementId: string, actorEmail: string) {
    const { announcement } = await this.assertAuthorAccess(announcementId, actorEmail)

    const [{ data: audience, error: audienceError }, { data: recurrences, error: recurrenceError }] =
      await Promise.all([
        supabaseAdmin
          .from('announcement_audience')
          .select('*')
          .eq('announcement_id', announcementId),
        supabaseAdmin
          .from('announcement_recurrences')
          .select('*')
          .eq('announcement_id', announcementId)
          .order('next_run_at', { ascending: true })
      ])

    if (audienceError) {
      console.error('Error loading announcement audience:', audienceError)
      throw createHttpError(500, 'failed_to_fetch_audience')
    }

    if (recurrenceError) {
      console.error('Error loading announcement recurrences:', recurrenceError)
      throw createHttpError(500, 'failed_to_fetch_recurrences')
    }

    return {
      announcement,
      audience: sanitizeArray(audience),
      recurrences: sanitizeArray(recurrences)
    }
  }

  static async createAnnouncement(authorEmail: string, payload: CreateAnnouncementInput) {
    if (!authorEmail) {
      throw createHttpError(401, 'user_email_required')
    }

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: payload.title,
        content: payload.content,
        rich_content: payload.richContent || {},
        author_email: authorEmail,
        author_role: 'teacher',
        display_type: payload.displayType || 'banner',
        priority: payload.priority || 'normal',
        context_type: payload.contextType || null,
        context_id: payload.contextId || null,
        starts_at: payload.startsAt || null,
        ends_at: payload.endsAt || null,
        status: payload.startsAt ? 'scheduled' : 'published',
        metadata: payload.metadata || {},
        published_at: payload.startsAt ? null : new Date().toISOString()
      })
      .select('*')
      .single()

    if (error || !announcement) {
      console.error('Error creating announcement:', error)
      throw createHttpError(500, 'failed_to_create_announcement')
    }

    if (payload.audience?.length) {
      await this.upsertAudience(announcement.id, sanitizeArray(payload.audience))
    }

    if (payload.recurrence?.rule) {
      await this.upsertRecurrence(announcement.id, payload.recurrence)
    }

    await this.audit(announcement.id, authorEmail, 'created', { payload })

    return this.getAnnouncement(announcement.id, authorEmail)
  }

  static async updateAnnouncement(
    announcementId: string,
    actorEmail: string,
    payload: UpdateAnnouncementInput
  ) {
    await this.assertAuthorAccess(announcementId, actorEmail)

    const updates: Record<string, any> = {}

    if (payload.title !== undefined) updates.title = payload.title
    if (payload.content !== undefined) updates.content = payload.content
    if (payload.richContent !== undefined) updates.rich_content = payload.richContent
    if (payload.displayType !== undefined) updates.display_type = payload.displayType
    if (payload.priority !== undefined) updates.priority = payload.priority
    if (payload.contextType !== undefined) updates.context_type = payload.contextType
    if (payload.contextId !== undefined) updates.context_id = payload.contextId
    if (payload.metadata !== undefined) updates.metadata = payload.metadata

    if (payload.startsAt !== undefined) {
      updates.starts_at = payload.startsAt
    }

    if (payload.endsAt !== undefined) {
      updates.ends_at = payload.endsAt
    }

    if (payload.status !== undefined) {
      updates.status = payload.status
      if (payload.status === 'published') {
        updates.published_at = new Date().toISOString()
      }
    }

    if (Object.keys(updates).length) {
      const { error } = await supabaseAdmin
        .from('announcements')
        .update(updates)
        .eq('id', announcementId)

      if (error) {
        console.error('Error updating announcement:', error)
        throw createHttpError(500, 'failed_to_update_announcement')
      }
    }

    if (payload.audience) {
      await this.syncAudience(announcementId, payload.audience)
    }

    if (payload.recurrence !== undefined) {
      if (payload.recurrence === null) {
        await this.removeRecurrence(announcementId)
      } else {
        await this.upsertRecurrence(announcementId, payload.recurrence)
      }
    }

    await this.audit(announcementId, actorEmail, 'updated', { payload })

    return this.getAnnouncement(announcementId, actorEmail)
  }

  static async deleteAnnouncement(announcementId: string, actorEmail: string) {
    await this.assertAuthorAccess(announcementId, actorEmail)

    const { error } = await supabaseAdmin
      .from('announcements')
      .update({
        status: 'cancelled',
        ends_at: new Date().toISOString()
      })
      .eq('id', announcementId)

    if (error) {
      console.error('Error cancelling announcement:', error)
      throw createHttpError(500, 'failed_to_cancel_announcement')
    }

    await this.audit(announcementId, actorEmail, 'cancelled')

    return { success: true }
  }

  static async publishNow(announcementId: string, actorEmail: string) {
    await this.assertAuthorAccess(announcementId, actorEmail)

    const { error } = await supabaseAdmin
      .from('announcements')
      .update({
        status: 'published',
        starts_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      })
      .eq('id', announcementId)

    if (error) {
      console.error('Error publishing announcement:', error)
      throw createHttpError(500, 'failed_to_publish_announcement')
    }

    await this.audit(announcementId, actorEmail, 'published_now')

    return { success: true }
  }

  static async acknowledgeAnnouncement(announcementId: string, userEmail: string) {
    const { error } = await supabaseAdmin
      .from('announcement_reads')
      .upsert({
        announcement_id: announcementId,
        user_email: userEmail,
        read_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error acknowledging announcement:', error)
      throw createHttpError(500, 'failed_to_acknowledge_announcement')
    }

    return { success: true }
  }

  static async dismissAnnouncement(announcementId: string, userEmail: string) {
    const { error } = await supabaseAdmin
      .from('announcement_reads')
      .upsert({
        announcement_id: announcementId,
        user_email: userEmail,
        dismissed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error dismissing announcement:', error)
      throw createHttpError(500, 'failed_to_dismiss_announcement')
    }

    return { success: true }
  }

  private static async assertAuthorAccess(announcementId: string, actorEmail: string) {
    if (!actorEmail) {
      throw createHttpError(401, 'user_email_required')
    }

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (error || !announcement) {
      throw createHttpError(404, 'announcement_not_found')
    }

    if (announcement.author_email !== actorEmail) {
      throw createHttpError(403, 'insufficient_permissions')
    }

    return { announcement }
  }

  private static async syncAudience(announcementId: string, audience: AudienceInput[]) {
    const audienceList = sanitizeArray(audience)

    const { data: existingAudience, error: fetchError } = await supabaseAdmin
      .from('announcement_audience')
      .select('id, audience_type, audience_id, audience_value')
      .eq('announcement_id', announcementId)

    if (fetchError) {
      console.error('Error fetching announcement audience:', fetchError)
      throw createHttpError(500, 'failed_to_update_audience')
    }

    const existing = sanitizeArray(existingAudience)
    const existingIds = new Set(existing.map((record) => record.id))

    const upsertRows = audienceList.map((item) => ({
      announcement_id: announcementId,
      audience_type: item.audienceType,
      audience_id: item.audienceId || null,
      audience_value: item.audienceValue || null
    }))

    if (upsertRows.length) {
      const { error: upsertError } = await supabaseAdmin
        .from('announcement_audience')
        .upsert(upsertRows, { onConflict: 'announcement_id,audience_type,audience_id,audience_value' })

      if (upsertError) {
        console.error('Error upserting announcement audience:', upsertError)
        throw createHttpError(500, 'failed_to_update_audience')
      }
    }

    const toRemove = existing.filter((record) => {
      return !audienceList.some(
        (item) =>
          item.audienceType === record.audience_type &&
          (item.audienceId || null) === (record.audience_id || null) &&
          (item.audienceValue || null) === (record.audience_value || null)
      )
    })

    if (toRemove.length) {
      const { error: deleteError } = await supabaseAdmin
        .from('announcement_audience')
        .delete()
        .in(
          'id',
          toRemove.map((record) => record.id)
        )

      if (deleteError) {
        console.error('Error deleting announcement audience:', deleteError)
        throw createHttpError(500, 'failed_to_update_audience')
      }
    }
  }

  private static async upsertAudience(announcementId: string, audience: AudienceInput[]) {
    const rows = sanitizeArray(audience).map((item) => ({
      announcement_id: announcementId,
      audience_type: item.audienceType,
      audience_id: item.audienceId || null,
      audience_value: item.audienceValue || null
    }))

    if (!rows.length) return

    const { error } = await supabaseAdmin.from('announcement_audience').insert(rows)

    if (error) {
      console.error('Error inserting announcement audience:', error)
      throw createHttpError(500, 'failed_to_create_audience')
    }
  }

  private static async upsertRecurrence(
    announcementId: string,
    recurrence: { rule: string; endsAt?: string }
  ) {
    const { error } = await supabaseAdmin
      .from('announcement_recurrences')
      .upsert({
        announcement_id: announcementId,
        next_run_at: recurrence.rule ? this.nextRunFromRule(recurrence.rule) : null,
        recurrence_rule: recurrence.rule,
        recurrence_ends_at: recurrence.endsAt || null
      } as any)

    if (error) {
      console.error('Error upserting announcement recurrence:', error)
      throw createHttpError(500, 'failed_to_update_recurrence')
    }
  }

  private static async removeRecurrence(announcementId: string) {
    const { error } = await supabaseAdmin
      .from('announcement_recurrences')
      .delete()
      .eq('announcement_id', announcementId)

    if (error) {
      console.error('Error deleting announcement recurrence:', error)
      throw createHttpError(500, 'failed_to_update_recurrence')
    }
  }

  private static nextRunFromRule(rule: string): string {
    const now = new Date()
    const upperRule = rule.toUpperCase()

    if (upperRule.startsWith('DAILY')) {
      now.setDate(now.getDate() + 1)
    } else if (upperRule.startsWith('WEEKLY')) {
      now.setDate(now.getDate() + 7)
    } else if (upperRule.startsWith('MONTHLY')) {
      now.setMonth(now.getMonth() + 1)
    } else {
      now.setDate(now.getDate() + 1)
    }

    return now.toISOString()
  }

  private static async audit(
    announcementId: string,
    performedBy: string,
    action: string,
    metadata?: Record<string, any>
  ) {
    const { error } = await supabaseAdmin.from('announcement_audit_logs').insert({
      announcement_id: announcementId,
      action,
      performed_by: performedBy,
      metadata: metadata || {}
    })

    if (error) {
      console.error('Error recording announcement audit log:', error)
    }
  }
}

