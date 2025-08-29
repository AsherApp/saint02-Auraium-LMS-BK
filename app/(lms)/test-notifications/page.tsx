"use client"

import { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notificationService } from "@/services/notification-service"
import { useNotificationStore } from "@/store/notification-store"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  MessageSquare,
  BookOpen,
  Video,
  Megaphone,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"

export default function TestNotificationsPage() {
  const { toast } = useToast()
  const { clearAll, getUnreadCount } = useNotificationStore()
  const [isLoading, setIsLoading] = useState(false)

  const testNotifications = [
    {
      title: "Test Announcement",
      action: () => notificationService.newAnnouncement({
        message: "This is a test announcement for demonstration purposes.",
        course_id: "test-course-123"
      }, "Test Course")
    },
    {
      title: "Test Discussion",
      action: () => notificationService.newDiscussion({
        title: "Test Discussion Topic",
        content: "This is a test discussion for demonstration.",
        course_id: "test-course-123",
        created_by: "teacher@test.com"
      }, "Test Course")
    },
    {
      title: "Test Assignment",
      action: () => notificationService.newAssignment({
        title: "Test Assignment",
        description: "This is a test assignment for demonstration.",
        course_id: "test-course-123",
        created_by: "teacher@test.com"
      }, "Test Course")
    },
    {
      title: "Test Live Class",
      action: () => notificationService.liveClassStarting({
        title: "Test Live Class",
        course_id: "test-course-123",
        host_email: "teacher@test.com"
      }, 5)
    },
    {
      title: "Test Message",
      action: () => notificationService.newMessage({
        content: "This is a test message for demonstration.",
        sender_email: "student@test.com"
      }, "Test Student")
    },
    {
      title: "Test Success",
      action: () => notificationService.success("Operation Successful", "The operation completed successfully!")
    },
    {
      title: "Test Error",
      action: () => notificationService.error("Operation Failed", "Something went wrong. Please try again.")
    },
    {
      title: "Test System Message",
      action: () => notificationService.systemMessage("System Update", "The system has been updated successfully.")
    }
  ]

  const handleTestNotification = async (test: any) => {
    setIsLoading(true)
    try {
      test.action()
      toast({
        title: "Test Notification Sent",
        description: `${test.title} notification has been triggered. Check the notification bell!`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = () => {
    clearAll()
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared.",
      variant: "default"
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notification System Test</h1>
          <p className="text-slate-300">Test the comprehensive notification system</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-white border-white/20">
            Unread: {getUnreadCount()}
          </Badge>
          <Button
            onClick={handleClearAll}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Test Different Notification Types</h2>
          <p className="text-slate-400">Click any button below to test different types of notifications. Check the notification bell in the navbar to see them!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testNotifications.map((test, index) => (
            <Button
              key={index}
              onClick={() => handleTestNotification(test)}
              disabled={isLoading}
              className="h-auto p-4 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            >
              <div className="flex items-center gap-2">
                {test.title.includes("Announcement") && <Megaphone className="h-5 w-5 text-blue-400" />}
                {test.title.includes("Discussion") && <MessageSquare className="h-5 w-5 text-green-400" />}
                {test.title.includes("Assignment") && <BookOpen className="h-5 w-5 text-orange-400" />}
                {test.title.includes("Live Class") && <Video className="h-5 w-5 text-red-400" />}
                {test.title.includes("Message") && <MessageSquare className="h-5 w-5 text-purple-400" />}
                {test.title.includes("Success") && <CheckCircle className="h-5 w-5 text-green-400" />}
                {test.title.includes("Error") && <AlertCircle className="h-5 w-5 text-red-400" />}
                {test.title.includes("System") && <Settings className="h-5 w-5 text-gray-400" />}
              </div>
              <span className="text-sm font-medium">{test.title}</span>
            </Button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Notification Features</h2>
          <p className="text-slate-400">The notification system includes the following features:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Real-time Notifications</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Toast notifications for immediate feedback
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Persistent notification storage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Unread count badges
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Notification center with tabs
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Notification Types</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-400" />
                Announcements (Blue)
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-400" />
                Discussions (Green)
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-400" />
                Assignments (Orange)
              </li>
              <li className="flex items-center gap-2">
                <Video className="h-4 w-4 text-red-400" />
                Live Classes (Red)
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                Messages (Purple)
              </li>
              <li className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-400" />
                System (Gray)
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Integration Points</h2>
          <p className="text-slate-400">The notification system is integrated into:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <h4 className="font-medium text-white mb-2">Assignment Creation</h4>
            <p className="text-sm text-slate-400">Triggers notifications when teachers create new assignments</p>
          </div>
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <h4 className="font-medium text-white mb-2">Announcement Creation</h4>
            <p className="text-sm text-slate-400">Triggers notifications when teachers post announcements</p>
          </div>
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <h4 className="font-medium text-white mb-2">Live Class Events</h4>
            <p className="text-sm text-slate-400">Triggers notifications for live class start times</p>
          </div>
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <h4 className="font-medium text-white mb-2">System Events</h4>
            <p className="text-sm text-slate-400">Triggers notifications for system updates and errors</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
