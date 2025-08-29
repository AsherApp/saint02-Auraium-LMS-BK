"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Presentation, 
  Download, 
  Maximize2, 
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  ExternalLink,
  Play,
  Pause,
  Square
} from "lucide-react"

interface PresentationFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  slides?: number // Total number of slides
  uploadedAt?: string
}

interface PresentationViewerProps {
  presentation: PresentationFile | null
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export function PresentationViewer({ 
  presentation, 
  isOpen, 
  onClose, 
  title = "Presentation Viewer",
  subtitle 
}: PresentationViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null)

  if (!presentation) return null

  const isPDF = presentation.type === 'application/pdf' || presentation.name.toLowerCase().endsWith('.pdf')
  const isPowerPoint = presentation.name.toLowerCase().match(/\.(ppt|pptx)$/)
  const isGoogleSlides = presentation.url.includes('docs.google.com/presentation')
  
  // Mock slide count - in real implementation, this would be determined from the file
  const totalSlides = presentation.slides || 10

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = presentation.url
    link.download = presentation.name
    link.click()
  }

  const handleExternalOpen = () => {
    window.open(presentation.url, '_blank')
  }

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1)
    }
  }

  const startSlideshow = () => {
    setIsPlaying(true)
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= totalSlides) {
          setIsPlaying(false)
          return 1 // Reset to first slide
        }
        return prev + 1
      })
    }, 3000) // 3 seconds per slide
    setPlayInterval(interval)
  }

  const stopSlideshow = () => {
    setIsPlaying(false)
    if (playInterval) {
      clearInterval(playInterval)
      setPlayInterval(null)
    }
  }

  const goToSlide = (slideNumber: number) => {
    setCurrentSlide(Math.max(1, Math.min(slideNumber, totalSlides)))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`bg-white/10 border-white/20 backdrop-blur text-white ${
          isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-5xl max-h-[85vh]'
        } overflow-hidden`}
      >
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-white truncate">{title}</DialogTitle>
              {subtitle && (
                <p className="text-slate-400 text-sm truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                {Math.round(presentation.size / 1024)} KB
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Presentation Info Bar */}
        <div className="flex items-center justify-between py-2 px-1 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Presentation className="h-5 w-5 text-purple-400" />
            <div>
              <div className="text-white font-medium text-sm truncate max-w-[200px]">
                {presentation.name}
              </div>
              <div className="text-slate-400 text-xs">
                Slide {currentSlide} of {totalSlides}
                {presentation.uploadedAt && ` • ${new Date(presentation.uploadedAt).toLocaleString()}`}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Slide Navigation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={currentSlide === 1}
              className="text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-slate-400 text-sm min-w-[80px] text-center">
              {currentSlide} / {totalSlides}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentSlide === totalSlides}
              className="text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Slideshow Controls */}
            <div className="border-l border-white/10 pl-2 ml-2">
              {!isPlaying ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startSlideshow}
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopSlideshow}
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Zoom Controls */}
            <div className="border-l border-white/10 pl-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-slate-400 text-sm min-w-[50px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExternalOpen}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Presentation Content */}
        <div className="flex-1 overflow-auto bg-white/5 rounded-lg p-4 min-h-[500px]">
          {isPDF || isPowerPoint ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={`${presentation.url}#page=${currentSlide}&zoom=${zoom}`}
                className="w-full h-full min-h-[600px] rounded border border-white/10"
                title={`${presentation.name} - Slide ${currentSlide}`}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              />
            </div>
          ) : isGoogleSlides ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={`${presentation.url}/embed?start=false&loop=false&delayms=3000&slide=${currentSlide - 1}`}
                className="w-full h-full min-h-[600px] rounded border border-white/10"
                title={`${presentation.name} - Slide ${currentSlide}`}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Presentation className="h-16 w-16 text-slate-400" />
              <div className="text-center">
                <h3 className="text-white font-medium mb-2">Presentation Preview</h3>
                <p className="text-slate-400 mb-4">
                  This presentation format requires external viewing for full functionality.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="bg-purple-600/80 hover:bg-purple-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExternalOpen}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Browser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide Thumbnails (for supported formats) */}
        {(isPDF || isPowerPoint) && (
          <div className="border-t border-white/10 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
                <button
                  key={slideNum}
                  onClick={() => goToSlide(slideNum)}
                  className={`flex-shrink-0 w-16 h-12 rounded border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                    currentSlide === slideNum
                      ? 'border-purple-400 bg-purple-400/20 text-purple-300'
                      : 'border-white/20 bg-white/5 text-slate-400 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {slideNum}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}