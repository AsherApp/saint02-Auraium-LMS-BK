"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BillingService, SubscriptionStatus } from "@/services/billing/api"
import { 
  CreditCard, 
  Crown, 
  Users, 
  Check, 
  X, 
  Zap, 
  Star,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"

export function BillingSection() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email) {
      loadSubscriptionStatus()
    }
  }, [user])

  const loadSubscriptionStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const status = await BillingService.getSubscriptionStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Failed to load subscription status:', error)
      // If teacher not found, create a default status
      if (error instanceof Error && error.message.includes('teacher_not_found')) {
        setSubscriptionStatus({
          subscription_status: 'free',
          max_students_allowed: 5,
          has_subscription: false,
          trial_status: undefined,
          subscription: undefined
        })
      } else {
        setError('Failed to load subscription status')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setTrialLoading(true)
    try {
      await BillingService.startTrial()
      toast({
        title: "Trial Started!",
        description: "Your 7-day free trial has begun. Enjoy all Pro features!",
      })
      await loadSubscriptionStatus() // Reload status
    } catch (error: any) {
      console.error('Failed to start trial:', error)
      const message = error?.error === 'trial_not_available' 
        ? 'Trial not available. You may already have a trial or subscription.'
        : 'Failed to start trial. Please try again.'
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setTrialLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const response = await BillingService.createCheckoutSession()
      
      // Redirect to Stripe checkout
      window.location.href = response.url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await BillingService.createPortalSession()
      
      // Redirect to Stripe customer portal
      window.location.href = response.url
    } catch (error) {
      console.error('Failed to access customer portal:', error)
      toast({
        title: "Error",
        description: "Failed to access customer portal",
        variant: "destructive"
      })
    } finally {
      setPortalLoading(false)
    }
  }

  const isPro = subscriptionStatus?.subscription_status === 'pro'
  const isOnTrial = BillingService.isOnTrial(subscriptionStatus)
  const maxStudents = subscriptionStatus?.max_students_allowed || 50

  const plans = [
    {
      name: "Pro Plan",
      price: "£50",
      period: "per month",
      students: 50,
      features: [
        "Up to 50 students",
        "Unlimited courses & modules",
        "Live video classes",
        "Interactive whiteboard",
        "Advanced assignments",
        "Real-time chat",
        "Progress tracking",
        "Priority support",
        "File uploads (100MB)",
        "Advanced analytics",
        "Student management",
        "Event scheduling"
      ],
      limitations: [],
      current: isPro || isOnTrial,
      popular: true
    }
  ]

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading subscription status...</span>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center space-x-2 text-red-400">
          <AlertCircle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Current Plan</h3>
            <p className="text-slate-300">
              {isPro ? "Pro Plan" : isOnTrial ? "Pro Trial" : "No Active Plan"} - {maxStudents} students maximum
            </p>
          </div>
          <Badge variant={isPro ? "default" : isOnTrial ? "secondary" : "outline"}>
            {isPro ? (
              <Crown className="w-4 h-4 mr-1" />
            ) : isOnTrial ? (
              <Clock className="w-4 h-4 mr-1" />
            ) : (
              <Users className="w-4 h-4 mr-1" />
            )}
            {isPro ? "Pro" : isOnTrial ? "Trial" : "None"}
          </Badge>
        </div>

        {/* Trial Status */}
        {isOnTrial && subscriptionStatus?.trial_status && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium">
                  {BillingService.getTrialMessage(subscriptionStatus.trial_status)}
                </span>
              </div>
              {BillingService.isTrialExpiringSoon(subscriptionStatus.trial_status) && (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            {BillingService.isTrialExpiringSoon(subscriptionStatus.trial_status) && (
              <p className="text-amber-300 text-sm mt-2">
                Your trial is expiring soon. Upgrade to Pro to keep all features.
              </p>
            )}
          </div>
        )}

        {subscriptionStatus?.subscription && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Subscription Status:</span>
              <Badge variant={subscriptionStatus.subscription.status === 'active' ? 'default' : 'destructive'}>
                {subscriptionStatus.subscription.status}
              </Badge>
            </div>
            {subscriptionStatus.subscription.cancel_at_period_end && (
              <div className="mt-2 flex items-center space-x-2 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Subscription will cancel at period end</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex space-x-3">
          {!isPro && !isOnTrial ? (
            <>
              <Button 
                onClick={handleStartTrial} 
                disabled={trialLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {trialLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Start Free Trial
              </Button>
              <Button 
                onClick={handleUpgrade} 
                disabled={checkoutLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                Upgrade to Pro
              </Button>
            </>
          ) : isOnTrial ? (
            <Button 
              onClick={handleUpgrade} 
              disabled={checkoutLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {checkoutLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Upgrade to Pro
            </Button>
          ) : (
            <Button 
              onClick={handleManageSubscription} 
              disabled={portalLoading}
              variant="outline"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Plans Comparison */}
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          {plans.map((plan) => (
            <Card key={plan.name} className="relative ring-2 ring-purple-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.current && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-slate-400">{plan.period}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-sm text-slate-400">Up to {plan.students} students</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {plan.current ? (
                  <div className="mt-6">
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Button 
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Information */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Information</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">{maxStudents}</div>
            <div className="text-sm text-slate-400">Student Limit</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-white">
              {isPro ? "Pro" : isOnTrial ? "Trial" : "None"}
            </div>
            <div className="text-sm text-slate-400">Plan Type</div>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">
              {subscriptionStatus?.subscription?.status || "Active"}
            </div>
            <div className="text-sm text-slate-400">Status</div>
          </div>
        </div>
      </GlassCard>

      {/* Billing Support */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Billing Support</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            • All payments are processed securely through Stripe
          </p>
          <p>
            • 7-day free trial available with no credit card required
          </p>
          <p>
            • You can cancel your subscription at any time
          </p>
          <p>
            • Pro plan includes priority support and advanced features
          </p>
          <p>
            • Need help? Contact support for billing questions
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
