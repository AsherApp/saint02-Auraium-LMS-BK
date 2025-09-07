import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  Settings,
  Copy,
  ExternalLink,
  Edit,
  Trash2
} from "lucide-react"
import { dateUtils } from "@/utils/date-utils"

interface Session {
  id: string
  title: string
  description?: string
  status: string
  start_time?: string
  end_at?: string
  session_type?: string
  course_title?: string
  is_started?: boolean
  started_at?: string
  created_at: string
}

interface SessionInfoProps {
  session: Session
  onEdit: () => void
  onDelete: () => void
  onStart: () => void
  onEnd: () => void
  onCopyLink: () => void
}

export function SessionInfo({ 
  session, 
  onEdit, 
  onDelete, 
  onStart, 
  onEnd, 
  onCopyLink 
}: SessionInfoProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case 'scheduled':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case 'ended':
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case 'paused':
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />
      case 'scheduled':
        return <Calendar className="h-4 w-4" />
      case 'ended':
        return <Clock className="h-4 w-4" />
      case 'paused':
        return <Video className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">{session.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${getStatusColor(session.status)} border`}
          >
            {getStatusIcon(session.status)}
            <span className="ml-1 capitalize">{session.status}</span>
          </Badge>
        </div>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-slate-400 mb-4">{session.description}</p>
      )}

      {/* Session Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {session.course_title && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Course</p>
              <p className="text-sm text-white font-medium">{session.course_title}</p>
            </div>
          </div>
        )}

        {session.start_time && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
            <Calendar className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Start Time</p>
              <p className="text-sm text-white font-medium">
                {dateUtils.formatDateTime(session.start_time)}
              </p>
            </div>
          </div>
        )}

        {session.end_at && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
            <Clock className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-xs text-slate-400">End Time</p>
              <p className="text-sm text-white font-medium">
                {dateUtils.formatDateTime(session.end_at)}
              </p>
            </div>
          </div>
        )}

        {session.session_type && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
            <Video className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-xs text-slate-400">Type</p>
              <p className="text-sm text-white font-medium capitalize">
                {session.session_type}
              </p>
            </div>
          </div>
        )}

        {session.is_started && session.started_at && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
            <Play className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Started At</p>
              <p className="text-sm text-white font-medium">
                {dateUtils.formatDateTime(session.started_at)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-400">Created</p>
            <p className="text-sm text-white font-medium">
              {dateUtils.formatDateTime(session.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {session.status === 'scheduled' && (
          <Button
            onClick={onStart}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        )}

        {session.status === 'active' && (
          <Button
            onClick={onEnd}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Clock className="h-4 w-4 mr-2" />
            End Session
          </Button>
        )}

        <Button
          onClick={onCopyLink}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>

        <Button
          onClick={onEdit}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>

        <Button
          onClick={onDelete}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
