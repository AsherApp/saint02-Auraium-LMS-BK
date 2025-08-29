"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { http } from "@/services/http"
import { CheckCircle, XCircle, Clock, Users, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AttendanceWidget({ sessionId, isHost }: { sessionId: string; isHost: boolean }) {
  const [participants, setParticipants] = useState<any[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'present'>('all')
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      try {
        // Fetch attendance data
        const response = await http(`/api/live-attendance/session/${sessionId}`)
        const { participants: sessionParticipants, enrolled_students, attendance_records } = response
        
        setParticipants(sessionParticipants || [])
        setEnrolledStudents(enrolled_students || [])
        
        // Transform attendance records to the format we need
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {}
        attendance_records?.forEach((record: any) => {
          initialAttendance[record.student_email] = record.status
        })
        
        setAttendance(initialAttendance)
      } catch (err: any) {
        setError(err.message || "Failed to load data")
        setParticipants([])
        setEnrolledStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  const updateAttendance = (email: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [email]: status
    }))
  }

  const exportAttendance = () => {
    const csvContent = [
      ['Student Email', 'Name', 'Attendance Status', 'Timestamp'],
      ...participants.map(participant => [
        participant.email,
        participant.name || 'N/A',
        attendance[participant.email] || 'present',
        new Date().toISOString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast({ title: "Attendance exported", description: "Attendance data has been downloaded as CSV" })
  }

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(status => status === 'present').length
    const absent = Object.values(attendance).filter(status => status === 'absent').length
    const late = Object.values(attendance).filter(status => status === 'late').length
    return { present, absent, late }
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div>
        <div className="text-xs text-slate-300 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Attendance
        </div>
        <div className="text-slate-400 text-sm">Loading participants...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="text-xs text-slate-300 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Attendance
        </div>
        <div className="text-red-300 text-sm">Error loading participants</div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-xs text-slate-300 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Attendance ({viewMode === 'all' ? enrolledStudents.length : participants.length})
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <Button
                size="sm"
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => setViewMode('all')}
                className="h-6 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                All Students
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'present' ? 'default' : 'outline'}
                onClick={() => setViewMode('present')}
                className="h-6 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                Present Only
              </Button>
              <Button size="sm" variant="outline" onClick={exportAttendance} className="h-6 text-xs bg-white/10 text-white hover:bg-white/20 border-white/20">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded bg-green-500/20 border border-green-500/30">
          <div className="text-green-300 text-sm font-medium">{stats.present}</div>
          <div className="text-green-200 text-xs">Present</div>
        </div>
        <div className="text-center p-2 rounded bg-yellow-500/20 border border-yellow-500/30">
          <div className="text-yellow-300 text-sm font-medium">{stats.late}</div>
          <div className="text-yellow-200 text-xs">Late</div>
        </div>
        <div className="text-center p-2 rounded bg-red-500/20 border border-red-500/30">
          <div className="text-red-300 text-sm font-medium">{stats.absent}</div>
          <div className="text-red-200 text-xs">Absent</div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {(() => {
          const displayStudents = viewMode === 'all' ? enrolledStudents : participants
          const currentEmails = participants.map(p => p.email)
          
          if (viewMode === 'all' && enrolledStudents.length === 0) {
            return <div className="text-slate-400 text-sm">No enrolled students found</div>
          }
          
          if (viewMode === 'present' && participants.length === 0) {
            return <div className="text-slate-400 text-sm">No participants yet</div>
          }
          
          return displayStudents.map((student) => {
            const isPresent = currentEmails.includes(student.email)
            const participant = participants.find(p => p.email === student.email)
            
            return (
              <div key={student.email || student.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{student.email?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-slate-200 text-sm">{student.email}</div>
                    {student.name && (
                      <div className="text-slate-400 text-xs">{student.name}</div>
                    )}
                    {viewMode === 'all' && (
                      <div className="text-slate-500 text-xs">
                        {isPresent ? '🟢 Present' : '🔴 Not Present'}
                      </div>
                    )}
                  </div>
                </div>
                
                {isHost ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateAttendance(student.email, 'present')}
                      className={`h-6 w-6 p-0 ${attendance[student.email] === 'present' ? 'bg-green-500/20 text-green-300' : 'text-slate-400 hover:text-green-300'}`}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateAttendance(student.email, 'late')}
                      className={`h-6 w-6 p-0 ${attendance[student.email] === 'late' ? 'bg-yellow-500/20 text-yellow-300' : 'text-slate-400 hover:text-yellow-300'}`}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateAttendance(student.email, 'absent')}
                      className={`h-6 w-6 p-0 ${attendance[student.email] === 'absent' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-red-300'}`}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      attendance[student.email] === 'present' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : attendance[student.email] === 'late'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {attendance[student.email] || 'Present'}
                  </Badge>
                )}
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}
