"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
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
  GraduationCap,
  CreditCard
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  if (!user) return null

  // Check if student is in public mode (simplified environment)
  const isPublicMode = pathname.startsWith('/student/public-') || 
                      (user.role === 'student' && pathname.includes('public'))

const teacherItems = [
    {
      title: "Core",
      items: [
        {
          title: "Dashboard",
          href: "/teacher/dashboard",
          icon: Home,
          description: "Overview & analytics"
        },
        {
          title: "Courses",
          href: "/teacher/courses",
          icon: BookOpen,
          description: "Manage courses"
        },
        {
          title: "Assignments",
          href: "/teacher/assignments",
          icon: FileText,
          description: "Create & grade"
        },
        {
          title: "Live Classes",
          href: "/teacher/live-class",
          icon: Video,
          description: "Host sessions"
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          title: "Students",
          href: "/teacher/student-management",
          icon: Users,
          description: "Manage enrollments"
        },
        {
          title: "Performance",
          href: "/teacher/performance",
          icon: BarChart3,
          description: "Analytics"
        }
      ]
    },
    {
      title: "Communication",
      items: [
        {
          title: "Discussions",
          href: "/teacher/discussions",
          icon: MessageCircle,
          description: "Forum & announcements"
        },
        {
          title: "Calendar",
          href: "/teacher/calendar",
          icon: Calendar,
          description: "Events and scheduling"
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
          title: "Settings",
          href: "/teacher/settings",
          icon: Settings,
          description: "Profile & preferences"
        },
        {
          title: "Billing",
          href: "/teacher/billing",
          icon: CreditCard,
          description: "Subscription"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          title: "Contact",
          href: "/contact",
          icon: HelpCircle,
          description: "Get help"
        }
      ]
    }
]

const studentItems = [
    {
      title: "Core",
      items: [
        {
          title: "Dashboard",
          href: "/student/dashboard",
          icon: Home,
          description: "Learning overview"
        },
        {
          title: "Courses",
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
          description: "Join sessions"
        }
      ]
    },
    {
      title: "Progress",
      items: [
        {
          title: "Performance",
          href: "/student/performance",
          icon: BarChart3,
          description: "Analytics"
        },
        {
          title: "Notes",
          href: "/student/notes",
          icon: StickyNote,
          description: "Personal notes"
        },
        {
          title: "Recordings",
          href: "/student/recordings",
          icon: Video,
          description: "Recorded sessions"
        }
      ]
    },
    {
      title: "Communication",
      items: [
        {
          title: "Discussions",
          href: "/student/discussions",
          icon: MessageCircle,
          description: "Forum & announcements"
        },
        {
          title: "Calendar",
          href: "/student/calendar",
          icon: Calendar,
          description: "Events and schedule"
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
          title: "Settings",
          href: "/student/settings",
          icon: Settings,
          description: "Profile & preferences"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          title: "Contact",
          href: "/contact",
          icon: HelpCircle,
          description: "Get help"
        }
      ]
    }
  ]

  // Filter student items for public mode
  const getFilteredStudentItems = () => {
    if (!isPublicMode) return studentItems
    
    // For public mode, only show essential items
    return [
      {
        title: "Core",
        items: [
          {
            title: "Dashboard",
            href: "/student/public-dashboard",
            icon: Home,
            description: "Learning overview"
          },
          {
            title: "Courses",
            href: "/student/courses",
            icon: BookOpen,
            description: "Enrolled courses"
          }
        ]
      },
      {
        title: "Learning",
        items: [
          {
            title: "Notes",
            href: "/student/notes",
            icon: StickyNote,
            description: "Personal notes"
          }
        ]
      },
      {
        title: "Account",
        items: [
          {
            title: "Settings",
            href: "/student/settings",
            icon: Settings,
            description: "Profile settings"
          }
        ]
      }
    ]
  }

  const items = user.role === "teacher" ? teacherItems : getFilteredStudentItems()

  return (
    <div className="flex h-full w-64 flex-col bg-white/5 backdrop-blur border-r border-white/10">
      {/* Header */}
      <motion.div 
        className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
            whileHover={{ 
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
            }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white font-bold text-sm">L</span>
          </motion.div>
          <motion.span 
            className="font-semibold text-white"
            whileHover={{ 
              background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent"
            }}
            transition={{ duration: 0.3 }}
          >
            AuraiumLMS
          </motion.span>
        </motion.div>
      </motion.div>

      {/* User Info */}
      <motion.div 
        className="p-4 border-b border-white/10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Public Mode Indicator */}
        {isPublicMode && (
          <motion.div 
            className="mb-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-blue-400 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Public Learning Mode</span>
            </div>
            <p className="text-blue-300/70 text-xs mt-1">
              Simplified environment
            </p>
          </motion.div>
        )}
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)"
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {user.role === "teacher" ? (
                <GraduationCap className="h-5 w-5 text-white" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </motion.div>
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.p 
              className="text-sm font-medium text-white truncate"
              whileHover={{ 
                background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent"
              }}
              transition={{ duration: 0.3 }}
            >
              {user.name || user.email}
            </motion.p>
            <motion.p 
              className="text-xs text-slate-400 capitalize hover:text-purple-400 transition-colors duration-300"
            >
              {user.role}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation */}
      <motion.div 
        className="flex-1 overflow-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="grid items-start gap-2 p-4">
          {items.map((group, groupIndex) => (
            <motion.div 
              key={groupIndex} 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + groupIndex * 0.1 }}
            >
              <motion.h4 
                className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2"
                whileHover={{ 
                  color: "#8b5cf6",
                  x: 5
                }}
                transition={{ duration: 0.3 }}
              >
                {group.title}
              </motion.h4>
              {group.items.map((item, itemIndex) => {
                const isActive = pathname === item.href
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + groupIndex * 0.1 + itemIndex * 0.05 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link href={item.href}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-3 h-auto p-3 text-left transition-all duration-300",
                            isActive
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/20"
                              : "text-slate-300 hover:text-white hover:bg-white/10 hover:border hover:border-white/20"
                          )}
                        >
                          <motion.div
                            whileHover={{ 
                              scale: 1.2,
                              rotate: [0, -10, 10, 0]
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <motion.div 
                              className="font-medium"
                              whileHover={{ 
                                background: isActive ? "linear-gradient(45deg, #3b82f6, #8b5cf6)" : "linear-gradient(45deg, #ffffff, #e2e8f0)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                color: "transparent"
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {item.title}
                            </motion.div>
                            <motion.div 
                              className="text-xs text-slate-400 truncate hover:text-purple-400 transition-colors duration-300"
                            >
                              {item.description}
                            </motion.div>
                          </div>
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
              {groupIndex < items.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + groupIndex * 0.1 }}
                >
                  <Separator className="my-2 bg-white/10" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </nav>
      </motion.div>

      {/* Quick Stats - Only show for teachers */}
      {user.role === "teacher" && (
        <motion.div 
          className="p-4 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div 
            className="space-y-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Active Courses</span>
              <motion.span 
                className="text-white font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#3b82f6"
                }}
                transition={{ duration: 0.3 }}
              >
                3
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Pending Grades</span>
              <motion.span 
                className="text-orange-400 font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#f97316"
                }}
                transition={{ duration: 0.3 }}
              >
                12
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Live Sessions</span>
              <motion.span 
                className="text-green-400 font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#22c55e"
                }}
                transition={{ duration: 0.3 }}
              >
                2
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Quick Stats - Only show for students */}
      {user.role === "student" && (
        <motion.div 
          className="p-4 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div 
            className="space-y-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Enrolled Courses</span>
              <motion.span 
                className="text-white font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#3b82f6"
                }}
                transition={{ duration: 0.3 }}
              >
                4
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Due Assignments</span>
              <motion.span 
                className="text-orange-400 font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#f97316"
                }}
                transition={{ duration: 0.3 }}
              >
                3
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 transition-colors duration-300"
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-slate-400">Average Grade</span>
              <motion.span 
                className="text-green-400 font-medium"
                whileHover={{ 
                  scale: 1.2,
                  color: "#22c55e"
                }}
                transition={{ duration: 0.3 }}
              >
                87%
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
