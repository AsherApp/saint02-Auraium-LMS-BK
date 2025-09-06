"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, CheckCircle, AlertCircle, Info, MessageSquare, BookOpen, Users, Activity, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"
import { http } from "@/services/http"

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning' | 'announcement' | 'assignment' | 'course' | 'live' | 'grade' | 'deadline' | 'enrollment'
  timestamp: string
  read: boolean
  courseTitle?: string
  courseId?: string
  metadata?: any
}

export function NotificationSystem() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    if (!user?.email) return

    try {
      setLoading(true)
      const response = await http<{ items: Notification[] }>(`/api/notifications/me`)
      const fetchedNotifications = response.items || []
      
      // Transform API data to match our interface
      const transformedNotifications = fetchedNotifications.map((notification: any) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: notification.created_at || notification.timestamp,
        read: notification.read || false,
        courseTitle: notification.course_title,
        courseId: notification.course_id,
        metadata: notification.metadata
      }))
      
      setNotifications(transformedNotifications)
      setUnreadCount(transformedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Fallback to empty array on error
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await http(`/api/notifications/${id}/read`, {
        method: 'POST'
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Update locally even if API fails
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await http(`/api/notifications/me/read-all`, {
        method: 'POST'
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      // Update locally even if API fails
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    if (user?.email) {
      fetchNotifications()
      
      // Poll for new notifications every 60 seconds (reduced frequency)
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user?.email]) // Only depend on email, not the entire user object

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />
      case 'announcement':
        return <Bell className="h-4 w-4 text-purple-400" />
      case 'assignment':
        return <BookOpen className="h-4 w-4 text-orange-400" />
      case 'course':
        return <BookOpen className="h-4 w-4 text-blue-400" />
      case 'live':
        return <Activity className="h-4 w-4 text-green-400" />
      case 'grade':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'deadline':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'enrollment':
        return <Users className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
      case 'announcement':
        return 'bg-purple-500 text-white'
      case 'assignment':
        return 'bg-orange-500 text-white'
      case 'course':
        return 'bg-blue-500 text-white'
      case 'live':
        return 'bg-green-500 text-white'
      case 'grade':
        return 'bg-green-500 text-white'
      case 'deadline':
        return 'bg-red-500 text-white'
      case 'enrollment':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return time.toLocaleDateString()
  }

  return (
    <div className="relative z-[99999] isolate">
      {/* Enhanced Notification Bell */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative text-white hover:text-white hover:bg-white/10 transition-all duration-300 group"
        >
          <motion.div
            animate={unreadCount > 0 ? { 
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ 
              duration: 0.6, 
              repeat: unreadCount > 0 ? Infinity : 0, 
              repeatDelay: 3 
            }}
          >
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          </motion.div>
          
          {/* Enhanced Badge with pulse effect */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge 
                className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center ${
                  getNotificationBadgeColor('default')
                }`}
              >
                <motion.span
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              </Badge>
            </motion.div>
          )}
          
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 rounded-md bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Button>
      </motion.div>

      {/* Enhanced Notification Panel - Fixed overlay positioning */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999998]"
              style={{ zIndex: 999998 }}
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed right-4 top-20 w-80 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden"
              style={{ zIndex: 999999 }}
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={markAllAsRead}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer ${
                          !notification.read ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            {notification.courseTitle && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{notification.courseTitle}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-700 to-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    <span>{unreadCount} unread</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
