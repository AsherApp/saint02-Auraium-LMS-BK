"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BillingService } from "@/services/billing/api"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard,
  Settings,
  Database,
  Globe
} from "lucide-react"

interface StripeHealthStatus {
  status: string
  timestamp: string
  stripe: {
    config: {
      isValid: boolean
      errors: string[]
    }
    connection: {
      success: boolean
      error?: string
    }
    products: {
      isValid: boolean
      errors: string[]
      products: Array<{
        id: string
        type: string
        active: boolean
      }>
    }
  }
}

export function StripeHealthCheck() {
  const [status, setStatus] = useState<StripeHealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const healthStatus = await BillingService.getHealthStatus()
      setStatus(healthStatus)
    } catch (err: any) {
      setError(err.message || 'Failed to check Stripe health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (isValid: boolean) => {
    return (
      <Badge variant={isValid ? "success" : "destructive"}>
        {isValid ? "Healthy" : "Issues"}
      </Badge>
    )
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-white">Stripe Health Check</h3>
        </div>
        <div className="text-red-400 mb-4">{error}</div>
        <Button onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </GlassCard>
    )
  }

  if (!status) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          <h3 className="text-lg font-semibold text-white">Checking Stripe Health...</h3>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Stripe Health Check</h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(status.stripe.config.isValid && status.stripe.connection.success && status.stripe.products.isValid)}
          <Button onClick={checkHealth} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Configuration Status */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="font-medium text-white">Configuration</h4>
              <p className="text-sm text-slate-400">Environment variables and settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.stripe.config.isValid)}
            {getStatusBadge(status.stripe.config.isValid)}
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="font-medium text-white">Connection</h4>
              <p className="text-sm text-slate-400">Stripe API connectivity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.stripe.connection.success)}
            {getStatusBadge(status.stripe.connection.success)}
          </div>
        </div>

        {/* Products Status */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-purple-500" />
            <div>
              <h4 className="font-medium text-white">Products & Prices</h4>
              <p className="text-sm text-slate-400">Subscription products validation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.stripe.products.isValid)}
            {getStatusBadge(status.stripe.products.isValid)}
          </div>
        </div>

        {/* Error Details */}
        {(status.stripe.config.errors.length > 0 || 
          status.stripe.connection.error || 
          status.stripe.products.errors.length > 0) && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h4 className="font-medium text-red-400">Issues Found</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              {status.stripe.config.errors.map((error, index) => (
                <div key={index} className="text-red-300">
                  <strong>Config:</strong> {error}
                </div>
              ))}
              
              {status.stripe.connection.error && (
                <div className="text-red-300">
                  <strong>Connection:</strong> {status.stripe.connection.error}
                </div>
              )}
              
              {status.stripe.products.errors.map((error, index) => (
                <div key={index} className="text-red-300">
                  <strong>Products:</strong> {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products List */}
        {status.stripe.products.products.length > 0 && (
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-medium text-white mb-3">Available Products</h4>
            <div className="space-y-2">
              {status.stripe.products.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={product.active ? "success" : "secondary"}>
                      {product.type}
                    </Badge>
                    <span className="text-sm text-slate-300">{product.id}</span>
                  </div>
                  <Badge variant={product.active ? "success" : "destructive"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Check */}
        <div className="text-xs text-slate-500 text-center">
          Last checked: {new Date(status.timestamp).toLocaleString()}
        </div>
      </div>
    </GlassCard>
  )
}
