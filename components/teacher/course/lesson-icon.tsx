import React from "react"
import { 
  Video, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  BarChart2 
} from "lucide-react"

interface LessonIconProps {
  type: "video" | "quiz" | "file" | "discussion" | "poll"
}

export function LessonIcon({ type }: LessonIconProps) {
  const iconMap = {
    video: Video,
    quiz: HelpCircle,
    file: FileText,
    discussion: MessageSquare,
    poll: BarChart2,
  }

  const Icon = iconMap[type]

  return (
    <div className={`p-2 rounded-lg ${
      type === "video" ? "bg-red-500/20 text-red-400" :
      type === "quiz" ? "bg-yellow-500/20 text-yellow-400" :
      type === "file" ? "bg-blue-500/20 text-blue-400" :
      type === "discussion" ? "bg-green-500/20 text-green-400" :
      "bg-purple-500/20 text-purple-400"
    }`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}
