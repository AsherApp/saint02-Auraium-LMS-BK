import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen,
  CheckCircle,
  Clock
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  type: string
  order_index: number
  duration?: number
  is_completed?: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface LessonNavigationProps {
  modules: Module[]
  currentModuleIndex: number
  currentLessonIndex: number
  onNavigate: (moduleIndex: number, lessonIndex: number) => void
}

export function LessonNavigation({ 
  modules, 
  currentModuleIndex, 
  currentLessonIndex, 
  onNavigate 
}: LessonNavigationProps) {
  const currentModule = modules[currentModuleIndex]
  const currentLesson = currentModule?.lessons[currentLessonIndex]
  
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0)
  const completedLessons = modules.reduce((total, module) => 
    total + module.lessons.filter(lesson => lesson.is_completed).length, 0
  )

  const canGoPrevious = currentModuleIndex > 0 || currentLessonIndex > 0
  const canGoNext = currentModuleIndex < modules.length - 1 || 
                   (currentModuleIndex === modules.length - 1 && currentLessonIndex < currentModule.lessons.length - 1)

  const goToPrevious = () => {
    if (currentLessonIndex > 0) {
      onNavigate(currentModuleIndex, currentLessonIndex - 1)
    } else if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1]
      onNavigate(currentModuleIndex - 1, prevModule.lessons.length - 1)
    }
  }

  const goToNext = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      onNavigate(currentModuleIndex, currentLessonIndex + 1)
    } else if (currentModuleIndex < modules.length - 1) {
      onNavigate(currentModuleIndex + 1, 0)
    }
  }

  if (!currentModule || !currentLesson) {
    return null
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
      {/* Progress Overview */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-medium">Course Progress</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="bg-green-500/20 text-green-400 border-green-500/30"
          >
            {completedLessons}/{totalLessons} completed
          </Badge>
        </div>
      </div>

      {/* Current Lesson Info */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">{currentLesson.title}</h4>
          <div className="flex items-center gap-2">
            {currentLesson.is_completed && (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            {currentLesson.duration && (
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{currentLesson.duration}m</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Module {currentModuleIndex + 1}: {currentModule.title}
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Lesson {currentLessonIndex + 1} of {currentModule.lessons.length}
          </p>
          <p className="text-xs text-slate-500">
            in Module {currentModuleIndex + 1}
          </p>
        </div>

        <Button
          onClick={goToNext}
          disabled={!canGoNext}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Module Progress */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  moduleIndex === currentModuleIndex 
                    ? "bg-blue-400" 
                    : moduleIndex < currentModuleIndex 
                    ? "bg-green-400" 
                    : "bg-slate-400"
                }`} />
                <span className={`text-sm ${
                  moduleIndex === currentModuleIndex 
                    ? "text-white font-medium" 
                    : "text-slate-400"
                }`}>
                  {module.title}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  moduleIndex === currentModuleIndex 
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                    : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                }`}
              >
                {module.lessons.filter(lesson => lesson.is_completed).length}/{module.lessons.length}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
