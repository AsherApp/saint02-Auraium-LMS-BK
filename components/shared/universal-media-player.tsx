"use client"

import { useState, useEffect } from "react"
import { Play, FileText, Download, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UniversalMediaPlayerProps {
  url: string
  title?: string
  description?: string
  className?: string
  fileType?: string
}

export function UniversalMediaPlayer({ 
  url, 
  title, 
  description, 
  className = "",
  fileType 
}: UniversalMediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Extract video ID from YouTube URL
    const extractVideoId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtu\.be\/([^&\n?#]+)/
      ]
      
      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
      }
      return null
    }

    const id = extractVideoId(url)
    setVideoId(id)
  }, [url])

  // Determine media type
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const isDirectVideo = fileType?.startsWith('video/') || 
                       url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)
  const isOneDrive = url.includes('onedrive.live.com') || url.includes('1drv.ms')
  const isGoogleDrive = url.includes('drive.google.com')
  const isDropbox = url.includes('dropbox.com')
  const isDirectLink = !isYouTube && !isOneDrive && !isGoogleDrive && !isDropbox

  // Handle different storage providers
  const getDirectUrl = (url: string): string => {
    // OneDrive
    if (isOneDrive) {
      // Convert OneDrive sharing link to direct download
      return url.replace(/redir\?/, 'download?')
    }
    
    // Google Drive
    if (isGoogleDrive) {
      // Convert Google Drive sharing link to direct download
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`
      }
    }
    
    // Dropbox
    if (isDropbox) {
      // Convert Dropbox sharing link to direct download
      return url.replace(/\?dl=0/, '?dl=1')
    }
    
    return url
  }

  const handlePlay = () => {
    setIsLoading(true)
    setError(null)
    
    // For YouTube, just set playing state
    if (isYouTube) {
      setIsPlaying(true)
      setIsLoading(false)
      return
    }
    
    // For other sources, try to load the video
    const video = document.createElement('video')
    video.src = getDirectUrl(url)
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }
    
    video.onerror = () => {
      setError('Unable to load video. Please check the link or try downloading.')
      setIsLoading(false)
    }
    
    // Set a timeout in case the video doesn't load
    setTimeout(() => {
      if (!isPlaying) {
        setError('Video loading timeout. Please check your connection.')
        setIsLoading(false)
      }
    }, 10000)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = getDirectUrl(url)
    link.download = title || 'video'
    link.click()
  }

  if (error) {
    return (
      <div className={`aspect-video bg-black rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Unable to Load Video</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => window.open(url, '_blank')}
              className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="text-green-400 hover:text-green-300 border-green-400 hover:border-green-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // YouTube Player
  if (isYouTube && videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`
    
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {isPlaying ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              title={title || "Video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full bg-gray-900">
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={title || "Video thumbnail"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  className="rounded-full w-16 h-16 flex items-center justify-center"
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {description && (
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-slate-300">{description}</p>
          </div>
        )}
      </div>
    )
  }

  // Direct Video Player
  if (isDirectVideo || isDirectLink) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="aspect-video bg-black rounded-lg">
          <video
            controls
            className="w-full h-full rounded-lg"
            src={getDirectUrl(url)}
            poster={isLoading ? undefined : undefined}
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => {
              setError('Unable to load video. Please check the link.')
              setIsLoading(false)
            }}
          >
            Your browser does not support the video tag.
          </video>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        {description && (
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-slate-300">{description}</p>
          </div>
        )}
      </div>
    )
  }

  // Generic file player (for unsupported formats)
  return (
    <div className={`aspect-video bg-black rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center text-white">
        <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Media File</p>
        <p className="text-sm text-slate-400 mb-4">This file type requires external viewing</p>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open File
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="text-green-400 hover:text-green-300 border-green-400 hover:border-green-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
