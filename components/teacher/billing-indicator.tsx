"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BillingService } from "@/services/billing/api"
import { useToast } from "@/hooks/use-toast"
import { Crown, Users, Loader2, Zap } from "lucide-react"

interface BillingIndicatorProps {
  variant?: 'compact' | 'full'
  showUpgradeButton?: boolean
}

export function BillingIndicator({ variant = 'compact', showUpgradeButton = true }: BillingIndicatorProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  useEffect(() => {
    if (user?.email) {
      loadSubscriptionStatus()
    }
  }, [user])

  const loadSubscriptionStatus = async () => {
    if (!user?.email) return
    
    setLoading(true)
    try {
      const status = await BillingService.getSubscriptionStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Failed to load subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await BillingService.createCheckoutSession()
      window.location.href = response.url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-base font-semibold text-blue-300">Loading...</span>
      </div>
    )
  }

  const isPro = subscriptionStatus?.subscription_status === 'pro'
  const maxStudents = subscriptionStatus?.max_students_allowed || 5

  if (variant === 'compact') {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10 w-full max-w-xs">
        <Badge variant={isPro ? "default" : "secondary"} className="text-xs px-3 py-1 font-bold">
          {isPro ? (
            <Crown className="w-3 h-3 mr-1 text-yellow-400" />
          ) : (
            <Users className="w-3 h-3 mr-1 text-blue-400" />
          )}
          {isPro ? "Pro" : "Free"}
        </Badge>
        {showUpgradeButton && !isPro && (
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="h-8 px-4 text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Upgrade to Pro"
          >
            <Zap className="w-3 h-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-800/50 rounded-lg border border-white/10 w-full max-w-lg">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Badge variant={isPro ? "default" : "secondary"} className="px-4 py-2 font-bold text-base">
          {isPro ? (
            <Crown className="w-4 h-4 mr-1 text-yellow-400" />
          ) : (
            <Users className="w-4 h-4 mr-1 text-blue-400" />
          )}
          {isPro ? "Pro Plan" : "Free Plan"}
        </Badge>
        <div className="text-base text-blue-200 font-semibold">
          {maxStudents} students max
        </div>
      </div>
      {showUpgradeButton && !isPro && (
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="font-bold px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Upgrade to Pro"
        >
          <Zap className="w-4 h-4 mr-1" />
          Upgrade to Pro
        </Button>
      )}
    </div>
  )
}
