"use client"

import { useState, useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  Clock,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { ProgressAPI } from '@/services/progress/api'

interface VideoProgressTrackerProps {
  lessonId: string
  courseId?: string
  moduleId?: string
  videoSource: 'upload' | 'onedrive' | 'googledrive'
  onCompleted?: () => void
  onSkip?: () => void
  allowSkip?: boolean
  minWatchTime?: number // Minimum watch time in seconds before allowing skip
}

export function VideoProgressTracker({
  lessonId,
  courseId,
  moduleId,
  videoSource,
  onCompleted,
  onSkip,
  allowSkip = true,
  minWatchTime = 30
}: VideoProgressTrackerProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const startTimeRef = useRef<number>(0)
  const watchTimeRef = useRef<number>(0)

  useEffect(() => {
    // For iframe-based videos (OneDrive, Google Drive), we can't track exact progress
    // So we'll use a time-based approach
    if (videoSource === 'onedrive' || videoSource === 'googledrive') {
      const interval = setInterval(() => {
        if (hasStarted && !isCompleted) {
          watchTimeRef.current += 1
          const progressPercent = Math.min((watchTimeRef.current / minWatchTime) * 100, 100)
          setProgress(progressPercent)
          
          if (progressPercent >= 90 && !isCompleted) {
            handleCompletion()
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [hasStarted, isCompleted, videoSource, minWatchTime])

  useEffect(() => {
    if (hasStarted && watchTimeRef.current >= minWatchTime) {
      setCanSkip(true)
    }
  }, [hasStarted, minWatchTime])

  const handleVideoEvent = (event: string, data?: any) => {
    switch (event) {
      case 'play':
        setIsPlaying(true)
        if (!hasStarted) {
          setHasStarted(true)
          startTimeRef.current = Date.now()
        }
        break
      case 'pause':
        setIsPlaying(false)
        break
      case 'timeupdate':
        if (data) {
          setCurrentTime(data.currentTime)
          setDuration(data.duration)
          const progressPercent = (data.currentTime / data.duration) * 100
          setProgress(progressPercent)
          
          if (progressPercent >= 90 && !isCompleted) {
            handleCompletion()
          }
        }
        break
      case 'loadedmetadata':
        if (data) {
          setDuration(data.duration)
        }
        break
    }
  }

  const handleCompletion = async () => {
    if (isCompleted) return
    
    setIsCompleted(true)
    
    try {
      await ProgressAPI.markLessonCompleted({
        student_email: user?.email || '',
        lesson_id: lessonId,
        course_id: courseId,
        module_id: moduleId
      })
      
      toast({
        title: "Lesson Completed! 🎉",
        description: "Great job! You can now proceed to the next lesson.",
        variant: "default"
      })
      
      onCompleted?.()
    } catch (error) {
      console.error('Error marking lesson completed:', error)
      toast({
        title: "Error",
        description: "Failed to mark lesson as completed. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSkip = () => {
    if (!canSkip) return
    
    onSkip?.()
    handleCompletion()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    if (isCompleted) return "bg-green-500"
    if (progress >= 90) return "bg-green-400"
    if (progress >= 50) return "bg-yellow-400"
    return "bg-blue-400"
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              {videoSource === 'upload' ? formatTime(currentTime) : `${Math.floor(watchTimeRef.current)}s`}
            </span>
            {duration > 0 && videoSource === 'upload' && (
              <span className="text-slate-500">/ {formatTime(duration)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(progress)}% Complete
              </Badge>
            )}
          </div>
        </div>
        
        <Progress 
          value={progress} 
          className="h-2"
          style={{
            '--progress-background': getProgressColor()
          } as React.CSSProperties}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {videoSource === 'upload' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVideoEvent(isPlaying ? 'pause' : 'play')}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
          
          {!hasStarted && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <AlertCircle className="h-3 w-3" />
              <span>Start watching to begin tracking</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowSkip && canSkip && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip & Complete
            </Button>
          )}
          
          {allowSkip && !canSkip && hasStarted && (
            <div className="text-xs text-slate-400">
              Can skip in {Math.max(0, minWatchTime - watchTimeRef.current)}s
            </div>
          )}
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Lesson completed successfully!</span>
          </div>
        </div>
      )}
    </div>
  )
}
