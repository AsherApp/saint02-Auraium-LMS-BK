import { NextRequest } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomName = searchParams.get("room") || "default"
  const identity = searchParams.get("identity") || `guest_${Math.random().toString(36).slice(2, 8)}`

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return new Response(JSON.stringify({ error: "LiveKit env not configured" }), { status: 400 })
  }

  const at = new AccessToken(apiKey, apiSecret, { identity })
  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })
  const token = await at.toJwt()

  return new Response(JSON.stringify({ token, wsUrl }), {
    headers: { "content-type": "application/json" },
  })
}

