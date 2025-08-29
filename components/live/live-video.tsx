"use client"

import { useEffect, useState, useCallback } from "react"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import "@livekit/components-styles"
import { FallbackVideo } from "./fallback-video"
import { Loading } from "@/components/shared/loading"
import { Error } from "@/components/shared/error"
import { isParticipantArrayError, getLiveKitErrorMessage, generateRoomKey } from "@/utils/livekit-utils"

interface LiveVideoProps {
  room: string
  name?: string
  session?: any
  customControls?: React.ReactNode
}

export function LiveVideo({ room, name, session, customControls }: LiveVideoProps) {
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [roomKey, setRoomKey] = useState<string>(generateRoomKey(room))

  const getToken = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const who = name || `guest_${Math.random().toString(36).slice(2, 8)}`
      const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(who)}`)
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.error?.includes('LiveKit env not configured')) {
          setUseFallback(true)
          return
        }
        throw new Error(data?.error || `Failed to get token (${res.status})`)
      }
      
      const data = await res.json()
      setWsUrl(data.wsUrl)
      setToken(data.token)
    } catch (e: any) {
      console.error('LiveKit error:', e)
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1)
        // Retry after a short delay
        setTimeout(() => {
          getToken()
        }, 1000)
      } else {
        setUseFallback(true)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [room, name, retryCount])

  // Reset room key when room changes to force complete re-render
  useEffect(() => {
    setRoomKey(generateRoomKey(room))
    setRetryCount(0)
    setError(null)
    setUseFallback(false)
  }, [room])

  useEffect(() => {
    getToken()
  }, [getToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setWsUrl(null)
      setToken(null)
      setError(null)
      setUseFallback(false)
    }
  }, [])

  // Use fallback if LiveKit is not configured
  if (useFallback) {
    return <FallbackVideo sessionId={room} myEmail={name || ""} session={session} />
  }

  if (error) {
    return (
      <Error 
        title="LiveKit Connection Error"
        message={error}
        onRetry={() => {
          setError(null)
          setRetryCount(0)
          getToken()
        }}
        onBack={() => window.history.back()}
      />
    )
  }
  
  if (isConnecting || !wsUrl || !token) {
    return (
      <Loading 
        text={isConnecting ? 'Getting LiveKit token...' : 'Connecting to live room...'}
      />
    )
  }



  return (
    <div className="h-full w-full relative bg-slate-900 rounded-lg overflow-hidden">
      <LiveKitRoom
        key={roomKey} // Force complete re-render with unique key
        serverUrl={wsUrl}
        token={token}
        connect
        options={{ 
          publishDefaults: { 
            simulcast: true,
            video: true,
            audio: true
          },
          adaptiveStream: true,
          dynacast: true,
          stopLocalTrackOnUnpublish: true,
          stopMicTrackOnMute: true,
          // Add better participant management
          participantCountUpdateInterval: 1000,
          reconnectBackoffMultiplier: 1.5,
          maxReconnectAttempts: 5
        }}
        className="h-full w-full"
        onError={(error) => {
          console.error('LiveKit room error:', error)
          // Don't set error for participant-related issues, just log them
          if (!isParticipantArrayError(error) && !error.message?.includes('camera_placeholder')) {
            setError(getLiveKitErrorMessage(error))
          }
        }}
        onDisconnected={() => {
          console.log('LiveKit disconnected')
          // Clean up any remaining participant state
          setError(null)
        }}
      >
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 relative">
            <VideoConference 
              className="h-full w-full"
              onError={(error) => {
                console.error('VideoConference error:', error)
                // Ignore participant array errors and camera placeholder errors as they're usually temporary
                if (!isParticipantArrayError(error) && 
                    !error.message?.includes('camera_placeholder') &&
                    !error.message?.includes('not part of the array')) {
                  setError(getLiveKitErrorMessage(error))
                }
              }}
              options={{
                showParticipantCount: false,
                showConnectionQuality: false,
                showLocalParticipant: true,
                showParticipantsWithoutVideo: true,
                showVideoMutedIndicator: true,
                showAudioMutedIndicator: true,
                // Add stability options
                participantCountUpdateInterval: 2000,
                maxParticipants: 50,
                showParticipantName: true,
                showScreenShareButton: false, // We have our own controls
                showChatButton: false, // We have our own chat
                showParticipantsButton: false, // We have our own participants list
                showSettingsButton: false, // We have our own controls
                showLeaveButton: false, // We have our own leave button
                showControls: false, // Hide default LiveKit controls
              }}
            />
          </div>
          
          {/* Custom Controls - Now inside LiveKit context */}
          {customControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              {customControls}
            </div>
          )}
        </div>
      </LiveKitRoom>
    </div>
  )
}

