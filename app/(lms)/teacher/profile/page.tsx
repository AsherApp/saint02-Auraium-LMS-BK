"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TeacherProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to settings page where profile functionality is located
    router.replace('/teacher/settings')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white/70">Redirecting to settings...</p>
      </div>
    </div>
  )
}
