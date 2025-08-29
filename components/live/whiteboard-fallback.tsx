"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

type StrokePoint = { x: number; y: number }
type Stroke = {
  id: string
  points: StrokePoint[]
  color: string
  width: number
}

export function WhiteboardFallback({ sessionId, isHost = false }: { sessionId: string; isHost?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState("#e5e7eb") // slate-200
  const [width, setWidth] = useState(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])

  // Resize to container and draw strokes
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = containerRef.current
    if (!canvas || !wrap) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const rect = wrap.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    for (const s of strokes) {
      if (!s || !Array.isArray(s.points) || s.points.length === 0) continue
      
      ctx.strokeStyle = s.color || '#e5e7eb'
      ctx.lineWidth = s.width || 3
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.beginPath()
      s.points.forEach((p, i) => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
      })
      ctx.stroke()
    }
  }, [strokes])

  // Redraw on container resize
  useEffect(() => {
    let lastW = 0
    let lastH = 0
    function handle() {
      const c = canvasRef.current
      const wrap = containerRef.current
      if (!c || !wrap) return
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const rect = wrap.getBoundingClientRect()
      const nextW = Math.floor(rect.width)
      const nextH = Math.floor(rect.height)
      if (nextW === lastW && nextH === lastH) return
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
      for (const s of strokes) {
        if (!s || !Array.isArray(s.points) || s.points.length === 0) continue
        
        ctx.strokeStyle = s.color || '#e5e7eb'
        ctx.lineWidth = s.width || 3
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.beginPath()
        s.points.forEach((p, i) => {
          if (p && typeof p.x === 'number' && typeof p.y === 'number') {
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          }
        })
        ctx.stroke()
      }
    }
    const obs = new ResizeObserver(handle)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
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
        points: pts.slice(),
        color,
        width,
      }
      setStrokes(prev => [...prev, stroke])
    }
    currentPoints.current = []
  }

  function clear() {
    setStrokes([])
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
            onClick={clear}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div ref={containerRef} className="relative h-full rounded-md border border-white/10 bg-white/5 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
        />
      </div>
    </div>
  )
}
