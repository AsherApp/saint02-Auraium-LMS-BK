import React from "react"
import { StatCard } from "./stat-card"
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  PlayCircle 
} from "lucide-react"

interface CourseOverviewProps {
  modulesCount: number
  studentsCount: number
  assignmentsCount: number
  lessonsCount: number
}

export function CourseOverview({ 
  modulesCount, 
  studentsCount, 
  assignmentsCount, 
  lessonsCount 
}: CourseOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<BookOpen className="h-5 w-5" />}
        label="Modules"
        value={modulesCount}
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Students"
        value={studentsCount}
      />
      <StatCard
        icon={<ClipboardList className="h-5 w-5" />}
        label="Assignments"
        value={assignmentsCount}
      />
      <StatCard
        icon={<PlayCircle className="h-5 w-5" />}
        label="Lessons"
        value={lessonsCount}
      />
    </div>
  )
}
