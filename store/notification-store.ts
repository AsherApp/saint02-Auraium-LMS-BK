import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  type: 'announcement' | 'discussion' | 'assignment' | 'live_class' | 'message' | 'system'
  title: string
  message: string
  timestamp: Date | string
  read: boolean
  actionUrl?: string
  metadata?: {
    courseId?: string
    assignmentId?: string
    discussionId?: string
    senderEmail?: string
    senderName?: string
  }
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  showNotificationCenter: boolean
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  addNotificationSilent: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  toggleNotificationCenter: () => void
  setShowNotificationCenter: (show: boolean) => void
  
  // Computed
  getUnreadCount: () => number
  getNotificationsByType: (type: Notification['type']) => Notification[]
  getRecentNotifications: (limit?: number) => Notification[]
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      showNotificationCenter: false,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false
        }

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 100) // Keep only last 100
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })

        // Show toast notification
        if (typeof window !== 'undefined') {
          // Import dynamically to avoid SSR issues
          import('@/hooks/use-toast').then(({ toast }) => {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'system' ? 'destructive' : 'default'
            })
          })
        }
      },

      addNotificationSilent: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false
        }

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 100) // Keep only last 100
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })

        // No toast notification for silent additions
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },

      removeNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== id)
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },

      toggleNotificationCenter: () => {
        set((state) => ({ showNotificationCenter: !state.showNotificationCenter }))
      },

      setShowNotificationCenter: (show) => {
        set({ showNotificationCenter: show })
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type)
      },

      getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit)
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.notifications) {
          // Convert timestamp strings back to Date objects
          state.notifications = state.notifications.map(notification => ({
            ...notification,
            timestamp: new Date(notification.timestamp)
          }))
        }
      }
    }
  )
)
