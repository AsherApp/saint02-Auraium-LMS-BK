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
  const [attendanceReport, setAttendanceReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'present' | 'absent' | 'late'>('all')
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      try {
        // Fetch attendance data
        const response = await http(`/api/live-attendance/session/${sessionId}`)
        const { participants: sessionParticipants, enrolled_students, attendance_records, report } = response
        
        setParticipants(sessionParticipants || [])
        setEnrolledStudents(enrolled_students || [])
        setAttendanceReport(report)
        
        // Transform attendance records to the format we need
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {}
        attendance_records?.forEach((record: any) => {
          initialAttendance[record.student_email] = record.status
        })
        
        setAttendance(initialAttendance)
        
        // Auto-mark students as present if they're currently in the session
        if (isHost && sessionParticipants && sessionParticipants.length > 0 && enrolledStudents && enrolledStudents.length > 0) {
          const enrolledEmails = new Set(enrolledStudents.map((s: any) => s.email?.toLowerCase().trim()).filter(Boolean))
          
          const autoMarkPromises = sessionParticipants
            .filter((participant: any) => {
              const email = participant.email?.toLowerCase().trim()
              return email && enrolledEmails.has(email) && !initialAttendance[email]
            })
            .map(async (participant: any) => {
              try {
                await http(`/api/live-attendance/session/${sessionId}/mark`, {
                  method: 'POST',
                  body: JSON.stringify({
                    student_email: participant.email.toLowerCase().trim(),
                    status: 'present',
                    notes: 'Auto-marked as present (joined session)',
                    participation_score: 0,
                    engagement_score: 0
                  })
                })
                console.log('Auto-marked attendance for enrolled student:', participant.email)
              } catch (err) {
                console.log('Failed to auto-mark attendance for', participant.email, err)
              }
            })
          
          // Don't wait for all promises to complete
          Promise.allSettled(autoMarkPromises)
        }
        
        // Auto-generate report if session has ended and no report exists
        if (isHost && !attendanceReport && enrolledStudents && enrolledStudents.length > 0) {
          try {
            await http(`/api/live-attendance/session/${sessionId}/report`, {
              method: 'POST'
            })
            console.log('Auto-generated attendance report for session', sessionId)
          } catch (err) {
            console.log('Failed to auto-generate report for session', sessionId, err)
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data")
        setParticipants([])
        setEnrolledStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Set up polling to refresh attendance data every 10 seconds
    const interval = setInterval(fetchData, 10000)
    
    return () => clearInterval(interval)
  }, [sessionId])

  const updateAttendance = async (email: string, status: 'present' | 'absent' | 'late') => {
    if (!email || !email.trim()) {
      toast({ 
        title: "Error", 
        description: "Invalid student email",
        variant: "destructive"
      })
      return
    }

    try {
      // Update local state immediately for better UX
      setAttendance(prev => ({
        ...prev,
        [email]: status
      }))
      
      // Save to backend
      const response = await http(`/api/live-attendance/session/${sessionId}/mark`, {
        method: 'POST',
        body: JSON.stringify({
          student_email: email.toLowerCase().trim(),
          status: status,
          notes: '',
          participation_score: 0,
          engagement_score: 0
        })
      })
      
      console.log('Attendance marked successfully:', response)
      
      toast({ 
        title: "Attendance Updated", 
        description: `Marked ${email} as ${status}`,
        variant: "default"
      })
    } catch (err: any) {
      // Revert local state on error
      setAttendance(prev => ({
        ...prev,
        [email]: prev[email] || 'absent'
      }))
      
      console.error('Attendance update error:', err)
      
      let errorMessage = "Failed to update attendance"
      if (err.message) {
        if (err.message.includes('not enrolled')) {
          errorMessage = `${email} is not enrolled in this course`
        } else if (err.message.includes('not found')) {
          errorMessage = "Session not found"
        } else if (err.message.includes('not authorized')) {
          errorMessage = "Not authorized to mark attendance"
        } else {
          errorMessage = err.message
        }
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const generateReport = async () => {
    try {
      await http(`/api/live-attendance/session/${sessionId}/report`, {
        method: 'POST'
      })
      
      toast({ 
        title: "Report Generated", 
        description: "Attendance report has been generated and saved",
        variant: "default"
      })
      
      // Refresh data to show updated report
      const response = await http(`/api/live-attendance/session/${sessionId}`)
      setAttendanceReport(response.report)
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to generate report",
        variant: "destructive"
      })
    }
  }

  const exportAttendance = () => {
    const csvContent = [
      ['Student Email', 'Name', 'Attendance Status', 'Timestamp'],
      ...enrolledStudents.map(student => [
        student.email,
        student.name || 'N/A',
        attendance[student.email] || 'absent',
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
  
  // Calculate attendance rate
  const totalStudents = enrolledStudents.length
  const attendanceRate = totalStudents > 0 ? Math.round((stats.present + stats.late) / totalStudents * 100) : 0

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
                All
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'present' ? 'default' : 'outline'}
                onClick={() => setViewMode('present')}
                className="h-6 text-xs bg-green-600/80 hover:bg-green-600 text-white"
              >
                Present
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'late' ? 'default' : 'outline'}
                onClick={() => setViewMode('late')}
                className="h-6 text-xs bg-yellow-600/80 hover:bg-yellow-600 text-white"
              >
                Late
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'absent' ? 'default' : 'outline'}
                onClick={() => setViewMode('absent')}
                className="h-6 text-xs bg-red-600/80 hover:bg-red-600 text-white"
              >
                Absent
              </Button>
              <Button size="sm" variant="outline" onClick={exportAttendance} className="h-6 text-xs bg-white/10 text-white hover:bg-white/20 border-white/20">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={generateReport}
                className="h-6 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                <Users className="h-3 w-3 mr-1" />
                Generate Report
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  try {
                    const attendanceData = enrolledStudents.map(student => ({
                      student_email: student.email,
                      status: attendance[student.email] || 'absent',
                      notes: '',
                      participation_score: 0,
                      engagement_score: 0
                    }))
                    
                    await http(`/api/live-attendance/session/${sessionId}/bulk-mark`, {
                      method: 'POST',
                      body: JSON.stringify({ attendance_data: attendanceData })
                    })
                    
                    toast({ title: "Success", description: "Attendance marked for all students" })
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message || "Failed to mark attendance" })
                  }
                }}
                className="h-6 text-xs bg-green-600/80 hover:bg-green-600 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
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
        <div className="text-center p-2 rounded bg-blue-500/20 border border-blue-500/30">
          <div className="text-blue-300 text-sm font-medium">{attendanceRate}%</div>
          <div className="text-blue-200 text-xs">Rate</div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {isHost && attendanceReport && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm font-medium text-white mb-2">📊 Session Analytics</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Total Enrolled:</span>
              <span className="text-white font-medium">{totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Attendance Rate:</span>
              <span className={`font-medium ${attendanceRate >= 80 ? 'text-green-400' : attendanceRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {attendanceRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Currently Online:</span>
              <span className="text-green-400 font-medium">{participants.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Session Duration:</span>
              <span className="text-white font-medium">
                {attendanceReport.session_duration ? 
                  `${Math.floor(attendanceReport.session_duration / 60)}m ${attendanceReport.session_duration % 60}s` : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {(() => {
          let displayStudents = enrolledStudents
          const currentEmails = participants.map(p => p.email)
          
          // Filter based on view mode
          if (viewMode === 'present') {
            displayStudents = enrolledStudents.filter(student => 
              currentEmails.includes(student.email) && attendance[student.email] === 'present'
            )
          } else if (viewMode === 'late') {
            displayStudents = enrolledStudents.filter(student => 
              attendance[student.email] === 'late'
            )
          } else if (viewMode === 'absent') {
            displayStudents = enrolledStudents.filter(student => 
              attendance[student.email] === 'absent' || (!currentEmails.includes(student.email) && !attendance[student.email])
            )
          }
          
          if (displayStudents.length === 0) {
            return (
              <div className="text-slate-400 text-sm">
                {viewMode === 'all' ? 'No enrolled students found' : 
                 viewMode === 'present' ? 'No present students' :
                 viewMode === 'late' ? 'No late students' :
                 viewMode === 'absent' ? 'No absent students' : 'No participants yet'}
              </div>
            )
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
                    <div className="text-slate-200 text-sm">{student.name || student.email}</div>
                    {student.name && (
                      <div className="text-slate-400 text-xs">{student.email}</div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      {isPresent ? (
                        <span className="text-green-400">🟢 Online</span>
                      ) : (
                        <span className="text-slate-500">🔴 Offline</span>
                      )}
                      {attendance[student.email] && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            attendance[student.email] === 'present' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            attendance[student.email] === 'late' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          {attendance[student.email]}
                        </Badge>
                      )}
                      {participant && (
                        <span className="text-slate-500">
                          {Math.floor((Date.now() - new Date(participant.joined_at).getTime()) / 60000)}m
                        </span>
                      )}
                    </div>
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
