"use client"

import { FileText, MessageSquare, PlayCircle, BarChart2, ListChecks } from "lucide-react"

export function LessonCard({
  title = "Lesson",
  type = "video",
}: {
  title?: string
  type?: "video" | "quiz" | "file" | "discussion" | "poll"
}) {
  const iconMap = {
    video: PlayCircle,
    quiz: ListChecks,
    file: FileText,
    discussion: MessageSquare,
    poll: BarChart2,
  } as const
  const Icon = iconMap[type] || PlayCircle

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-3 text-white w-full">
      <div className="rounded-md bg-blue-600/20 text-blue-300 p-2 flex items-center justify-center mb-2 sm:mb-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
        <div className="font-bold text-lg truncate text-white mb-1">{title}</div>
        <div className="text-xs text-blue-400 capitalize truncate font-semibold">{type}</div>
      </div>
      <button
        className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors flex items-center justify-center px-4 py-2 rounded-md w-full sm:w-auto shadow-md"
        aria-label={`Start ${title} ${type}`}
      >
        Start
      </button>
    </div>
  )
}
