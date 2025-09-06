"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Trash2, Copy, Eye } from "lucide-react"
import { useState } from "react"

type Props = {
  id: string
  title: string
  description?: string
  modulesCount?: number
  studentsCount?: number
  role?: "teacher" | "student"
  className?: string
  thumbnailUrl?: string
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
}

export function CourseCard({
  id,
  title,
  description = "",
  modulesCount = 0,
  studentsCount = 0,
  role = "student",
  className,
  thumbnailUrl,
  onDelete,
  onDuplicate,
}: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const href = role === "teacher" ? `/teacher/course/${id}` : `/student/course/${id}`

  return (
    <Card 
      className={cn("bg-white/10 border-white/15 text-white backdrop-blur relative overflow-hidden group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="h-32 w-full overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt={`${title} thumbnail`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      {/* Action Icons - Only show for teachers */}
      {role === "teacher" && (onDelete || onDuplicate) && (
        <div className={cn(
          "absolute top-2 right-2 flex gap-1 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          {onDuplicate && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDuplicate(id)
              }}
              title="Duplicate course"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-600 text-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(id)
              }}
              title="Delete course"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <CardHeader className={thumbnailUrl ? "pb-2" : ""}>
        <CardTitle className="text-white font-bold text-xl mb-1 truncate">{title}</CardTitle>
        {description ? <p className="text-slate-300 text-base mb-2 truncate">{description}</p> : null}
      </CardHeader>
      
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 w-full">
        <div className="flex gap-2 flex-wrap mb-2 sm:mb-0">
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400 font-semibold px-3 py-1 rounded-md">
            {modulesCount} modules
          </Badge>
          <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 border-purple-400 font-semibold px-3 py-1 rounded-md">
            {studentsCount} students
          </Badge>
        </div>
        <Link href={href}>
          <Button
            className="font-bold px-5 py-2 w-full sm:w-auto"
            aria-label={role === "teacher" ? `View course ${title}` : `Open course ${title}`}
          >
            {role === "teacher" ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View
              </>
            ) : (
              "Open"
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
