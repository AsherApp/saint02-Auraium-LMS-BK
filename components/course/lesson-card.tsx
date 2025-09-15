"use client"

import { FileText, MessageSquare, PlayCircle, BarChart2, ListChecks } from "lucide-react"

export function LessonCard({
  title = "Lesson",
  type = "video",
  thumbnail,
  duration,
}: {
  title?: string
  type?: "video" | "quiz" | "file" | "discussion" | "poll"
  thumbnail?: string
  duration?: string
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
      {/* Thumbnail or Icon */}
      {type === "video" && thumbnail ? (
        <div className="relative w-16 h-12 rounded-md overflow-hidden bg-gray-800 flex-shrink-0 mb-2 sm:mb-0">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <PlayCircle className="h-4 w-4 text-white" />
          </div>
          {duration && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
              {duration}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md bg-blue-600/20 text-blue-300 p-2 flex items-center justify-center mb-2 sm:mb-0">
          <Icon className="h-5 w-5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 mb-2 sm:mb-0">
        <div className="font-bold text-lg truncate text-white mb-1">{title}</div>
        <div className="text-xs text-blue-400 capitalize truncate font-semibold">
          {type}
          {duration && type === "video" && ` • ${duration}`}
        </div>
      </div>
      <button
        className="text-sm font-bold flex items-center justify-center px-4 py-2 w-full sm:w-auto"
        aria-label={`Start ${title} ${type}`}
      >
        Start
      </button>
    </div>
  )
}
