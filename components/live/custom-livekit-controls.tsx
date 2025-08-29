"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, DoorOpen, Settings, Palette } from "lucide-react"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import "@livekit/components-styles"

interface CustomLiveKitControlsProps {
  onToggleChat?: () => void
  onToggleWhiteboard?: () => void
  onLeave?: () => void
  className?: string
}

export function CustomLiveKitControls({ onToggleChat, onToggleWhiteboard, onLeave, className = "" }: CustomLiveKitControlsProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Sync with LiveKit state
  useEffect(() => {
    if (localParticipant) {
      setIsMicEnabled(localParticipant.isMicrophoneEnabled)
      setIsCameraEnabled(localParticipant.isCameraEnabled)
    }
  }, [localParticipant])

  const toggleMicrophone = async () => {
    if (localParticipant) {
      if (isMicEnabled) {
        await localParticipant.setMicrophoneEnabled(false)
        setIsMicEnabled(false)
      } else {
        await localParticipant.setMicrophoneEnabled(true)
        setIsMicEnabled(true)
      }
    }
  }

  const toggleCamera = async () => {
    if (localParticipant) {
      if (isCameraEnabled) {
        await localParticipant.setCameraEnabled(false)
        setIsCameraEnabled(false)
      } else {
        await localParticipant.setCameraEnabled(true)
        setIsCameraEnabled(true)
      }
    }
  }

  const toggleScreenShare = async () => {
    if (localParticipant) {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false)
        setIsScreenSharing(false)
      } else {
        await localParticipant.setScreenShareEnabled(true)
        setIsScreenSharing(true)
      }
    }
  }

  const handleLeave = async () => {
    if (room) {
      await room.disconnect()
    }
    if (onLeave) {
      onLeave()
    }
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className={`p-2 h-10 w-10 rounded-full ${isMicEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}
        onClick={toggleMicrophone}
        title={isMicEnabled ? 'Mute' : 'Unmute'}
      >
        {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={`p-2 h-10 w-10 rounded-full ${isCameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}
        onClick={toggleCamera}
        title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={`p-2 h-10 w-10 rounded-full ${isScreenSharing ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
        onClick={toggleScreenShare}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <MonitorUp className="h-4 w-4" />
      </Button>
      
      {onToggleChat && (
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={onToggleChat}
          title="Toggle chat"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}
      
      {onToggleWhiteboard && (
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={onToggleWhiteboard}
          title="Toggle whiteboard"
        >
          <Palette className="h-4 w-4" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-10 w-10 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30"
        onClick={handleLeave}
        title="Leave session"
      >
        <DoorOpen className="h-4 w-4" />
      </Button>
    </div>
  )
}


