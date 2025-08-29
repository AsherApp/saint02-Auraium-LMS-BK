import { http, apiBase } from '../http'

export async function createInvite(input: { email: string; name?: string; role?: string; course_id?: string }) {
  // Map email to student_email for backend compatibility
  const body = {
    ...input,
    student_email: input.email
  }
  delete (body as any).email
  
  const r = await http<{ code: string; email: string; inviteUrl: string }>(`/api/invites`, { method: 'POST', body })
  const withEmail = `${r.inviteUrl}?email=${encodeURIComponent(input.email)}`
  // Return absolute URL for convenience
  const absolute = withEmail.startsWith('http') ? withEmail : `${typeof window !== 'undefined' ? window.location.origin : ''}${withEmail}`
  return { ...r, inviteUrl: absolute }
}

export async function getInvite(code: string) {
  return http<{ code: string; email: string; name?: string; course_id?: string; used: boolean }>(`/api/invites/${code}`)
}

export async function acceptInvite(code: string, input?: { email?: string; name?: string }) {
  return http<{ ok: true }>(`/api/invites/${code}/accept`, { method: 'POST', body: input })
}

export async function revokeInvite(code: string) {
  return http<{ ok: true }>(`/api/invites/${code}`, { method: 'DELETE' })
}

export async function listInvites(courseId?: string) {
  const params = courseId ? `?course_id=${courseId}` : ''
  return http<{ items: any[]; total: number }>(`/api/invites${params}`)
}

export async function deleteInvite(code: string) {
  return http<{ success: true; message: string }>(`/api/invites/${code}`, { method: 'DELETE' })
}

