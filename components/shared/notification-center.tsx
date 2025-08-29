"use client"

import { useState } from "react"
import { useNotificationStore } from "@/store/notification-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  MessageSquare,
  BookOpen,
  Video,
  Megaphone,
  Settings,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  X
} from "lucide-react"
import Link from "next/link"

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    showNotificationCenter,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setShowNotificationCenter,
    getNotificationsByType
  } = useNotificationStore()

  const [activeTab, setActiveTab] = useState("all")

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-blue-400" />
      case 'discussion':
        return <MessageSquare className="h-4 w-4 text-green-400" />
      case 'assignment':
        return <BookOpen className="h-4 w-4 text-orange-400" />
      case 'live_class':
        return <Video className="h-4 w-4 text-red-400" />
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-400" />
      case 'system':
        return <Settings className="h-4 w-4 text-gray-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'border-blue-500/30 bg-blue-500/10'
      case 'discussion':
        return 'border-green-500/30 bg-green-500/10'
      case 'assignment':
        return 'border-orange-500/30 bg-orange-500/10'
      case 'live_class':
        return 'border-red-500/30 bg-red-500/10'
      case 'message':
        return 'border-purple-500/30 bg-purple-500/10'
      case 'system':
        return 'border-gray-500/30 bg-gray-500/10'
      default:
        return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const formatTimeAgo = (timestamp: Date | string) => {
    const now = new Date()
    const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp)
    const diff = now.getTime() - timestampDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : getNotificationsByType(activeTab as any)

  const unreadNotifications = filteredNotifications.filter(n => !n.read)

  return (
    <>
      {/* Notification Bell with Badge */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotificationCenter(true)}
        className="relative p-2 text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Center Dialog */}
      <Dialog open={showNotificationCenter} onOpenChange={setShowNotificationCenter}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-black/90 border-white/10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl font-semibold">
                Notifications
              </DialogTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs border-white/20 text-white hover:bg-white/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-white/5 border-white/10">
                <TabsTrigger value="all" className="text-white data-[state=active]:bg-white/10">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="announcement" className="text-white data-[state=active]:bg-white/10">
                  Announcements ({getNotificationsByType('announcement').length})
                </TabsTrigger>
                <TabsTrigger value="discussion" className="text-white data-[state=active]:bg-white/10">
                  Discussions ({getNotificationsByType('discussion').length})
                </TabsTrigger>
                <TabsTrigger value="assignment" className="text-white data-[state=active]:bg-white/10">
                  Assignments ({getNotificationsByType('assignment').length})
                </TabsTrigger>
                <TabsTrigger value="live_class" className="text-white data-[state=active]:bg-white/10">
                  Live Classes ({getNotificationsByType('live_class').length})
                </TabsTrigger>
                <TabsTrigger value="message" className="text-white data-[state=active]:bg-white/10">
                  Messages ({getNotificationsByType('message').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-2 pr-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <GlassCard
                        key={notification.id}
                        className={`p-4 cursor-pointer transition-all hover:bg-white/5 ${
                          !notification.read ? 'border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id)
                          }
                          if (notification.actionUrl) {
                            window.open(notification.actionUrl, '_blank')
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium text-sm ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {notification.metadata?.senderName && (
                              <p className="text-xs text-slate-500 mt-1">
                                From: {notification.metadata.senderName}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(notification.actionUrl, '_blank')
                                }}
                                className="p-1 h-auto text-slate-400 hover:text-white"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              className="p-1 h-auto text-slate-400 hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
