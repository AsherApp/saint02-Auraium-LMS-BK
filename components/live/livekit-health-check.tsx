"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface LiveKitHealthStatus {
  isConfigured: boolean
  tokenGeneration: boolean
  websocketConnection: boolean
  error?: string
}

export function LiveKitHealthCheck() {
  const [status, setStatus] = useState<LiveKitHealthStatus>({
    isConfigured: false,
    tokenGeneration: false,
    websocketConnection: false
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkLiveKitHealth = async () => {
    setIsChecking(true)
    setStatus({
      isConfigured: false,
      tokenGeneration: false,
      websocketConnection: false
    })

    try {
      // Test token generation
      const tokenResponse = await fetch('/api/livekit/token?room=health-check&identity=health-check')
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        
        if (tokenData.token && tokenData.wsUrl) {
          setStatus(prev => ({
            ...prev,
            isConfigured: true,
            tokenGeneration: true
          }))

          // Test WebSocket connection (basic check)
          try {
            const ws = new WebSocket(tokenData.wsUrl)
            
            ws.onopen = () => {
              setStatus(prev => ({
                ...prev,
                websocketConnection: true
              }))
              ws.close()
            }
            
            ws.onerror = () => {
              setStatus(prev => ({
                ...prev,
                websocketConnection: false,
                error: "WebSocket connection failed"
              }))
            }
            
            // Timeout after 5 seconds
            setTimeout(() => {
              if (ws.readyState === WebSocket.CONNECTING) {
                ws.close()
                setStatus(prev => ({
                  ...prev,
                  websocketConnection: false,
                  error: "WebSocket connection timeout"
                }))
              }
            }, 5000)
          } catch (wsError) {
            setStatus(prev => ({
              ...prev,
              websocketConnection: false,
              error: "WebSocket test failed"
            }))
          }
        } else {
          setStatus(prev => ({
            ...prev,
            isConfigured: false,
            error: "Invalid token response"
          }))
        }
      } else {
        const errorData = await tokenResponse.json().catch(() => ({}))
        setStatus(prev => ({
          ...prev,
          isConfigured: false,
          error: errorData.error || "Token generation failed"
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isConfigured: false,
        error: error instanceof Error ? error.message : "Health check failed"
      }))
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkLiveKitHealth()
  }, [])

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    )
  }

  const getStatusBadge = (isHealthy: boolean, label: string) => {
    return (
      <Badge 
        variant={isHealthy ? "success" : "destructive"}
        className="flex items-center gap-1"
      >
        {getStatusIcon(isHealthy)}
        {label}
      </Badge>
    )
  }

  const overallStatus = status.isConfigured && status.tokenGeneration && status.websocketConnection

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">LiveKit Health Check</h3>
        <Button
          onClick={checkLiveKitHealth}
          disabled={isChecking}
          size="sm"
          variant="outline"
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isChecking ? "Checking..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Environment Configuration</span>
          {getStatusBadge(status.isConfigured, status.isConfigured ? "Configured" : "Not Configured")}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">Token Generation</span>
          {getStatusBadge(status.tokenGeneration, status.tokenGeneration ? "Working" : "Failed")}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-300">WebSocket Connection</span>
          {getStatusBadge(status.websocketConnection, status.websocketConnection ? "Connected" : "Failed")}
        </div>

        {status.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error:</span>
            </div>
            <p className="text-sm text-red-300 mt-1">{status.error}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Overall Status</span>
            {getStatusBadge(overallStatus, overallStatus ? "Healthy" : "Issues Detected")}
          </div>
          
          {!overallStatus && (
            <div className="mt-2 text-sm text-slate-400">
              <p>LiveKit is not properly configured. Live video features will use fallback mode.</p>
              <p className="mt-1">Check your environment variables and LiveKit dashboard configuration.</p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
