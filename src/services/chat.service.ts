import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassMessage {
  id: string
  live_class_id: string
  sender_id: string
  sender_email: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateLiveClassMessageInput {
  liveClassId: string
  senderId: string
  senderEmail: string
  content: string
}

// --- ChatService ---
export class ChatService {
  /**
   * Saves a new live class chat message to the database.
   * @param payload - The message data.
   * @returns The newly created message object.
   */
  static async saveMessage(payload: CreateLiveClassMessageInput): Promise<LiveClassMessage> {
    const { liveClassId, senderId, senderEmail, content } = payload

    const { data: message, error } = await supabaseAdmin
      .from('live_class_messages')
      .insert({
        live_class_id: liveClassId,
        sender_id: senderId,
        sender_email: senderEmail,
        content: content,
      })
      .select('*')
      .single()

    if (error || !message) {
      console.error('Error saving live class message:', error)
      throw createHttpError(500, 'failed_to_save_message')
    }

    return message
  }

  /**
   * Retrieves chat messages for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @param limit - Maximum number of messages to retrieve.
   * @param offset - Offset for pagination.
   * @returns A list of live class messages.
   */
  static async getMessages(liveClassId: string, limit: number = 50, offset: number = 0): Promise<LiveClassMessage[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_messages')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error retrieving live class messages:', error)
      throw createHttpError(500, 'failed_to_retrieve_messages')
    }

    return data || []
  }
}
