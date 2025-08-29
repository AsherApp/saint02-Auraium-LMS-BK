"use client"

import { useState, useEffect } from "react"
import { Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface YouTubePlayerProps {
  url: string
  title?: string
  description?: string
  className?: string
}

export function YouTubePlayer({ url, title, description, className = "" }: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoId, setVideoId] = useState<string | null>(null)

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

  if (!videoId) {
    return (
      <div className={`aspect-video bg-black rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <p className="text-lg font-medium mb-2">Invalid YouTube URL</p>
          <p className="text-sm text-slate-400 mb-4">Unable to load video</p>
          <Button
            variant="outline"
            onClick={() => window.open(url, '_blank')}
            className="text-blue-400 hover:text-blue-300 border-blue-400 hover:border-blue-300"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in YouTube
          </Button>
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title={title || "YouTube video"}
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
                // Fallback to medium quality thumbnail if maxresdefault fails
                const target = e.target as HTMLImageElement
                target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Button
                onClick={() => setIsPlaying(true)}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center"
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                className="bg-black/50 hover:bg-black/70 text-white border-white/20 hover:border-white/40"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
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
