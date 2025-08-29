"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { Bell, X, CheckCircle, Award, MessageSquare, BarChart3, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: 'poll_response' | 'course_completion' | 'assignment_graded' | 'discussion_reply' | 'progress_update'
  title: string
  message: string
  courseId?: string
  courseTitle?: string
  timestamp: string
  read: boolean
  metadata?: any
}

export function NotificationSystem() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const response = await http<Notification[]>(`/api/notifications/${user.email}`)
      setNotifications(response || [])
      setUnreadCount(response?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await http(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await http(`/api/notifications/${user?.email}/read-all`, {
        method: 'POST'
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'poll_response':
        return <BarChart3 className="h-4 w-4 text-blue-400" />
      case 'course_completion':
        return <Award className="h-4 w-4 text-green-400" />
      case 'assignment_graded':
        return <CheckCircle className="h-4 w-4 text-purple-400" />
      case 'discussion_reply':
        return <MessageSquare className="h-4 w-4 text-orange-400" />
      case 'progress_update':
        return <BookOpen className="h-4 w-4 text-indigo-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  // Get notification badge color
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'poll_response':
        return 'bg-blue-500'
      case 'course_completion':
        return 'bg-green-500'
      case 'assignment_graded':
        return 'bg-purple-500'
      case 'discussion_reply':
        return 'bg-orange-500'
      case 'progress_update':
        return 'bg-indigo-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  // Poll for new notifications
  useEffect(() => {
    if (!user?.email) return

    fetchNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user?.email])

  // Show toast for new notifications
  useEffect(() => {
    const newNotifications = notifications.filter(n => !n.read && new Date(n.timestamp) > new Date(Date.now() - 30000))
    
    newNotifications.forEach(notification => {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      })
    })
  }, [notifications, toast])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative text-white hover:text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs ${getNotificationBadgeColor('default')}`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotifications(false)}
                  className="text-white hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-white/5 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          <span className="text-slate-400 text-xs">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.courseTitle && (
                          <p className="text-slate-400 text-xs mt-1">
                            {notification.courseTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
