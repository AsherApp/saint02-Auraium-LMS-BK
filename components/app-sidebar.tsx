"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  Users,
  FileText,
  Settings,
  User,
  BarChart3,
  Home,
  Video,
  StickyNote,
  Bell,
  MessageSquare,
  MessageCircle,
  Calendar,
  HelpCircle,
  GraduationCap
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  if (!user) return null

const teacherItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/teacher/dashboard",
          icon: Home,
          description: "Overview and analytics"
        }
      ]
    },
    {
      title: "Teaching",
      items: [
        {
          title: "Courses",
          href: "/teacher/courses",
          icon: BookOpen,
          description: "Manage your courses"
        },
        {
          title: "Assignments",
          href: "/teacher/assignments",
          icon: FileText,
          description: "Create and grade assignments"
        },
        {
          title: "Live Classes",
          href: "/teacher/live-class",
          icon: Video,
          description: "Host live sessions"
        }
      ]
    },
    {
      title: "Students",
      items: [
        {
          title: "Student Management",
          href: "/teacher/student-management",
          icon: Users,
          description: "Manage enrollments"
        },
        {
          title: "Performance",
          href: "/teacher/performance",
          icon: BarChart3,
          description: "Student analytics"
        }
      ]
    },
    {
      title: "Communication",
      items: [
        {
          title: "Forum",
          href: "/forum",
          icon: MessageCircle,
          description: "Discussion forum"
        },
        {
          title: "Calendar",
          href: "/teacher/calendar",
          icon: Calendar,
          description: "Events and scheduling"
        },
        {
          title: "Announcements",
          href: "/teacher/announcements",
          icon: Bell,
          description: "Post updates"
        },
        {
          title: "Messages",
          href: "/teacher/messages",
          icon: MessageSquare,
          description: "Student communication"
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          href: "/teacher/profile",
          icon: User,
          description: "Personal settings"
        },
        {
          title: "Settings",
          href: "/teacher/settings",
          icon: Settings,
          description: "App preferences"
        }
      ]
    },
    {
      title: "Help & Support",
      items: [
        {
          title: "Contact Support",
          href: "/contact",
          icon: HelpCircle,
          description: "Get help and assistance"
        },

      ]
    }
]

const studentItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/student/dashboard",
          icon: Home,
          description: "Your learning overview"
        }
      ]
    },
    {
      title: "Learning",
      items: [
        {
          title: "My Courses",
          href: "/student/courses",
          icon: BookOpen,
          description: "Enrolled courses"
        },
        {
          title: "Assignments",
          href: "/student/assignments",
          icon: FileText,
          description: "Your assignments"
        },

        {
          title: "Live Classes",
          href: "/student/live-class",
          icon: Video,
          description: "Join live sessions"
        },
        {
          title: "Recordings",
          href: "/student/recordings",
          icon: Video,
          description: "Watch recorded sessions"
        }
      ]
    },
    {
      title: "Progress & Analytics",
      items: [
        {
          title: "Performance",
          href: "/student/performance",
          icon: BarChart3,
          description: "Analytics & achievements"
        },
        {
          title: "Notes",
          href: "/student/notes",
          icon: StickyNote,
          description: "Personal notes"
        }
      ]
    },
    {
      title: "Communication",
      items: [
        {
          title: "Forum",
          href: "/forum",
          icon: MessageCircle,
          description: "Discussion forum"
        },
        {
          title: "Calendar",
          href: "/student/calendar",
          icon: Calendar,
          description: "Events and schedule"
        },
        {
          title: "Announcements",
          href: "/student/announcements",
          icon: Bell,
          description: "Class updates"
        },
        {
          title: "Messages",
          href: "/student/messages",
          icon: MessageSquare,
          description: "Teacher communication"
        }
      ]
    },
    {
      title: "Account",
      items: [
        {
          title: "Profile",
          href: "/student/profile",
          icon: User,
          description: "Personal settings"
        },
        {
          title: "Settings",
          href: "/student/settings",
          icon: Settings,
          description: "App preferences"
        }
      ]
    },
    {
      title: "Help & Support",
      items: [
        {
          title: "Contact Support",
          href: "/contact",
          icon: HelpCircle,
          description: "Get help and assistance"
        }
      ]
    }
  ]

  const items = user.role === "teacher" ? teacherItems : studentItems

  return (
    <div className="flex h-full w-64 flex-col bg-white/5 backdrop-blur border-r border-white/10">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-white">AuraiumLMS</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            {user.role === "teacher" ? (
              <GraduationCap className="h-5 w-5 text-white" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto">
        <nav className="grid items-start gap-2 p-4">
          {items.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                {group.title}
              </h4>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-auto p-3 text-left",
                        isActive
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
              {groupIndex < items.length - 1 && (
                <Separator className="my-2 bg-white/10" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Quick Stats - Only show for teachers */}
      {user.role === "teacher" && (
        <div className="p-4 border-t border-white/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Courses</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Pending Grades</span>
              <span className="text-orange-400 font-medium">12</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Live Sessions</span>
              <span className="text-green-400 font-medium">2</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Only show for students */}
      {user.role === "student" && (
        <div className="p-4 border-t border-white/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Enrolled Courses</span>
              <span className="text-white font-medium">4</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Due Assignments</span>
              <span className="text-orange-400 font-medium">3</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Average Grade</span>
              <span className="text-green-400 font-medium">87%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
