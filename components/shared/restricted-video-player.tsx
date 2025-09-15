"use client"

import { useRef, useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestrictedVideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  onWatchTimeUpdate?: (watchTime: number) => void
  className?: string
}

export function RestrictedVideoPlayer({
  src,
  poster,
  title,
  onTimeUpdate,
  onComplete,
  onWatchTimeUpdate,
  className = ""
}: RestrictedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const [lastWatchedTime, setLastWatchedTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Track watch time (only count forward progress)
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    const handleTimeUpdate = () => {
      const current = video.currentTime
      const total = video.duration

      setCurrentTime(current)
      setDuration(total)

      // Only count time if we're moving forward or staying at the same position
      if (current >= lastWatchedTime) {
        const newWatchTime = watchTime + (current - lastWatchedTime)
        setWatchTime(newWatchTime)
        setLastWatchedTime(current)
        onWatchTimeUpdate?.(newWatchTime)
      }

      onTimeUpdate?.(current, total)

      // Check if video is completed (watched at least 95% of duration)
      if (total > 0 && current >= total * 0.95 && !isCompleted) {
        setIsCompleted(true)
        onComplete?.()
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setIsCompleted(true)
      onComplete?.()
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [lastWatchedTime, watchTime, onTimeUpdate, onComplete, onWatchTimeUpdate, isCompleted])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const newTime = parseFloat(e.target.value)
    const video = videoRef.current

    // Only allow seeking backward or to current position (no forward seeking)
    if (newTime <= lastWatchedTime) {
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const watchProgressPercentage = duration > 0 ? (watchTime / duration) * 100 : 0

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Video Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Title Overlay */}
      {title && (
        <div className="absolute top-4 left-4 right-4 pointer-events-none">
          <h3 className="text-white font-medium text-lg drop-shadow-lg">{title}</h3>
        </div>
      )}

      {/* Completion Status */}
      {isCompleted && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ✓ Completed
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative">
            {/* Watch Progress (Green) */}
            <div 
              className="absolute top-0 left-0 h-1 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${watchProgressPercentage}%` }}
            />
            {/* Current Progress (Blue) */}
            <div 
              className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Seek Bar */}
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #4b5563 ${progressPercentage}%, #4b5563 100%)`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 p-2"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Rewind (10 seconds) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, currentTime - 10)
                }
              }}
              className="text-white hover:bg-white/20 p-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 p-2"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Watch Progress Indicator */}
            <div className="text-xs text-gray-300">
              Watched: {Math.round(watchProgressPercentage)}%
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 p-2"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Forward Seeking Restriction Overlay */}
      {currentTime < lastWatchedTime && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Cannot skip ahead</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
