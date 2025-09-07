import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  Calendar,
  Download
} from "lucide-react"
import { http } from "@/services/http"

interface AttendanceAnalysisProps {
  sessionId: string
}

export function AttendanceAnalysis({ sessionId }: AttendanceAnalysisProps) {
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true)
        
        // Fetch attendance report
        const reportResponse = await http(`/api/live/${sessionId}/attendance-report`)
        setAttendanceData(reportResponse)

        // Fetch attendance records
        const recordsResponse = await http(`/api/live/${sessionId}/attendance-records`)
        setAttendanceRecords(recordsResponse.records || [])
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchAttendanceData()
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Attendance Analysis</h2>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (!attendanceData) {
    return (
      <div className="bg-white/5 rounded-lg border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Attendance Analysis</h2>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No attendance data available</p>
        </div>
      </div>
    )
  }

  const totalParticipants = attendanceData.total_participants || 0
  const averageAttendanceTime = attendanceData.average_attendance_time || 0
  const peakAttendance = attendanceData.peak_attendance || 0
  const attendanceRate = attendanceData.attendance_rate || 0

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Attendance Analysis</h2>
        </div>
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-slate-400">Total Participants</p>
              <p className="text-2xl font-bold text-white">{totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-white">{attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-sm text-slate-400">Avg. Time</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(averageAttendanceTime / 60)}m
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-sm text-slate-400">Peak Attendance</p>
              <p className="text-2xl font-bold text-white">{peakAttendance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Attendance Records</h3>
        <div className="space-y-3">
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
            </div>
          ) : (
            attendanceRecords.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-medium">
                      {record.student_name ? record.student_name[0] : 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {record.student_name || record.student_email}
                    </p>
                    <p className="text-sm text-slate-400">
                      {record.student_email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/20 text-green-400 border-green-500/30 mb-1"
                  >
                    {record.attendance_duration ? 
                      `${Math.round(record.attendance_duration / 60)}m` : 
                      'N/A'
                    }
                  </Badge>
                  <p className="text-xs text-slate-400">
                    Joined: {new Date(record.joined_at).toLocaleTimeString()}
                  </p>
                  {record.left_at && (
                    <p className="text-xs text-slate-400">
                      Left: {new Date(record.left_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
