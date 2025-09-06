"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BillingService, SubscriptionStatus } from "@/services/billing/api"
import { 
  Users, 
  Crown, 
  AlertTriangle, 
  XCircle,
  CheckCircle,
  CreditCard,
  Lock
} from "lucide-react"
import { motion } from "framer-motion"

interface StudentLimitEnforcerProps {
  currentStudentCount: number
  onUpgradeClick?: () => void
  showUpgradePrompt?: boolean
  children?: React.ReactNode
}

export function StudentLimitEnforcer({ 
  currentStudentCount, 
  onUpgradeClick,
  showUpgradePrompt = true,
  children 
}: StudentLimitEnforcerProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLimitDialog, setShowLimitDialog] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }

  const canAddStudents = BillingService.canAddStudents(
    currentStudentCount, 
    subscriptionStatus?.max_students_allowed || 5
  )

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      // Default upgrade flow
      handleDefaultUpgrade()
    }
  }

  const handleDefaultUpgrade = async () => {
    try {
      const checkout = await BillingService.createCheckoutSession()
      if (checkout.url) {
        window.location.href = checkout.url
      }
    } catch (error) {
      console.error('Upgrade failed:', error)
      toast({ 
        title: "Upgrade Failed", 
        description: "Please try again or contact support", 
        variant: "destructive" 
      })
    }
  }

  // If loading, show children without enforcement
  if (loading) {
    return <>{children}</>
  }

  // If can add students, show children normally
  if (canAddStudents) {
    return <>{children}</>
  }

  // If can't add students and we should show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <>
        {children}
        
        {/* Student Limit Dialog */}
        <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
          <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Student Limit Reached
              </DialogTitle>
              <DialogDescription>
                You've used all your student slots. Purchase more slots to continue adding students.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Current Students</span>
                  <span className="text-white font-semibold">{currentStudentCount}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Student Slots</span>
                  <span className="text-white font-semibold">
                    {subscriptionStatus?.max_students_allowed || 5}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-400">All slots used</span>
                </div>
              </div>

              {/* Upgrade Options */}
              <div className="space-y-3">
                <Button 
                  onClick={handleUpgrade}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase More Student Slots
                </Button>
              </div>

              {/* Plan Benefits */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <h4 className="font-semibold text-blue-400 mb-2">Additional Student Slots:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• 5 additional slots: $19</li>
                  <li>• 10 additional slots: $35</li>
                  <li>• 20 additional slots: $65</li>
                  <li>• Monthly subscription, automatic billing</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Upgrade Banner */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 shadow-2xl border border-orange-400/30 max-w-sm z-50"
        >
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-white text-sm">Student Slots Exhausted</h4>
              <p className="text-orange-100 text-xs mb-3">
                You've used all your student slots. Purchase more to continue.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowLimitDialog(true)}
                  size="sm"
                  className="bg-white text-orange-600 hover:bg-orange-50 text-xs"
                >
                  Buy More Slots
                </Button>
                <Button 
                  onClick={() => setShowLimitDialog(false)}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 text-xs"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    )
  }

  // If we shouldn't show upgrade prompt, just show children
  return <>{children}</>
}

// Hook to check if user can add students
export function useStudentLimit() {
  const { user } = useAuthStore()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  const canAddStudents = (currentCount: number) => {
    return BillingService.canAddStudents(
      currentCount, 
      subscriptionStatus?.max_students_allowed || 5
    )
  }

  const getUpgradeMessage = (currentCount: number) => {
    if (currentCount >= (subscriptionStatus?.max_students_allowed || 5)) {
      return "Purchase more student slots to continue adding students"
    }
    return `You can add ${(subscriptionStatus?.max_students_allowed || 5) - currentCount} more students`
  }

  const getRemainingSlots = (currentCount: number) => {
    return Math.max(0, (subscriptionStatus?.max_students_allowed || 5) - currentCount)
  }

  return {
    subscriptionStatus,
    loading,
    canAddStudents,
    getUpgradeMessage,
    getRemainingSlots,
    refresh: fetchSubscriptionStatus
  }
}
