"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { BillingService, SubscriptionStatus, TrialStatus } from "@/services/billing/api"
import { 
  CreditCard, 
  Users, 
  Calendar, 
  Crown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Lock,
  Plus,
  Info
} from "lucide-react"
import { motion } from "framer-motion"

export function BillingDashboard() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  // Fetch subscription status
  useEffect(() => {
    if (user?.email) {
      fetchSubscriptionStatus()
    }
  }, [user?.email])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      const status = await BillingService.getSubscriptionStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
      toast({ 
        title: "Error", 
        description: "Failed to load subscription information", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseSlots = async (slotCount: number) => {
    try {
      setPurchasing(true)
      const checkout = await BillingService.createCheckoutSession()
      
      // Redirect to Stripe checkout
      if (checkout.url) {
        window.location.href = checkout.url
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      toast({ 
        title: "Purchase Failed", 
        description: "Please try again or contact support", 
        variant: "destructive" 
      })
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const currentSlots = subscriptionStatus?.max_students_allowed || 5
  const remainingSlots = Math.max(0, currentSlots - 0) // Assuming 0 current students for now

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Platform Access Status</h2>
              <p className="text-slate-400 text-sm">Manage your student slots and platform access</p>
            </div>
          </div>
          <Badge 
            variant="default"
            className="bg-green-600/80 text-white"
          >
            Platform Access Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Student Slots</span>
              <span className="text-white font-semibold">{currentSlots}</span>
            </div>
            <Progress 
              value={0} 
              className="h-2" 
              max={currentSlots}
            />
            <p className="text-xs text-slate-500">
              {remainingSlots > 0 ? `You can add ${remainingSlots} more students` : 'All slots used'}
            </p>
          </div>

          {/* Platform Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Status</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-white font-semibold">Active</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Full platform access granted
            </p>
          </div>

          {/* Access Type */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Access Type</span>
              <span className="text-white font-semibold">Paid Access</span>
            </div>
            <p className="text-xs text-slate-500">
              Monthly subscription model
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Student Slot Management */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Purchase Additional Student Slots</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 5 Additional Slots */}
          <div className="border border-white/10 rounded-lg p-6 bg-white/5">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-white">5 Additional Slots</h4>
              <p className="text-3xl font-bold text-white">$19</p>
              <p className="text-slate-400 text-sm">monthly subscription</p>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                +5 student slots
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Immediate activation
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No recurring fees
              </li>
            </ul>

            <div className="text-center">
              <Button 
                onClick={() => handlePurchaseSlots(5)}
                disabled={purchasing}
                className="w-full"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {purchasing ? 'Processing...' : 'Purchase 5 Slots'}
              </Button>
            </div>
          </div>

          {/* 10 Additional Slots */}
          <div className="border border-blue-500/50 rounded-lg p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-600 text-white">Best Value</Badge>
            </div>
            
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-white">10 Additional Slots</h4>
              <p className="text-3xl font-bold text-white">$35</p>
              <p className="text-slate-400 text-sm">monthly subscription</p>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="h-4 w-4 text-green-500" />
                +10 student slots
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Immediate activation
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No recurring fees
              </li>
              <li className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Save $3 vs individual
              </li>
            </ul>

            <div className="text-center">
              <Button 
                onClick={() => handlePurchaseSlots(10)}
                disabled={purchasing}
                className="w-full"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {purchasing ? 'Processing...' : 'Purchase 10 Slots'}
              </Button>
            </div>
          </div>

          {/* 20 Additional Slots */}
          <div className="border border-white/10 rounded-lg p-6 bg-white/5">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-white">20 Additional Slots</h4>
              <p className="text-3xl font-bold text-white">$65</p>
              <p className="text-slate-400 text-sm">monthly subscription</p>
            </div>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                +20 student slots
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Immediate activation
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No recurring fees
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Save $11 vs individual
              </li>
            </ul>

            <div className="text-center">
              <Button 
                onClick={() => handlePurchaseSlots(20)}
                disabled={purchasing}
                className="w-full"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {purchasing ? 'Processing...' : 'Purchase 20 Slots'}
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Important Information */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Platform Access Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white">What You Have Access To:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Full AuraiumLMS platform
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Create unlimited courses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Host live video classes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Create assignments & quizzes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Student management tools
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-white">Student Slot System:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Initial payment includes 5 student slots
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Purchase additional slots as needed
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Monthly recurring subscription
              </li>
              <li className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Automatic monthly billing
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
