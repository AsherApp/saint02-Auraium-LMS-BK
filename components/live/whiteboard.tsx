'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Room } from 'livekit-client'

interface WhiteboardProps {
  room: Room | null
  isVisible: boolean
  onClose: () => void
  participantName: string
}

interface DrawingData {
  type: 'draw' | 'clear'
  x?: number
  y?: number
  prevX?: number
  prevY?: number
  color?: string
  lineWidth?: number
}

export default function Whiteboard({ room, isVisible, onClose, participantName }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentLineWidth, setCurrentLineWidth] = useState(2)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Drawing colors
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ]

  // Line widths
  const lineWidths = [1, 2, 4, 8, 12]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      
      // Set drawing properties
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = currentColor
      ctx.lineWidth = currentLineWidth
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [currentColor, currentLineWidth])

  // Handle drawing start
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDrawing(true)
    setLastPoint({ x, y })
  }, [])

  // Handle drawing
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPoint) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    // Draw on canvas
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(currentX, currentY)
    ctx.stroke()

    // Send drawing data to other participants
    if (room) {
      const drawingData: DrawingData = {
        type: 'draw',
        x: currentX,
        y: currentY,
        prevX: lastPoint.x,
        prevY: lastPoint.y,
        color: currentColor,
        lineWidth: currentLineWidth
      }

      const data = new TextEncoder().encode(JSON.stringify({
        type: 'whiteboard_draw',
        data: drawingData,
        participant: participantName
      }))

      room.localParticipant.publishData(data, { reliable: true })
    }

    setLastPoint({ x: currentX, y: currentY })
  }, [isDrawing, lastPoint, currentColor, currentLineWidth, room, participantName])

  // Handle drawing end
  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    setLastPoint(null)
  }, [])

  // Clear whiteboard
  const clearWhiteboard = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Send clear data to other participants
    if (room) {
      const data = new TextEncoder().encode(JSON.stringify({
        type: 'whiteboard_clear',
        participant: participantName
      }))

      room.localParticipant.publishData(data, { reliable: true })
    }
  }, [room, participantName])

  // Handle incoming drawing data
  useEffect(() => {
    if (!room) return

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload))
        
        if (message.type === 'whiteboard_draw' && message.data) {
          const { x, y, prevX, prevY, color, lineWidth } = message.data
          
          if (!canvasRef.current) return
          
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          // Save current state
          const currentStrokeStyle = ctx.strokeStyle
          const currentLineWidth = ctx.lineWidth

          // Set drawing properties
          ctx.strokeStyle = color || '#000000'
          ctx.lineWidth = lineWidth || 2

          // Draw the line
          ctx.beginPath()
          ctx.moveTo(prevX, prevY)
          ctx.lineTo(x, y)
          ctx.stroke()

          // Restore state
          ctx.strokeStyle = currentStrokeStyle
          ctx.lineWidth = currentLineWidth
        } else if (message.type === 'whiteboard_clear') {
          if (!canvasRef.current) return
          
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      } catch (error) {
        console.error('Error processing whiteboard data:', error)
      }
    }

    room.on('dataReceived', handleDataReceived)

    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[80vh] mx-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="ml-3 text-white font-medium text-lg">Collaborative Whiteboard</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center gap-4">
            {/* Colors */}
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm font-medium">Colors:</span>
              <div className="flex items-center gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      currentColor === color 
                        ? 'border-white shadow-lg shadow-white/50' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Line width */}
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm font-medium">Size:</span>
              <div className="flex items-center gap-1">
                {lineWidths.map((width) => (
                  <button
                    key={width}
                    onClick={() => setCurrentLineWidth(width)}
                    className={`w-10 h-8 rounded-lg border transition-all duration-200 hover:scale-105 ${
                      currentLineWidth === width 
                        ? 'bg-blue-500/80 border-blue-400 text-white shadow-lg' 
                        : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                    }`}
                    title={`Line width: ${width}px`}
                  >
                    <div 
                      className="bg-current mx-auto rounded"
                      style={{ 
                        width: `${Math.max(1, width - 1)}px`, 
                        height: '2px' 
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Clear button */}
            <button
              onClick={clearWhiteboard}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Clear Board
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-white rounded-lg border border-white/20 cursor-crosshair shadow-inner"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/20">
          <div className="text-xs text-white/60 text-center">
            Draw together in real-time • Changes sync automatically with all participants
          </div>
        </div>
      </div>
    </div>
  )
}
