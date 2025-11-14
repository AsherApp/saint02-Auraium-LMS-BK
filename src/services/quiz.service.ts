import { supabaseAdmin } from '../lib/supabase.js'

// Utility function for consistent error handling
function createHttpError(statusCode: number, message: string) {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

// --- Type Definitions ---
export interface LiveClassQuizQuestion {
  questionText: string
  options: string[]
  correctOptionIndex: number
}

export interface LiveClassQuiz {
  id: string
  live_class_id: string
  teacher_id: string
  title: string
  questions: LiveClassQuizQuestion[]
  is_active: boolean
  show_results_after_submission: boolean
  created_at: string
  updated_at: string
}

export interface LiveClassQuizSubmission {
  id: string
  quiz_id: string
  student_id: string
  answers: number[]
  score: number
  submitted_at: string
}

export interface CreateLiveClassQuizInput {
  liveClassId: string
  teacherId: string
  title: string
  questions: LiveClassQuizQuestion[]
  showResultsAfterSubmission: boolean
}

export interface UpdateLiveClassQuizInput {
  title?: string
  questions?: LiveClassQuizQuestion[]
  is_active?: boolean
  showResultsAfterSubmission?: boolean
}

export interface SubmitQuizInput {
  quizId: string
  studentId: string
  answers: number[]
}

// --- QuizService ---
export class QuizService {
  /**
   * Creates a new live class quiz.
   * @param payload - The quiz data.
   * @returns The newly created quiz object.
   */
  static async createQuiz(payload: CreateLiveClassQuizInput): Promise<LiveClassQuiz> {
    const { liveClassId, teacherId, title, questions, showResultsAfterSubmission } = payload

    const { data: quiz, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .insert({
        live_class_id: liveClassId,
        teacher_id: teacherId,
        title: title,
        questions: questions,
        show_results_after_submission: showResultsAfterSubmission,
      })
      .select('*')
      .single()

    if (error || !quiz) {
      console.error('Error creating live class quiz:', error)
      throw createHttpError(500, 'failed_to_create_quiz')
    }

    return quiz
  }

  /**
   * Retrieves quizzes for a specific live class.
   * @param liveClassId - The ID of the live class.
   * @returns A list of live class quizzes.
   */
  static async getQuizzes(liveClassId: string): Promise<LiveClassQuiz[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .select('*')
      .eq('live_class_id', liveClassId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error retrieving live class quizzes:', error)
      throw createHttpError(500, 'failed_to_retrieve_quizzes')
    }

    return data || []
  }

  /**
   * Retrieves a single quiz by ID.
   * @param quizId - The ID of the quiz.
   * @returns The quiz object.
   */
  static async getQuizById(quizId: string): Promise<LiveClassQuiz> {
    const { data: quiz, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (error || !quiz) {
      console.error('Error retrieving quiz by ID:', error)
      throw createHttpError(404, 'quiz_not_found')
    }

    return quiz
  }

  /**
   * Activates a quiz.
   * @param quizId - The ID of the quiz to activate.
   * @param teacherId - The ID of the teacher activating the quiz.
   * @returns The updated quiz object.
   */
  static async activateQuiz(quizId: string, teacherId: string): Promise<LiveClassQuiz> {
    await this.assertTeacherAccess(quizId, teacherId)

    const { data: quiz, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .update({ is_active: true })
      .eq('id', quizId)
      .select('*')
      .single()

    if (error || !quiz) {
      console.error('Error activating quiz:', error)
      throw createHttpError(500, 'failed_to_activate_quiz')
    }

    return quiz
  }

  /**
   * Deactivates a quiz.
   * @param quizId - The ID of the quiz to deactivate.
   * @param teacherId - The ID of the teacher deactivating the quiz.
   * @returns The updated quiz object.
   */
  static async deactivateQuiz(quizId: string, teacherId: string): Promise<LiveClassQuiz> {
    await this.assertTeacherAccess(quizId, teacherId)

    const { data: quiz, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .update({ is_active: false })
      .eq('id', quizId)
      .select('*')
      .single()

    if (error || !quiz) {
      console.error('Error deactivating quiz:', error)
      throw createHttpError(500, 'failed_to_deactivate_quiz')
    }

    return quiz
  }

  /**
   * Deletes a quiz and all related submissions.
   * @param quizId - The ID of the quiz to delete.
  * @param teacherId - The ID of the teacher deleting the quiz.
  * @returns Success indicator.
  */
  static async deleteQuiz(quizId: string, teacherId: string): Promise<{ success: boolean }> {
    await this.assertTeacherAccess(quizId, teacherId)

    const { error: submissionsDeleteError } = await supabaseAdmin
      .from('live_class_quiz_submissions')
      .delete()
      .eq('quiz_id', quizId)

    if (submissionsDeleteError) {
      console.error('Error deleting quiz submissions:', submissionsDeleteError)
      throw createHttpError(500, 'failed_to_delete_quiz')
    }

    const { error: quizDeleteError } = await supabaseAdmin
      .from('live_class_quizzes')
      .delete()
      .eq('id', quizId)

    if (quizDeleteError) {
      console.error('Error deleting quiz:', quizDeleteError)
      throw createHttpError(500, 'failed_to_delete_quiz')
    }

    return { success: true }
  }

  /**
   * Records a student's submission for a quiz and calculates the score.
   * @param payload - The submission data.
   * @returns The newly created submission object.
   */
  static async submitQuiz(payload: SubmitQuizInput): Promise<LiveClassQuizSubmission> {
    const { quizId, studentId, answers } = payload

    // Check if quiz is active
    const quiz = await this.getQuizById(quizId)
    if (!quiz.is_active) {
      throw createHttpError(400, 'quiz_is_not_active')
    }

    // Check if student has already submitted
    const { data: existingSubmission, error: existingSubmissionError } = await supabaseAdmin
      .from('live_class_quiz_submissions')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .single()

    if (existingSubmission) {
      throw createHttpError(409, 'already_submitted_this_quiz')
    }
    if (existingSubmissionError && existingSubmissionError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing submission:', existingSubmissionError)
      throw createHttpError(500, 'failed_to_check_submission_status')
    }

    // Calculate score
    let score = 0
    if (answers.length !== quiz.questions.length) {
      throw createHttpError(400, 'answers_count_mismatch')
    }
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correctOptionIndex) {
        score++
      }
    }

    const { data: submission, error } = await supabaseAdmin
      .from('live_class_quiz_submissions')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        answers: answers,
        score: score,
      })
      .select('*')
      .single()

    if (error || !submission) {
      console.error('Error recording quiz submission:', error)
      throw createHttpError(500, 'failed_to_record_submission')
    }

    return submission
  }

  /**
   * Gets all submissions for a specific quiz.
   * @param quizId - The ID of the quiz.
   * @returns A list of quiz submissions.
   */
  static async getQuizSubmissions(quizId: string): Promise<LiveClassQuizSubmission[]> {
    const { data, error } = await supabaseAdmin
      .from('live_class_quiz_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: true })

    if (error) {
      console.error('Error retrieving quiz submissions:', error)
      throw createHttpError(500, 'failed_to_retrieve_submissions')
    }

    return data || []
  }

  /**
   * Gets a specific student's submission for a quiz.
   * @param quizId - The ID of the quiz.
   * @param studentId - The ID of the student.
   * @returns The student's submission.
   */
  static async getStudentSubmission(quizId: string, studentId: string): Promise<LiveClassQuizSubmission | null> {
    const { data, error } = await supabaseAdmin
      .from('live_class_quiz_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error retrieving student submission:', error)
      throw createHttpError(500, 'failed_to_retrieve_student_submission')
    }

    return data || null
  }

  /**
   * Asserts that the actor is the teacher of the specified quiz.
   * @param quizId - The ID of the quiz.
   * @param teacherId - The ID of the teacher.
   * @throws HttpError if the quiz is not found or access is denied.
   */
  private static async assertTeacherAccess(quizId: string, teacherId: string): Promise<LiveClassQuiz> {
    if (!teacherId) {
      throw createHttpError(401, 'teacher_id_required')
    }

    const { data: quiz, error } = await supabaseAdmin
      .from('live_class_quizzes')
      .select('*')
      .eq('id', quizId)
      .single()

    if (error || !quiz) {
      throw createHttpError(404, 'quiz_not_found')
    }

    if (quiz.teacher_id !== teacherId) {
      throw createHttpError(403, 'insufficient_permissions')
    }
    return quiz
  }
}
