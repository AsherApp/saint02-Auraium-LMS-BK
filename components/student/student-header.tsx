"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { http } from "@/services/http"
import { X, User, Key, GraduationCap } from "lucide-react"

interface StudentHeaderProps {
  className?: string
}

export function StudentHeader({ className = "" }: StudentHeaderProps) {
  const { user } = useAuthStore()
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const [studentCode, setStudentCode] = useState<string>("")

  useEffect(() => {
    // Check if this is the first login (you can use localStorage or a flag)
    const isFirstLogin = localStorage.getItem('student_first_login') === null
    if (isFirstLogin) {
      setShowWelcomeMessage(true)
      localStorage.setItem('student_first_login', 'false')
    }

    // Get student code from user object or fetch it
    if (user?.student_code) {
      setStudentCode(user.student_code)
    } else if (user?.email && !studentCode) {
      fetchStudentCode()
    }
  }, [user])

  const fetchStudentCode = async () => {
    try {
      // Fetch student code from API
      const data = await http<any>(`/api/students/${user?.email}/profile`)
      if (data.student_code) {
        setStudentCode(data.student_code)
      }
    } catch (error) {
      console.error('Failed to fetch student code:', error)
    }
  }

  if (!user) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Welcome Message - Only shows on first login */}
      {showWelcomeMessage && (
        <Card className="mb-4 bg-blue-500/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-5 w-5 text-blue-300" />
                  <h3 className="text-blue-200 font-bold text-lg">Welcome to Your Dashboard!</h3>
                </div>
                <p className="text-blue-100 text-base mb-3">
                  Please note your student code below. This is what you'll use to login along with your password going forward.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200 text-base font-semibold">Student Code:</span>
                    <span className="font-mono font-bold text-blue-100 text-lg">{studentCode || "Loading..."}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcomeMessage(false)}
                className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Close welcome message"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Header - Shows on all logins */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-white/10 gap-4 w-full">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-1 truncate">{user.name || user.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Key className="h-4 w-4 text-blue-300" />
                <span className="text-blue-200 text-base font-mono bg-blue-500/20 px-2 py-1 rounded">
                  {studentCode || "Loading..."}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2 font-bold text-base flex items-center justify-center">
            <GraduationCap className="h-4 w-4 mr-1" />
            Student
          </Badge>
        </div>
      </div>
    </div>
  )
}
