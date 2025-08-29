"use client"
import { useState } from 'react'
import { acceptInvite, createInvite, getInvite, revokeInvite } from './api'

export function useInvitesFn() {
  const [busy, setBusy] = useState(false)
  return {
    busy,
    create: async (input: { email: string; name?: string; role?: string; course_id?: string }) => {
      setBusy(true)
      try { return await createInvite(input) } finally { setBusy(false) }
    },
    get: (code: string) => getInvite(code),
    accept: (code: string) => acceptInvite(code),
    revoke: (code: string) => revokeInvite(code),
  }
}

