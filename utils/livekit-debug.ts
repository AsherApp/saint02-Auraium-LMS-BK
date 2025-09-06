/**
 * LiveKit debugging utilities
 */

export function logLiveKitDebugInfo() {
  console.group('🔍 LiveKit Debug Information')
  
  // Check browser support
  console.log('📱 Browser Support:')
  console.log('- MediaDevices:', !!navigator.mediaDevices)
  console.log('- getUserMedia:', !!navigator.mediaDevices?.getUserMedia)
  console.log('- WebRTC:', !!window.RTCPeerConnection)
  console.log('- WebSocket:', !!window.WebSocket)
  
  // Check permissions
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then(permission => {
        console.log('📹 Camera Permission:', permission.state)
      })
      .catch(() => {
        console.log('📹 Camera Permission: Could not check')
      })
    
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(permission => {
        console.log('🎤 Microphone Permission:', permission.state)
      })
      .catch(() => {
        console.log('🎤 Microphone Permission: Could not check')
      })
  }
  
  // Check media devices
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        console.log('📱 Available Devices:')
        devices.forEach(device => {
          console.log(`- ${device.kind}: ${device.label || 'Unknown'}`)
        })
      })
      .catch(err => {
        console.log('📱 Device enumeration failed:', err)
      })
  }
  
  // Test camera access
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('✅ Camera Access: SUCCESS')
        console.log('- Video tracks:', stream.getVideoTracks().length)
        console.log('- Audio tracks:', stream.getAudioTracks().length)
        
        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(err => {
        console.log('❌ Camera Access: FAILED')
        console.log('- Error:', err.name, err.message)
      })
  }
  
  console.groupEnd()
}

export function testLiveKitConnection(wsUrl: string, token: string) {
  console.group('🔗 LiveKit Connection Test')
  console.log('WebSocket URL:', wsUrl)
  console.log('Token length:', token.length)
  console.log('Token preview:', token.substring(0, 50) + '...')
  
  // Test WebSocket connection
  try {
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection: SUCCESS')
      ws.close()
    }
    
    ws.onerror = (error) => {
      console.log('❌ WebSocket connection: FAILED')
      console.log('Error:', error)
    }
    
    ws.onclose = () => {
      console.log('🔌 WebSocket connection: CLOSED')
    }
  } catch (error) {
    console.log('❌ WebSocket creation: FAILED')
    console.log('Error:', error)
  }
  
  console.groupEnd()
}
