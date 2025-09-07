import React from "react"
import { 
  FileText, 
  Video, 
  Code, 
  Presentation, 
  ClipboardList 
} from "lucide-react"

interface AssignmentIconProps {
  type: "essay" | "video" | "coding" | "presentation" | "quiz"
}

export function AssignmentIcon({ type }: AssignmentIconProps) {
  const iconMap = {
    essay: FileText,
    video: Video,
    coding: Code,
    presentation: Presentation,
    quiz: ClipboardList,
  }

  const Icon = iconMap[type]

  return (
    <div className={`p-2 rounded-lg ${
      type === "essay" ? "bg-blue-500/20 text-blue-400" :
      type === "video" ? "bg-red-500/20 text-red-400" :
      type === "coding" ? "bg-green-500/20 text-green-400" :
      type === "presentation" ? "bg-purple-500/20 text-purple-400" :
      "bg-yellow-500/20 text-yellow-400"
    }`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}
