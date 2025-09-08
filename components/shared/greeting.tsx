"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getUserDisplayName } from "@/utils/name-utils"
import { Sun, Moon, Coffee, BookOpen, Star, Sparkles } from "lucide-react"

interface User {
  first_name?: string
  last_name?: string
  name?: string
  email?: string
}

interface GreetingProps {
  userName?: string
  user?: User | null
  className?: string
  showIcon?: boolean
}

export function Greeting({ userName, user, className = "", showIcon = true }: GreetingProps) {
  const displayName = user ? getUserDisplayName(user) : (userName || "Student")
  const [greeting, setGreeting] = useState("")
  const [icon, setIcon] = useState(<Sun className="h-5 w-5" />)
  const [timeOfDay, setTimeOfDay] = useState("")

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      let greetingText = ""
      let greetingIcon = <Sun className="h-5 w-5" />
      let timeText = ""

      if (hour >= 5 && hour < 12) {
        greetingText = "Good morning"
        greetingIcon = <Sun className="h-5 w-5 text-yellow-400" />
        timeText = "morning"
      } else if (hour >= 12 && hour < 17) {
        greetingText = "Good afternoon"
        greetingIcon = <Sun className="h-5 w-5 text-orange-400" />
        timeText = "afternoon"
      } else if (hour >= 17 && hour < 21) {
        greetingText = "Good evening"
        greetingIcon = <Moon className="h-5 w-5 text-blue-400" />
        timeText = "evening"
      } else {
        greetingText = "Good night"
        greetingIcon = <Moon className="h-5 w-5 text-indigo-400" />
        timeText = "night"
      }

      setGreeting(greetingText)
      setIcon(greetingIcon)
      setTimeOfDay(timeText)
    }

    updateGreeting()
    
    // Update every minute to keep it fresh
    const interval = setInterval(updateGreeting, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to learn something amazing today?",
      "Let's make today productive!",
      "Time to unlock your potential!",
      "Your learning journey continues!",
      "Every step forward is progress!",
      "Knowledge is power - let's build it!",
      "Today's the day to excel!",
      "Learning never stops - keep going!",
      "Your future self will thank you!",
      "Small steps lead to big achievements!"
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-white/10">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          {greeting}, {displayName}! 👋
        </h2>
        <p className="text-slate-300 text-sm sm:text-base mt-1">
          {getMotivationalMessage()}
        </p>
      </div>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactGreeting({ userName, user, className = "" }: GreetingProps) {
  const displayName = user ? getUserDisplayName(user) : (userName || "Student")
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      let greetingText = ""

      if (hour >= 5 && hour < 12) {
        greetingText = "Good morning"
      } else if (hour >= 12 && hour < 17) {
        greetingText = "Good afternoon"
      } else if (hour >= 17 && hour < 21) {
        greetingText = "Good evening"
      } else {
        greetingText = "Good night"
      }

      setGreeting(greetingText)
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-lg font-semibold text-white">
        {greeting}, {displayName}!
      </span>
      <Sparkles className="h-4 w-4 text-yellow-400" />
    </div>
  )
}

// Welcome message for new users
export function WelcomeMessage({ userName, user, className = "" }: GreetingProps) {
  const displayName = user ? getUserDisplayName(user) : (userName || "Student")
  return (
    <div className={cn("text-center py-8", className)}>
      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4">
        <BookOpen className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to your learning journey, {displayName}! 🎓
      </h2>
      <p className="text-slate-300 max-w-md mx-auto">
        You're all set to start exploring courses, completing assignments, and achieving your goals. Let's make learning fun and rewarding!
      </p>
    </div>
  )
}
