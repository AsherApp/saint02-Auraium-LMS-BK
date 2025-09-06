'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track, RemoteParticipant } from 'livekit-client'
import { useAuthStore } from '@/store/auth-store'
import Whiteboard from './whiteboard'
import { IconActionButton } from '@/components/shared/icon-action-button'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Hand, 
  Palette, 
  Settings,
  Users,
  Grid3X3,
  User
} from 'lucide-react'

interface EnhancedVideoProps {
  roomId: string
  name: string
}

export default function EnhancedVideo({ roomId, name }: EnhancedVideoProps) {
  const { user } = useAuthStore()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  // Simple states
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [status, setStatus] = useState("Ready - Click buttons to enable camera/mic")
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  
  // Enhanced video states
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [videoLayout, setVideoLayout] = useState<'speaker' | 'grid' | 'spotlight'>('speaker')
  const [spotlightedParticipant, setSpotlightedParticipant] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [screenShareType, setScreenShareType] = useState<'screen' | 'window' | 'tab'>('screen')
  const [showSettings, setShowSettings] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('')
  
  // LiveKit states
  const [room, setRoom] = useState<Room | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])

  // Get display name
  const getDisplayName = () => {
    return user?.name || user?.full_name || name || 'User'
  }

  // Helper function to safely publish to LiveKit
  const safePublishToLiveKit = async (publishFn: () => Promise<any>, deviceName: string) => {
    // Check if room exists and is connected
    if (!room) {
      console.log(`⚠️ Cannot publish ${deviceName}: no room instance`)
      return false
    }

    // Wait for room to be ready with multiple checks
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      if (room.state === 'connected') {
        console.log(`✅ Room ready for ${deviceName} publishing (attempt ${attempts + 1})`)
        break
      }
      
      console.log(`⏳ Waiting for room to be ready... (attempt ${attempts + 1}/${maxAttempts})`, {
        roomState: room.state,
        isConnected
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    }

    if (room.state !== 'connected') {
      console.log(`❌ Cannot publish ${deviceName}: room not ready after ${maxAttempts} attempts`, {
        roomState: room.state,
        isConnected
      })
      return false
    }

    try {
      // Wait a bit more for stability
      await new Promise(resolve => setTimeout(resolve, 300))
      await publishFn()
      console.log(`✅ ${deviceName} published to LiveKit`)
      return true
    } catch (error) {
      console.error(`❌ Failed to publish ${deviceName} to LiveKit:`, error)
      
      // Retry after a delay
      setTimeout(async () => {
        try {
          if (room && room.state === 'connected') {
            await publishFn()
            console.log(`✅ ${deviceName} published to LiveKit (retry)`)
          }
        } catch (retryError) {
          console.error(`❌ Failed to publish ${deviceName} to LiveKit (retry):`, retryError)
        }
      }, 3000)
      
      return false
    }
  }

  // Initialize component and connect to LiveKit
  useEffect(() => {
    setStatus("Connecting to room...")
    console.log('✅ Component initialized - Connecting to LiveKit room')
    
    // Get available devices on mount
    getAvailableDevices()
    
    const connectToRoom = async () => {
      try {
        const roomInstance = new Room()
        setRoom(roomInstance)
        
        // Set up event listeners
        roomInstance.on(RoomEvent.Connected, async () => {
          console.log('✅ Connected to LiveKit room')
          
          // Wait for connection to stabilize and room state to sync
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Double-check room state before setting connected
          if (roomInstance.state === 'connected') {
            setIsConnected(true)
            console.log('🔗 LiveKit connection stabilized and verified')
            setStatus("Connected - Click buttons to enable camera/mic")
          } else {
            console.log('⚠️ Room state not synchronized yet:', roomInstance.state)
            // Wait a bit more and try again
            setTimeout(() => {
              if (roomInstance.state === 'connected') {
                setIsConnected(true)
                console.log('🔗 LiveKit connection verified (delayed)')
                setStatus("Connected - Click buttons to enable camera/mic")
              }
            }, 1000)
          }
        })
        
        roomInstance.on(RoomEvent.Disconnected, () => {
          console.log('❌ Disconnected from LiveKit room')
          setIsConnected(false)
          setStatus("Disconnected from room")
        })
        
        roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('👤 Participant joined:', participant.identity)
          setParticipants(prev => [...prev, participant])
        })
        
        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('👤 Participant left:', participant.identity)
          setParticipants(prev => prev.filter(p => p.identity !== participant.identity))
        })
        
        roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('📹 Remote track subscribed:', track.kind, 'from', participant.identity)
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current)
            remoteVideoRef.current.play().catch(console.error)
          }
        })
        
        roomInstance.on(RoomEvent.TrackUnsubscribed, (track) => {
          console.log('📹 Remote track unsubscribed:', track.kind)
          track.detach()
        })

        roomInstance.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const data = JSON.parse(new TextDecoder().decode(payload))
            if (data.type === 'hand_raised') {
              console.log(`✋ ${data.participant} ${data.raised ? 'raised' : 'lowered'} their hand`)
              // You could add UI feedback here for other participants' hand raising
            }
          } catch (error) {
            console.log('📨 Received data from:', participant?.identity)
          }
        })
        
        // Get token and connect
        const { http } = await import('@/services/http')
        const response = await http(`/api/live/${roomId}/token`, {
          method: 'POST',
          body: {
            identity: getDisplayName(),
            room: roomId
          }
        })
        
        await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, (response as any).token)
        
      } catch (error) {
        console.error('❌ Failed to connect to LiveKit room:', error)
        setStatus("Failed to connect to room")
      }
    }
    
    connectToRoom()
    
    // Cleanup on unmount
    return () => {
      if (room) {
        room.disconnect()
      }
      if (localStream) {
        console.log('🧹 Cleaning up media streams on unmount')
        localStream.getTracks().forEach(track => {
          track.stop()
          console.log(`🛑 Stopped ${track.kind} track`)
        })
      }
    }
  }, [roomId, name])

  // Request camera access only when user wants it
  const requestCameraAccess = async () => {
    try {
      setStatus("Requesting camera access...")
      console.log('📹 Requesting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false // Only video for camera
      })
      
      console.log('✅ Camera stream obtained')
      
      // If we already have an audio stream, merge it
      if (localStream) {
        const audioTracks = localStream.getAudioTracks()
        audioTracks.forEach(track => {
          stream.addTrack(track)
          console.log('🔄 Added existing audio track to new stream')
        })
        
        // Stop old stream
        localStream.getTracks().forEach(track => track.stop())
      }
      
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(console.error)
        localVideoRef.current.style.display = 'block'
      }
      
       setCameraOn(true)
       setStatus(micOn ? "Camera and mic enabled" : "Camera enabled - Click mic to enable audio")
       console.log('📹 Camera enabled and visible')
       
       // Publish to LiveKit if connected and ready
       await safePublishToLiveKit(
         () => room!.localParticipant.setCameraEnabled(true),
         'Camera'
       )
      
    } catch (error) {
      console.error('❌ Camera access failed:', error)
      setStatus("Camera access denied - Please check permissions")
    }
  }

  // Request microphone access only when user wants it
  const requestMicAccess = async () => {
    try {
      setStatus("Requesting microphone access...")
      console.log('🎤 Requesting microphone access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true // Only audio for mic
      })
      
      console.log('✅ Microphone stream obtained')
      
      // If we already have a video stream, merge it
      if (localStream) {
        const videoTracks = localStream.getVideoTracks()
        videoTracks.forEach(track => {
          stream.addTrack(track)
          console.log('🔄 Added existing video track to new stream')
        })
        
        // Stop old stream
        localStream.getTracks().forEach(track => track.stop())
        
        // Update video element with new merged stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }
      
       setLocalStream(stream)
       setMicOn(true)
       setStatus(cameraOn ? "Camera and mic enabled" : "Mic enabled - Click camera to enable video")
       console.log('🎤 Microphone enabled')
       
       // Publish to LiveKit if connected and ready
       await safePublishToLiveKit(
         () => room!.localParticipant.setMicrophoneEnabled(true),
         'Microphone'
       )
      
    } catch (error) {
      console.error('❌ Microphone access failed:', error)
      setStatus("Microphone access denied - Please check permissions")
    }
  }

  // Stop camera completely
  const stopCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.stop() // Actually turns off the device
        localStream.removeTrack(track)
        console.log('🛑 Camera track stopped and removed')
      })
      
      // If no audio tracks left, clear the stream
      const audioTracks = localStream.getAudioTracks()
      if (audioTracks.length === 0) {
        setLocalStream(null)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }
        console.log('🧹 Stream cleared - no tracks remaining')
      }
    }
    
     setCameraOn(false)
     if (localVideoRef.current) {
       localVideoRef.current.style.display = 'none'
     }
     
     // Unpublish from LiveKit if connected
     if (room && isConnected) {
       try {
         room.localParticipant.setCameraEnabled(false)
         console.log('📹 Camera unpublished from LiveKit')
       } catch (error) {
         console.error('❌ Failed to unpublish camera from LiveKit:', error)
       }
     }
     
     setStatus(micOn ? "Camera disabled - Mic still enabled" : "All devices disabled")
     console.log('📹 Camera disabled - Device turned off')
  }

  // Stop microphone completely  
  const stopMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.stop() // Actually turns off the device
        localStream.removeTrack(track)
        console.log('🛑 Microphone track stopped and removed')
      })
      
      // If no video tracks left, clear the stream
      const videoTracks = localStream.getVideoTracks()
      if (videoTracks.length === 0) {
        setLocalStream(null)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null
        }
        console.log('🧹 Stream cleared - no tracks remaining')
      }
    }
    
     setMicOn(false)
     
     // Unpublish from LiveKit if connected
     if (room && isConnected) {
       try {
         room.localParticipant.setMicrophoneEnabled(false)
         console.log('🎤 Microphone unpublished from LiveKit')
       } catch (error) {
         console.error('❌ Failed to unpublish microphone from LiveKit:', error)
       }
     }
     
     setStatus(cameraOn ? "Mic disabled - Camera still enabled" : "All devices disabled")
     console.log('🎤 Microphone disabled - Device turned off')
  }

  // Toggle camera
  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera()
    } else {
      requestCameraAccess()
    }
  }

  // Toggle microphone
  const toggleMic = () => {
    if (micOn) {
      stopMic()
    } else {
      requestMicAccess()
    }
  }

  // Enhanced screen sharing functionality
  const toggleScreenShare = async (shareType: 'screen' | 'window' | 'tab' = 'screen') => {
    if (screenSharing) {
      // Stop screen sharing
      try {
        if (room && isConnected) {
          const screenTracks = room.localParticipant.videoTrackPublications
          for (const track of screenTracks.values()) {
            if (track.source === Track.Source.ScreenShare) {
              await room.localParticipant.unpublishTrack(track.track!)
              console.log('📺 Screen share stopped')
            }
          }
        }
        setScreenSharing(false)
        setStatus(cameraOn ? "Screen share stopped - Camera enabled" : "Screen share stopped")
      } catch (error) {
        console.error('❌ Failed to stop screen sharing:', error)
      }
    } else {
      // Start screen sharing with specific type
      try {
        setStatus(`Requesting ${shareType} share access...`)
        
        let constraints: any = {
          video: true,
          audio: true
        }
        
        // Add specific constraints based on share type
        if (shareType === 'window') {
          constraints.video = { displaySurface: 'window' }
        } else if (shareType === 'tab') {
          constraints.video = { displaySurface: 'browser' }
        }
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia(constraints)
        
        console.log(`✅ ${shareType} share stream obtained`)
        setScreenShareType(shareType)
        
        // Publish to LiveKit if connected
        if (room && isConnected) {
          await safePublishToLiveKit(
            () => room!.localParticipant.publishTrack(screenStream.getVideoTracks()[0], {
              source: Track.Source.ScreenShare
            }),
            `${shareType.charAt(0).toUpperCase() + shareType.slice(1)} Share`
          )
        }
        
        setScreenSharing(true)
        setStatus(`${shareType.charAt(0).toUpperCase() + shareType.slice(1)} sharing active`)
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          console.log(`📺 ${shareType} share ended by user`)
          setScreenSharing(false)
          setStatus(cameraOn ? `${shareType.charAt(0).toUpperCase() + shareType.slice(1)} share ended - Camera enabled` : `${shareType.charAt(0).toUpperCase() + shareType.slice(1)} share ended`)
        }
        
      } catch (error) {
        console.error(`❌ ${shareType} share access failed:`, error)
        setStatus(`${shareType.charAt(0).toUpperCase() + shareType.slice(1)} share access denied`)
      }
    }
  }

  // Raise hand functionality
  const toggleRaiseHand = () => {
    if (room && isConnected) {
      const newState = !handRaised
      setHandRaised(newState)
      
      // Send data to other participants
      const data = new TextEncoder().encode(JSON.stringify({
        type: 'hand_raised',
        participant: getDisplayName(),
        raised: newState
      }))
      
      room.localParticipant.publishData(data, {
        reliable: true
      })
      
      console.log(`✋ Hand ${newState ? 'raised' : 'lowered'}`)
      setStatus(newState ? "Hand raised" : "Hand lowered")
    }
  }

  // Video quality control
  const changeVideoQuality = async (quality: 'low' | 'medium' | 'high') => {
    setVideoQuality(quality)
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        const constraints = {
          width: quality === 'low' ? 640 : quality === 'medium' ? 1280 : 1920,
          height: quality === 'low' ? 480 : quality === 'medium' ? 720 : 1080,
          frameRate: quality === 'low' ? 15 : quality === 'medium' ? 24 : 30
        }
        
        try {
          await videoTrack.applyConstraints(constraints)
          console.log(`📹 Video quality changed to ${quality}`)
          setStatus(`Video quality: ${quality}`)
        } catch (error) {
          console.error('❌ Failed to change video quality:', error)
        }
      }
    }
  }

  // Video layout control
  const changeVideoLayout = (layout: 'speaker' | 'grid' | 'spotlight') => {
    setVideoLayout(layout)
    console.log(`📺 Video layout changed to ${layout}`)
    setStatus(`Layout: ${layout}`)
  }

  // Spotlight participant
  const spotlightParticipant = (participantId: string) => {
    setSpotlightedParticipant(participantId)
    setVideoLayout('spotlight')
    console.log(`🎯 Spotlighted participant: ${participantId}`)
    setStatus(`Spotlighted: ${participantId}`)
  }

  // Recording functionality
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setStatus("Recording stopped")
      console.log('🔴 Recording stopped')
    } else {
      // Start recording
      setIsRecording(true)
      setStatus("Recording started")
      console.log('🔴 Recording started')
      
      // Note: Actual recording implementation would require LiveKit Cloud recording service
      // or integration with recording API
    }
  }

  // Whiteboard toggle
  const toggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard)
    console.log(`📝 Whiteboard ${showWhiteboard ? 'closed' : 'opened'}`)
    setStatus(`Whiteboard ${showWhiteboard ? 'closed' : 'opened'}`)
  }

  // Get available devices
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      const microphones = devices.filter(device => device.kind === 'audioinput')
      
      setAvailableCameras(cameras)
      setAvailableMicrophones(microphones)
      
      // Set default devices if none selected
      if (!selectedCamera && cameras.length > 0) {
        setSelectedCamera(cameras[0].deviceId)
      }
      if (!selectedMicrophone && microphones.length > 0) {
        setSelectedMicrophone(microphones[0].deviceId)
      }
    } catch (error) {
      console.error('Error getting devices:', error)
    }
  }

  // Switch camera
  const switchCamera = async (deviceId: string) => {
    if (!localStream) return
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true
      })
      
      // Stop old video track
      const oldVideoTrack = localStream.getVideoTracks()[0]
      if (oldVideoTrack) {
        oldVideoTrack.stop()
        localStream.removeTrack(oldVideoTrack)
      }
      
      // Add new video track
      const newVideoTrack = newStream.getVideoTracks()[0]
      localStream.addTrack(newVideoTrack)
      
      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
      }
      
      setSelectedCamera(deviceId)
      console.log('📹 Camera switched to:', deviceId)
    } catch (error) {
      console.error('Error switching camera:', error)
    }
  }

  // Switch microphone
  const switchMicrophone = async (deviceId: string) => {
    if (!localStream) return
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: { deviceId: { exact: deviceId } }
      })
      
      // Stop old audio track
      const oldAudioTrack = localStream.getAudioTracks()[0]
      if (oldAudioTrack) {
        oldAudioTrack.stop()
        localStream.removeTrack(oldAudioTrack)
      }
      
      // Add new audio track
      const newAudioTrack = newStream.getAudioTracks()[0]
      localStream.addTrack(newAudioTrack)
      
      setSelectedMicrophone(deviceId)
      console.log('🎤 Microphone switched to:', deviceId)
    } catch (error) {
      console.error('Error switching microphone:', error)
    }
  }

  // Verify device state for debugging
  const verifyDeviceState = () => {
    console.log('🔍 Device State Verification:')
    console.log('📹 UI Camera state:', cameraOn)
    console.log('🎤 UI Mic state:', micOn)
    console.log('🔗 Local stream exists:', !!localStream)
    
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      const audioTracks = localStream.getAudioTracks()
      
      console.log('📹 Video tracks count:', videoTracks.length)
      console.log('🎤 Audio tracks count:', audioTracks.length)
      
      videoTracks.forEach((track, index) => {
        console.log(`📹 Video track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        })
      })
      
      audioTracks.forEach((track, index) => {
        console.log(`🎤 Audio track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        })
      })
    }
    
    console.log('📹 Video element display:', localVideoRef.current?.style.display)
    console.log('📹 Video element has source:', !!localVideoRef.current?.srcObject)
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Status */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
          {status}
        </div>
      </div>

      {/* Debug info */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="bg-black/70 text-white px-3 py-1 rounded text-xs">
          Camera: {cameraOn ? 'ON' : 'OFF'} | Mic: {micOn ? 'ON' : 'OFF'}
        </div>
        <button
          onClick={verifyDeviceState}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
        >
          Debug
        </button>
      </div>

      {/* Display name */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
          {getDisplayName()}
        </div>
      </div>

      {/* Main video area */}
      <div className="relative w-full h-full">
        {/* Local video */}
        <div className="absolute inset-0">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            style={{ display: cameraOn ? 'block' : 'none' }}
          />
          {!cameraOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-2">📹</div>
                <div className="text-lg">Camera Off</div>
                <div className="text-sm text-gray-400">
                  Click camera button to enable
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Device will only activate when you enable it
                </div>
              </div>
            </div>
          )}
        </div>

         {/* Remote video with layout support */}
         {participants.length > 0 && (
           <div className={`${
             videoLayout === 'grid' 
               ? 'absolute top-4 right-4 w-48 h-36' 
               : videoLayout === 'spotlight' && spotlightedParticipant
                 ? 'absolute inset-0 w-full h-full'
                 : 'absolute top-4 right-4 w-48 h-36'
           } bg-gray-800 rounded border-2 border-white/20 overflow-hidden`}>
             <video
               ref={remoteVideoRef}
               className="w-full h-full object-cover"
               playsInline
             />
             <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
               {participants[0]?.identity || 'Participant'}
             </div>
           </div>
         )}

         {/* Grid layout for multiple participants */}
         {videoLayout === 'grid' && participants.length > 1 && (
           <div className="absolute top-4 left-4 grid grid-cols-2 gap-2">
             {participants.slice(1).map((participant, index) => (
               <div key={participant.identity} className="w-24 h-18 bg-gray-800 rounded border border-white/20 overflow-hidden">
                 <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                   <div className="text-white text-xs">{participant.identity}</div>
                 </div>
               </div>
             ))}
           </div>
         )}

         {/* Audio indicator when mic is on but camera is off */}
         {micOn && !cameraOn && (
           <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
             <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-full text-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               Microphone Active
             </div>
           </div>
         )}

         {/* Hand raised indicator */}
         {handRaised && (
           <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
             <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-bounce">
               <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
               Hand Raised
             </div>
           </div>
         )}

         {/* Screen sharing indicator */}
         {screenSharing && (
           <div className="absolute top-20 right-20">
             <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-2 rounded-full text-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
               Screen Sharing
             </div>
           </div>
         )}
      </div>

      {/* Simple controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/70 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
          {/* Camera button */}
          <IconActionButton
            icon={cameraOn ? Video : VideoOff}
            label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
            onClick={toggleCamera}
            variant={cameraOn ? "default" : "destructive"}
            size="icon"
            className="h-8 w-8"
          />

          {/* Microphone button */}
          <IconActionButton
            icon={micOn ? Mic : MicOff}
            label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            onClick={toggleMic}
            variant={micOn ? "default" : "destructive"}
            size="icon"
            className="h-8 w-8"
          />

          {/* Screen share button */}
          <IconActionButton
            icon={Monitor}
            label={screenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
            onClick={() => toggleScreenShare('screen')}
            variant={screenSharing ? "default" : "secondary"}
            size="icon"
            className="h-8 w-8"
          />

          {/* Raise hand button */}
          <IconActionButton
            icon={Hand}
            label={handRaised ? 'Lower hand' : 'Raise hand'}
            onClick={toggleRaiseHand}
            variant={handRaised ? "default" : "secondary"}
            size="icon"
            className="h-8 w-8"
          />

          {/* Whiteboard button */}
          <IconActionButton
            icon={Palette}
            label={showWhiteboard ? 'Close whiteboard' : 'Open whiteboard'}
            onClick={toggleWhiteboard}
            variant={showWhiteboard ? "default" : "secondary"}
            size="icon"
            className="h-8 w-8"
          />

          {/* Settings button */}
          <IconActionButton
            icon={Settings}
            label="Settings"
            onClick={() => setShowSettings(!showSettings)}
            variant={showSettings ? "default" : "secondary"}
            size="icon"
            className="h-8 w-8"
          />

           {/* Connection status */}
           <div className="flex items-center gap-2 text-white text-sm">
             <div className={`w-2 h-2 rounded-full ${
               isConnected ? 'bg-green-500' : 'bg-red-500'
             }`}></div>
             <span className="text-xs">
               {isConnected ? 'LiveKit Connected' : 'Connecting...'}
             </span>
           </div>
           
           {/* Participant count */}
           {participants.length > 0 && (
             <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
               {participants.length} participant{participants.length !== 1 ? 's' : ''}
             </div>
           )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/90 backdrop-blur rounded-lg p-3 min-w-[280px]">
            <div className="text-white text-sm font-semibold mb-3">Settings</div>
            
            {/* Camera Selection */}
            {availableCameras.length > 1 && (
              <div className="mb-3">
                <div className="text-white text-xs mb-2">Camera</div>
                <div className="space-y-1">
                  {availableCameras.map((camera) => (
                    <button
                      key={camera.deviceId}
                      onClick={() => switchCamera(camera.deviceId)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                        selectedCamera === camera.deviceId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Microphone Selection */}
            {availableMicrophones.length > 1 && (
              <div className="mb-3">
                <div className="text-white text-xs mb-2">Microphone</div>
                <div className="space-y-1">
                  {availableMicrophones.map((microphone) => (
                    <button
                      key={microphone.deviceId}
                      onClick={() => switchMicrophone(microphone.deviceId)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                        selectedMicrophone === microphone.deviceId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {microphone.label || `Microphone ${microphone.deviceId.slice(0, 8)}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Video Quality */}
            <div className="mb-3">
              <div className="text-white text-xs mb-2">Video Quality</div>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <IconActionButton
                    key={quality}
                    icon={quality === 'low' ? Video : quality === 'medium' ? Video : Video}
                    label={`${quality.charAt(0).toUpperCase() + quality.slice(1)} Quality`}
                    onClick={() => changeVideoQuality(quality)}
                    variant={videoQuality === quality ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                  />
                ))}
              </div>
            </div>

            {/* Video Layout */}
            <div className="mb-3">
              <div className="text-white text-xs mb-2">Video Layout</div>
              <div className="flex gap-2">
                <IconActionButton
                  icon={User}
                  label="Speaker View"
                  onClick={() => changeVideoLayout('speaker')}
                  variant={videoLayout === 'speaker' ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                />
                <IconActionButton
                  icon={Grid3X3}
                  label="Grid View"
                  onClick={() => changeVideoLayout('grid')}
                  variant={videoLayout === 'grid' ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                />
                <IconActionButton
                  icon={Users}
                  label="Spotlight View"
                  onClick={() => changeVideoLayout('spotlight')}
                  variant={videoLayout === 'spotlight' ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Participant Spotlight */}
            {participants.length > 0 && (
              <div className="mb-3">
                <div className="text-white text-xs mb-2">Spotlight Participant</div>
                <div className="space-y-1">
                  {participants.map((participant) => (
                    <IconActionButton
                      key={participant.identity}
                      icon={User}
                      label={`Spotlight ${participant.identity}`}
                      onClick={() => spotlightParticipant(participant.identity)}
                      variant={spotlightedParticipant === participant.identity ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-xs"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Close Settings */}
            <IconActionButton
              icon={Settings}
              label="Close Settings"
              onClick={() => setShowSettings(false)}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Whiteboard Component */}
      <Whiteboard
        room={room}
        isVisible={showWhiteboard}
        onClose={() => setShowWhiteboard(false)}
        participantName={getDisplayName()}
      />
    </div>
  )
}