import { http } from '../http'

export type Message = {
  id: string
  to_email: string
  from_email: string
  subject: string
  body: string
  at: string
  read: boolean
}

export async function listInbox(myEmail: string) {
  return http<{ items: Message[] }>(`/api/inbox`, {
    headers: { 'x-user-email': myEmail },
  })
}

export async function sendMessage(input: { to_email: string; from_email: string; subject: string; body: string }) {
  return http<{ ok: true }>(`/api/inbox/send`, { method: 'POST', body: input })
}

export async function setRead(ids: string[], read: boolean) {
  return http<{ ok: true }>(`/api/inbox/read`, { method: 'POST', body: { ids, read } })
}

export async function deleteMessages(ids: string[]) {
  return http<{ ok: true }>(`/api/inbox/delete`, { method: 'POST', body: { ids } })
}

