import { http } from '../http'

export type LiveActivity = {
  id: string
  session_id: string
  type: 'note' | 'quiz' | 'poll' | 'classwork'
  title: string
  content?: any
  created_by: string
  created_at: string
  updated_at: string
}

export type LiveNote = {
  id: string
  session_id: string
  title: string
  content: string
  created_by: string
  is_shared: boolean
  created_at: string
  updated_at: string
}

export type LiveQuiz = {
  id: string
  session_id: string
  title: string
  questions: Array<{
    id: string
    type: 'multiple_choice' | 'true_false' | 'short_answer'
    question: string
    options?: string[]
    correct_answer?: string
  }>
  time_limit?: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type LivePoll = {
  id: string
  session_id: string
  question: string
  options: string[]
  responses: Array<{
    user_id: string
    option_index: number
    created_at: string
  }>
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type LiveClasswork = {
  id: string
  session_id: string
  title: string
  description: string
  due_time?: string
  submissions: Array<{
    user_id: string
    content: string
    submitted_at: string
  }>
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// Live Notes API
export async function listLiveNotes(sessionId: string) {
  return http<{ items: LiveNote[] }>(`/api/live/${sessionId}/notes`)
}

export async function createLiveNote(sessionId: string, data: Omit<LiveNote, 'id' | 'session_id' | 'created_at' | 'updated_at'>) {
  return http<LiveNote>(`/api/live/${sessionId}/notes`, { method: 'POST', body: data })
}

export async function updateLiveNote(noteId: string, data: Partial<Omit<LiveNote, 'id' | 'session_id' | 'created_by' | 'created_at' | 'updated_at'>>) {
  return http<LiveNote>(`/api/live/notes/${noteId}`, { method: 'PUT', body: data })
}

export async function deleteLiveNote(noteId: string) {
  return http<{ ok: true }>(`/api/live/notes/${noteId}`, { method: 'DELETE' })
}

// Live Quizzes API
export async function listLiveQuizzes(sessionId: string) {
  return http<{ items: LiveQuiz[] }>(`/api/live-sessions/${sessionId}/quizzes`)
}

export async function createLiveQuiz(sessionId: string, data: Omit<LiveQuiz, 'id' | 'session_id' | 'created_at' | 'updated_at'>) {
  return http<LiveQuiz>(`/api/live-sessions/${sessionId}/quizzes`, { method: 'POST', body: data })
}

export async function updateLiveQuiz(quizId: string, data: Partial<Omit<LiveQuiz, 'id' | 'session_id' | 'created_by' | 'created_at' | 'updated_at'>>) {
  return http<LiveQuiz>(`/api/live-quizzes/${quizId}`, { method: 'PUT', body: data })
}

export async function deleteLiveQuiz(quizId: string) {
  return http<{ ok: true }>(`/api/live-quizzes/${quizId}`, { method: 'DELETE' })
}

export async function submitQuizAnswer(quizId: string, questionId: string, answer: string) {
  return http<{ ok: true }>(`/api/live-quizzes/${quizId}/questions/${questionId}/answer`, { method: 'POST', body: { answer } })
}

// Live Polls API
export async function listLivePolls(sessionId: string) {
  return http<{ items: LivePoll[] }>(`/api/live-sessions/${sessionId}/polls`)
}

export async function createLivePoll(sessionId: string, data: Omit<LivePoll, 'id' | 'session_id' | 'responses' | 'created_at' | 'updated_at'>) {
  return http<LivePoll>(`/api/live-sessions/${sessionId}/polls`, { method: 'POST', body: data })
}

export async function updateLivePoll(pollId: string, data: Partial<Omit<LivePoll, 'id' | 'session_id' | 'responses' | 'created_by' | 'created_at' | 'updated_at'>>) {
  return http<LivePoll>(`/api/live-polls/${pollId}`, { method: 'PUT', body: data })
}

export async function deleteLivePoll(pollId: string) {
  return http<{ ok: true }>(`/api/live-polls/${pollId}`, { method: 'DELETE' })
}

export async function submitPollResponse(pollId: string, optionIndex: number) {
  return http<{ ok: true }>(`/api/live-polls/${pollId}/respond`, { method: 'POST', body: { option_index: optionIndex } })
}

// Live Classwork API
export async function listLiveClasswork(sessionId: string) {
  return http<{ items: LiveClasswork[] }>(`/api/live/${sessionId}/classwork`)
}

export async function createLiveClasswork(sessionId: string, data: Omit<LiveClasswork, 'id' | 'session_id' | 'submissions' | 'created_at' | 'updated_at'>) {
  return http<LiveClasswork>(`/api/live/${sessionId}/classwork`, { method: 'POST', body: data })
}

export async function updateLiveClasswork(classworkId: string, data: Partial<Omit<LiveClasswork, 'id' | 'session_id' | 'submissions' | 'created_by' | 'created_at' | 'updated_at'>>) {
  return http<LiveClasswork>(`/api/live/classwork/${classworkId}`, { method: 'PUT', body: data })
}

export async function deleteLiveClasswork(classworkId: string) {
  return http<{ ok: true }>(`/api/live/classwork/${classworkId}`, { method: 'DELETE' })
}

export async function submitClasswork(classworkId: string, content: string) {
  return http<{ ok: true }>(`/api/live/classwork/${classworkId}/submit`, { method: 'POST', body: { content } })
} 