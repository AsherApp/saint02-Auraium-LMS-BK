"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { Palette, Eraser, Download, Upload, RotateCcw, RotateCw, Minus, Plus } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

interface StableWhiteboardProps {
  sessionId: string
  isHost?: boolean
  className?: string
}

export function StableWhiteboard({ sessionId, isHost = false, className = "" }: StableWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen')
  const [currentColor, setCurrentColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)

  const colors = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500',
    '#800080', '#008000', '#000080', '#800000'
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      // Redraw all strokes
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })
  }

  useEffect(() => {
    redrawCanvas()
  }, [strokes])

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    
    const newStroke: Stroke = {
      points: [point],
      color: currentTool === 'eraser' ? '#000000' : currentColor,
      width: currentTool === 'eraser' ? brushSize * 2 : brushSize,
      tool: currentTool
    }
    
    setCurrentStroke(newStroke)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return

    const point = getCanvasPoint(e)
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    }
    
    setCurrentStroke(updatedStroke)
    
    // Draw the current stroke
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.strokeStyle = updatedStroke.color
    ctx.lineWidth = updatedStroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const points = updatedStroke.points
    if (points.length >= 2) {
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y)
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.stroke()
    }
  }

  const handleMouseUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke])
    }
    setIsDrawing(false)
    setCurrentStroke(null)
  }

  const clearCanvas = () => {
    setStrokes([])
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const undo = () => {
    setStrokes(prev => prev.slice(0, -1))
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `whiteboard-${sessionId}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-1">
          <Button
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('pen')}
            className={currentTool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('eraser')}
            className={currentTool === 'eraser' ? 'bg-red-600 text-white' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm px-2">{brushSize}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {colors.map(color => (
            <button
              key={color}
              className={`w-6 h-6 rounded-full border-2 ${currentColor === color ? 'border-white' : 'border-white/30'}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={strokes.length === 0}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-3">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-black rounded-md border border-white/10 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  )
}
