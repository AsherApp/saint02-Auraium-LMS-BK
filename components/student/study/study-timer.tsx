import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock,
  Target
} from "lucide-react"

interface StudyTimerProps {
  onTimeUpdate?: (seconds: number) => void
}

export function StudyTimer({ onTimeUpdate }: StudyTimerProps) {
  const [studyTimer, setStudyTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => {
          const newTime = prev + 1
          onTimeUpdate?.(newTime)
          return newTime
        })
      }, 1000)
    } else {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setTimerRunning(!timerRunning)
  }

  const resetTimer = () => {
    setStudyTimer(0)
    setTimerRunning(false)
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-medium">Study Timer</h3>
        </div>
        <Badge 
          variant="outline" 
          className={`${
            timerRunning 
              ? "bg-green-500/20 text-green-400 border-green-500/30" 
              : "bg-slate-500/20 text-slate-400 border-slate-500/30"
          }`}
        >
          {timerRunning ? "Running" : "Paused"}
        </Badge>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-white mb-2">
          {formatTime(studyTimer)}
        </div>
        <p className="text-sm text-slate-400">
          {studyTimer > 0 ? "Time spent studying" : "Start your study session"}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={toggleTimer}
          className={`${
            timerRunning 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {timerRunning ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start
            </>
          )}
        </Button>
        
        <Button
          onClick={resetTimer}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
          disabled={studyTimer === 0}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {studyTimer > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Target className="h-4 w-4" />
            <span>
              {studyTimer >= 3600 
                ? `Great! You've studied for over ${Math.floor(studyTimer / 3600)} hour${Math.floor(studyTimer / 3600) > 1 ? 's' : ''}`
                : studyTimer >= 1800
                ? "Excellent! You've studied for 30+ minutes"
                : studyTimer >= 900
                ? "Good progress! Keep it up"
                : "Getting started! Every minute counts"
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
