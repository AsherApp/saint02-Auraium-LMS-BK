import { NextRequest } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomName = searchParams.get("room") || "default"
    const identity = searchParams.get("identity") || `guest_${Math.random().toString(36).slice(2, 8)}`

    // Validate input parameters
    if (!roomName || roomName.trim() === "") {
      return new Response(JSON.stringify({ error: "Room name is required" }), { 
        status: 400,
        headers: { "content-type": "application/json" }
      })
    }

    if (!identity || identity.trim() === "") {
      return new Response(JSON.stringify({ error: "Identity is required" }), { 
        status: 400,
        headers: { "content-type": "application/json" }
      })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error("LiveKit environment variables not configured:", {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasWsUrl: !!wsUrl
      })
      return new Response(JSON.stringify({ error: "LiveKit environment not configured" }), { 
        status: 500,
        headers: { "content-type": "application/json" }
      })
    }

    // Create access token with proper permissions
    const at = new AccessToken(apiKey, apiSecret, { 
      identity: identity.trim(),
      ttl: 3600 // 1 hour token expiry
    })
    
    at.addGrant({ 
      room: roomName.trim(), 
      roomJoin: true, 
      canPublish: true, 
      canSubscribe: true,
      roomAdmin: false, // Only allow admin for specific cases
      roomCreate: false,
      roomList: false
    })
    
    const token = await at.toJwt()

    return new Response(JSON.stringify({ 
      token, 
      wsUrl,
      room: roomName.trim(),
      identity: identity.trim()
    }), {
      headers: { 
        "content-type": "application/json",
        "cache-control": "no-cache, no-store, must-revalidate"
      },
    })
  } catch (error) {
    console.error("LiveKit token generation error:", error)
    return new Response(JSON.stringify({ 
      error: "Failed to generate LiveKit token",
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}

