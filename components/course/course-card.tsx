"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  id: string
  title: string
  description?: string
  modulesCount?: number
  studentsCount?: number
  role?: "teacher" | "student"
  className?: string
}

export function CourseCard({
  id,
  title,
  description = "",
  modulesCount = 0,
  studentsCount = 0,
  role = "student",
  className,
}: Props) {
  const href = role === "teacher" ? `/teacher/course/${id}` : `/student/course/${id}`

  return (
    <Card className={cn("bg-white/10 border-white/15 text-white backdrop-blur", className)}>
      <CardHeader>
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors w-full sm:w-auto"
            aria-label={role === "teacher" ? `View course ${title}` : `Open course ${title}`}
          >
            {role === "teacher" ? "View" : "Open"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
