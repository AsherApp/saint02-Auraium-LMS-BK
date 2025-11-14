import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassPoll {
  id: string
  live_class_id: string
  teacher_id: string
  question: string
  options: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LiveClassPollVote {
  id: string
  poll_id: string
  voter_id: string
  option_index: number
  created_at: string
}

export interface CreateLiveClassPollInput {
  liveClassId: string
  teacherId: string
  question: string
  options: string[]
}

export interface UpdateLiveClassPollInput {
  question?: string
  options?: string[]
  is_active?: boolean
}

export interface VoteOnPollInput {
  pollId: string
  voterId: string
  optionIndex: number
}

export interface PollResult {
  option: string
  votes: number
  percentage: number
}

// --- PollService ---
export class PollService {
  /**
   * Creates a new live class poll.
   * @param payload - The poll data.
   * @returns The newly created poll object.
   */
  static async createPoll(payload: CreateLiveClassPollInput): Promise<LiveClassPoll> {
    const { liveClassId, teacherId, question, options } = payload

    const { data: poll, error } = await supabaseAdmin
      .from('live_class_polls')
      .insert({
        live_class_id: liveClassId,
        teacher_id: teacherId,
        question: question,
        options: options,
      })
      .select('*')
      .single()

    if (error || !poll) {
      console.error('Error creating live class poll:', error)
      throw createHttpError(500, 'failed_to_create_poll')
    }

    return poll
  }

  /**
   * Retrieves polls for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of live class polls.
   */
  static async getPolls(liveClassId: string): Promise<LiveClassPoll[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_polls')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error retrieving live class polls:', error)
      throw createHttpError(500, 'failed_to_retrieve_polls')
    }

    return data || []
  }

  /**
   * Retrieves a single poll by ID.
   * @param pollId - The ID of the poll.
   * @returns The poll object.
   */
  static async getPollById(pollId: string): Promise<LiveClassPoll> {
    const { data: poll, error } = await supabaseAdmin
      .from('live_class_polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      console.error('Error retrieving poll by ID:', error)
      throw createHttpError(404, 'poll_not_found')
    }

    return poll
  }

  /**
   * Activates a poll.
   * @param pollId - The ID of the poll to activate.
   * @param teacherId - The ID of the teacher activating the poll.
   * @returns The updated poll object.
   */
  static async activatePoll(pollId: string, teacherId: string): Promise<LiveClassPoll> {
    await this.assertTeacherAccess(pollId, teacherId)

    const { data: poll, error } = await supabaseAdmin
      .from('live_class_polls')
      .update({ is_active: true })
      .eq('id', pollId)
      .select('*')
      .single()

    if (error || !poll) {
      console.error('Error activating poll:', error)
      throw createHttpError(500, 'failed_to_activate_poll')
    }

    return poll
  }

  /**
   * Deactivates a poll.
   * @param pollId - The ID of the poll to deactivate.
   * @param teacherId - The ID of the teacher deactivating the poll.
   * @returns The updated poll object.
   */
  static async deactivatePoll(pollId: string, teacherId: string): Promise<LiveClassPoll> {
    await this.assertTeacherAccess(pollId, teacherId)

    const { data: poll, error } = await supabaseAdmin
      .from('live_class_polls')
      .update({ is_active: false })
      .eq('id', pollId)
      .select('*')
      .single()

    if (error || !poll) {
      console.error('Error deactivating poll:', error)
      throw createHttpError(500, 'failed_to_deactivate_poll')
    }

    return poll
  }

  /**
   * Deletes a poll and all of its votes.
   * @param pollId - The ID of the poll to delete.
   * @param teacherId - The ID of the teacher deleting the poll.
   * @returns Success indicator.
   */
  static async deletePoll(pollId: string, teacherId: string): Promise<{ success: boolean }> {
    await this.assertTeacherAccess(pollId, teacherId)

    const { error: voteDeleteError } = await supabaseAdmin
      .from('live_class_poll_votes')
      .delete()
      .eq('poll_id', pollId)

    if (voteDeleteError) {
      console.error('Error deleting poll votes:', voteDeleteError)
      throw createHttpError(500, 'failed_to_delete_poll')
    }

    const { error: pollDeleteError } = await supabaseAdmin
      .from('live_class_polls')
      .delete()
      .eq('id', pollId)

    if (pollDeleteError) {
      console.error('Error deleting poll:', pollDeleteError)
      throw createHttpError(500, 'failed_to_delete_poll')
    }

    return { success: true }
  }

  /**
   * Records a vote for a poll.
   * @param payload - The vote data.
   * @returns The newly created vote object.
   */
  static async voteOnPoll(payload: VoteOnPollInput): Promise<LiveClassPollVote> {
    const { pollId, voterId, optionIndex } = payload

    // Check if poll is active
    const poll = await this.getPollById(pollId)
    if (!poll.is_active) {
      throw createHttpError(400, 'poll_is_not_active')
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw createHttpError(400, 'invalid_option_index')
    }

    // Check if user has already voted
    const { data: existingVote, error: existingVoteError } = await supabaseAdmin
      .from('live_class_poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single()

    if (existingVote) {
      throw createHttpError(409, 'already_voted_on_this_poll')
    }
    if (existingVoteError && existingVoteError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing vote:', existingVoteError)
      throw createHttpError(500, 'failed_to_check_vote_status')
    }

    const { data: vote, error } = await supabaseAdmin
      .from('live_class_poll_votes')
      .insert({
        poll_id: pollId,
        voter_id: voterId,
        option_index: optionIndex,
      })
      .select('*')
      .single()

    if (error || !vote) {
      console.error('Error recording vote:', error)
      throw createHttpError(500, 'failed_to_record_vote')
    }

    return vote
  }

  /**
   * Gets the results for a specific poll.
   * @param pollId - The ID of the poll.
   * @returns An array of poll results.
   */
  static async getPollResults(pollId: string): Promise<PollResult[]> {
    const poll = await this.getPollById(pollId)

    const { data: votes, error } = await supabaseAdmin
      .from('live_class_poll_votes')
      .select('option_index')
      .eq('poll_id', pollId)

    if (error) {
      console.error('Error retrieving poll votes:', error)
      throw createHttpError(500, 'failed_to_retrieve_poll_votes')
    }

    const voteCounts = new Array(poll.options.length).fill(0)
    votes?.forEach((vote) => {
      if (vote.option_index >= 0 && vote.option_index < poll.options.length) {
        voteCounts[vote.option_index]++
      }
    })

    const totalVotes = votes?.length || 0
    const results: PollResult[] = poll.options.map((option, index) => ({
      option,
      votes: voteCounts[index],
      percentage: totalVotes > 0 ? (voteCounts[index] / totalVotes) * 100 : 0,
    }))

    return results
  }

  /**
   * Asserts that the actor is the teacher of the specified poll.
   * @param pollId - The ID of the poll.
   * @param teacherId - The ID of the teacher.
   * @throws HttpError if the poll is not found or access is denied.
   */
  private static async assertTeacherAccess(pollId: string, teacherId: string): Promise<LiveClassPoll> {
    if (!teacherId) {
      throw createHttpError(401, 'teacher_id_required')
    }

    const { data: poll, error } = await supabaseAdmin
      .from('live_class_polls')
      .select('*')
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      throw createHttpError(404, 'poll_not_found')
    }

    if (poll.teacher_id !== teacherId) {
      throw createHttpError(403, 'insufficient_permissions')
    }
    return poll
  }
}
