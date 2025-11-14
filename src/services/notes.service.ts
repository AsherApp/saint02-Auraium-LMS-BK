import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassNote {
  id: string
  live_class_id: string
  author_id: string
  author_email: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateLiveClassNoteInput {
  liveClassId: string
  authorId: string
  authorEmail: string
  content: string
}

export interface UpdateLiveClassNoteInput {
  content: string
}

// --- NotesService ---
export class NotesService {
  /**
   * Creates a new live class note.
   * @param payload - The note data.
   * @returns The newly created note object.
   */
  static async createNote(payload: CreateLiveClassNoteInput): Promise<LiveClassNote> {
    const { liveClassId, authorId, authorEmail, content } = payload

    const { data: note, error } = await supabaseAdmin
      .from('live_class_notes')
      .insert({
        live_class_id: liveClassId,
        author_id: authorId,
        author_email: authorEmail,
        content: content,
      })
      .select('*')
      .single()

    if (error || !note) {
      console.error('Error creating live class note:', error)
      throw createHttpError(500, 'failed_to_create_note')
    }

    return note
  }

  /**
   * Retrieves notes for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of live class notes.
   */
  static async getNotes(liveClassId: string): Promise<LiveClassNote[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_notes')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error retrieving live class notes:', error)
      throw createHttpError(500, 'failed_to_retrieve_notes')
    }

    return data || []
  }

  /**
   * Updates an existing live class note.
   * @param noteId - The ID of the note to update.
   * @param authorId - The ID of the user updating the note (for access control).
   * @param payload - The data to update the note with.
   * @returns The updated note object.
   */
  static async updateNote(
    noteId: string,
    authorId: string,
    payload: UpdateLiveClassNoteInput
  ): Promise<LiveClassNote> {
    await this.assertNoteAccess(noteId, authorId)

    const { data: note, error } = await supabaseAdmin
      .from('live_class_notes')
      .update({ content: payload.content })
      .eq('id', noteId)
      .select('*')
      .single()

    if (error || !note) {
      console.error('Error updating live class note:', error)
      throw createHttpError(500, 'failed_to_update_note')
    }

    return note
  }

  /**
   * Deletes a live class note.
   * @param noteId - The ID of the note to delete.
   * @param authorId - The ID of the user deleting the note (for access control).
   * @returns Success status.
   */
  static async deleteNote(noteId: string, authorId: string): Promise<{ success: boolean }> {
    await this.assertNoteAccess(noteId, authorId)

    const { error } = await supabaseAdmin
      .from('live_class_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Error deleting live class note:', error)
      throw createHttpError(500, 'failed_to_delete_note')
    }

    return { success: true }
  }

  /**
   * Asserts that the actor is the author of the specified note.
   * @param noteId - The ID of the note.
   * @param authorId - The ID of the author.
   * @throws HttpError if the note is not found or access is denied.
   */
  private static async assertNoteAccess(noteId: string, authorId: string) {
    if (!authorId) {
      throw createHttpError(401, 'author_id_required')
    }

    const { data: note, error } = await supabaseAdmin
      .from('live_class_notes')
      .select('id, author_id')
      .eq('id', noteId)
      .single()

    if (error || !note) {
      throw createHttpError(404, 'note_not_found')
    }

    if (note.author_id !== authorId) {
      throw createHttpError(403, 'insufficient_permissions')
    }
  }
}
