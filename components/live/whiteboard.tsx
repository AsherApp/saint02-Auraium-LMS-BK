"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { http } from "@/services/http"
import { WhiteboardFallback } from "./whiteboard-fallback"

type StrokePoint = { x: number; y: number }
type Stroke = {
  id: string
  sessionId: string
  points: StrokePoint[]
  color: string
  width: number
  by: string
}

export function Whiteboard({ sessionId, isHost = false }: { sessionId: string; isHost?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState("#e5e7eb") // slate-200
  const [width, setWidth] = useState(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [loading, setLoading] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(true)

  // Fetch strokes
  useEffect(() => {
    const fetchStrokes = async () => {
      if (!sessionId) return
      
      setLoading(true)
      
      try {
        const response = await http<any>(`/api/live/${sessionId}/whiteboard`)
        const strokesData = response.items || response || []
        
        // Validate and filter strokes data
        const validStrokes = strokesData.filter((stroke: any) => {
          if (!stroke) return false
          
          let points
          try {
            // Handle both array and JSON string formats
            points = typeof stroke.points === 'string' ? JSON.parse(stroke.points) : stroke.points
          } catch {
            return false
          }
          
          return Array.isArray(points) && 
                 points.length > 0 &&
                 points.every((point: any) => 
                   point && typeof point.x === 'number' && typeof point.y === 'number'
                 )
        }).map((stroke: any) => ({
          ...stroke,
          points: typeof stroke.points === 'string' ? JSON.parse(stroke.points) : stroke.points
        }))
        
        setStrokes(validStrokes)
      } catch (err: any) {
        console.error('Failed to load whiteboard strokes:', err)
        setStrokes([])
        // If API is not available, switch to fallback mode
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setApiAvailable(false)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStrokes()
    
    // Set up polling for new strokes
    const interval = setInterval(fetchStrokes, 1000)
    return () => clearInterval(interval)
  }, [sessionId])

  async function addStroke(stroke: Stroke) {
    try {
      // Add stroke locally immediately for responsiveness
      setStrokes(prev => [...prev, stroke])
      
      // Send to backend
      await http(`/api/live/${sessionId}/whiteboard`, {
        method: 'POST',
        body: {
          points: JSON.stringify(stroke.points),
          color: stroke.color,
          width: stroke.width
        }
      })
    } catch (err: any) {
      console.error('Failed to add stroke:', err)
      // Keep stroke locally even if API fails
    }
  }

  async function clear() {
    try {
      await http(`/api/live/${sessionId}/whiteboard`, {
        method: 'DELETE'
      })
      setStrokes([])
    } catch (err: any) {
      console.error('Failed to clear whiteboard:', err)
    }
  }

  // Resize to container and draw strokes - with better performance
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = containerRef.current
    if (!canvas || !wrap) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const rect = wrap.getBoundingClientRect()
    
    // Only resize if dimensions actually changed
    const currentWidth = canvas.width / dpr
    const currentHeight = canvas.height / dpr
    
    if (Math.abs(currentWidth - rect.width) > 1 || Math.abs(currentHeight - rect.height) > 1) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Only set scale if canvas was resized
    if (Math.abs(currentWidth - rect.width) > 1 || Math.abs(currentHeight - rect.height) > 1) {
      ctx.scale(dpr, dpr)
    }
    
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw strokes with better validation
    for (const s of strokes) {
      if (!s) continue
      
      let points
      try {
        points = typeof s.points === 'string' ? JSON.parse(s.points) : s.points
      } catch {
        continue
      }
      
      if (!Array.isArray(points) || points.length === 0) continue
      
      ctx.strokeStyle = s.color || '#e5e7eb'
      ctx.lineWidth = s.width || 3
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.beginPath()
      
      points.forEach((p, i) => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
      })
      ctx.stroke()
    }
  }, [strokes])

  // Redraw on container resize - with debouncing to prevent excessive redraws
  useEffect(() => {
    let lastW = 0
    let lastH = 0
    let resizeTimeout: NodeJS.Timeout | null = null
    
    function handle() {
      const c = canvasRef.current
      const wrap = containerRef.current
      if (!c || !wrap) return
      
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const rect = wrap.getBoundingClientRect()
      const nextW = Math.floor(rect.width)
      const nextH = Math.floor(rect.height)
      
      // Only redraw if size actually changed
      if (nextW === lastW && nextH === lastH) return
      
      // Clear any pending resize
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      
      // Debounce resize to prevent excessive redraws
      resizeTimeout = setTimeout(() => {
        lastW = nextW
        lastH = nextH
        
        c.width = nextW * dpr
        c.height = nextH * dpr
        c.style.width = `${nextW}px`
        c.style.height = `${nextH}px`
        
        const ctx = c.getContext("2d")
        if (!ctx) return
        
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, nextW, nextH)
        
        // Redraw all strokes
        for (const s of strokes) {
          if (!s) continue
          
          let points
          try {
            points = typeof s.points === 'string' ? JSON.parse(s.points) : s.points
          } catch {
            continue
          }
          
          if (!Array.isArray(points) || points.length === 0) continue
          
          ctx.strokeStyle = s.color || '#e5e7eb'
          ctx.lineWidth = s.width || 3
          ctx.lineJoin = "round"
          ctx.lineCap = "round"
          ctx.beginPath()
          
          points.forEach((p, i) => {
            if (p && typeof p.x === 'number' && typeof p.y === 'number') {
              if (i === 0) ctx.moveTo(p.x, p.y)
              else ctx.lineTo(p.x, p.y)
            }
          })
          ctx.stroke()
        }
      }, 100) // 100ms debounce
    }
    
    const obs = new ResizeObserver(handle)
    if (containerRef.current) obs.observe(containerRef.current)
    
    return () => {
      obs.disconnect()
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
    }
  }, [strokes])

  function getPos(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): StrokePoint {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const currentPoints = useRef<StrokePoint[]>([])

  function onDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setDrawing(true)
    currentPoints.current = [getPos(e)]
  }
  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return
    currentPoints.current.push(getPos(e))
    // Draw live for responsiveness
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    const pts = currentPoints.current
    const last2 = pts.slice(-2)
    if (last2.length === 2) {
      ctx.beginPath()
      ctx.moveTo(last2[0].x, last2[0].y)
      ctx.lineTo(last2[1].x, last2[1].y)
      ctx.stroke()
    }
  }
  function onUp() {
    setDrawing(false)
    const pts = currentPoints.current
    if (pts.length > 1) {
      const stroke: Stroke = {
        id: `stroke_${Date.now()}`,
        sessionId,
        points: pts.slice(),
        color,
        width,
        by: "local",
      }
      addStroke(stroke)
    }
    currentPoints.current = []
  }

  // If API is not available, use fallback whiteboard
  if (!apiAvailable) {
    return <WhiteboardFallback sessionId={sessionId} isHost={isHost} />
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 h-full">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span>Whiteboard</span>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <input
            aria-label="Color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-6 rounded border border-white/20 bg-transparent p-0"
          />
          <span>Pen</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Width</span>
          <Slider
            defaultValue={[width]}
            onValueCommit={(v) => setWidth(v[0] ?? 3)}
            min={1}
            max={10}
            step={1}
            className="w-24"
          />
        </div>
        {isHost ? (
          <Button
            variant="secondary"
            className="ml-auto bg-white/10 text-white hover:bg-white/20"
            onClick={() => clear(sessionId)}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div 
        ref={containerRef} 
        className="relative h-full rounded-md border border-white/10 bg-white/5 overflow-hidden"
        style={{ minHeight: '300px', maxHeight: '100%' }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  )
}
