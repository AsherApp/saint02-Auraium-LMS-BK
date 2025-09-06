"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Mic, MicOff, Video, VideoOff } from "lucide-react"

interface SimpleVideoProps {
  room: string
  name?: string
  session?: any
}

export function SimpleVideo({ room, name, session }: SimpleVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [status, setStatus] = useState<string>("Initializing...")
  const [error, setError] = useState<string | null>(null)

  // Initialize camera and microphone
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        setStatus("Requesting camera access...")
        
        // Request camera and microphone access
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        
        setStream(mediaStream)
        
        // Set the video element source
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
        
        setStatus("Camera started successfully!")
        setError(null)
        
        console.log('✅ Camera and microphone initialized successfully')
        console.log('📹 Video tracks:', mediaStream.getVideoTracks().length)
        console.log('🎤 Audio tracks:', mediaStream.getAudioTracks().length)
        
      } catch (err: any) {
        console.error('❌ Failed to access camera/microphone:', err)
        setError(`Failed to access camera: ${err.message}`)
        setStatus("Camera access failed")
      }
    }

    initializeMedia()
    
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled
        setCameraEnabled(!cameraEnabled)
        console.log('📹 Camera toggled:', !cameraEnabled)
      }
    }
  }

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !micEnabled
        setMicEnabled(!micEnabled)
        console.log('🎤 Microphone toggled:', !micEnabled)
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Status Display */}
      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
        {status}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-500/80 text-white p-2 rounded text-xs max-w-xs">
          {error}
        </div>
      )}
      
      {/* Camera Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <Button
          onClick={toggleCamera}
          variant={cameraEnabled ? "default" : "destructive"}
          size="sm"
          className="flex items-center gap-2"
        >
          {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {cameraEnabled ? "Camera On" : "Camera Off"}
        </Button>
        
        <Button
          onClick={toggleMic}
          variant={micEnabled ? "default" : "destructive"}
          size="sm"
          className="flex items-center gap-2"
        >
          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {micEnabled ? "Mic On" : "Mic Off"}
        </Button>
      </div>
      
      {/* Debug Info */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded text-xs">
        <div>Room: {room}</div>
        <div>User: {name || 'Unknown'}</div>
        <div>Session: {session?.id || 'Unknown'}</div>
      </div>
    </div>
  )
}
