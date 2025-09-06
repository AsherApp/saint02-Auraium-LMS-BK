"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { BillingService } from "@/services/billing/api"
import { 
  Crown, 
  Users, 
  CheckCircle, 
  CreditCard,
  ArrowRight,
  Loader2,
  Star,
  Shield,
  Video,
  BarChart3,
  HeadphonesIcon,
  BookOpen,
  Lock,
  Clock,
  FileText
} from "lucide-react"
import { motion } from "framer-motion"

interface BillingSignupFlowProps {
  isOpen: boolean
  onClose: () => void
  teacherEmail: string
  teacherName: string
}

export function BillingSignupFlow({ 
  isOpen, 
  onClose, 
  teacherEmail, 
  teacherName 
}: BillingSignupFlowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<'welcome' | 'plans' | 'payment' | 'complete'>('welcome')
  const [loading, setLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const handleAccessPayment = async () => {
    try {
      setLoading(true)
      const checkout = await BillingService.createCheckoutSession()
      
      if (checkout.url) {
        setCheckoutUrl(checkout.url)
        setStep('payment')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      toast({ 
        title: "Payment Failed", 
        description: "Please try again or contact support", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onClose()
    router.push('/teacher/dashboard')
  }

  const handlePaymentRedirect = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Welcome to AuraiumLMS, {teacherName}! 🔐
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-lg">
                Your account has been created successfully. To access the platform, you need to complete your payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-2">Platform Access Required</h3>
                <p className="text-slate-300 text-sm">
                  AuraiumLMS is a premium platform. Complete your payment to unlock full access and start teaching.
                </p>
              </div>

              <Button 
                onClick={() => setStep('plans')}
                size="lg"
                className="px-8"
              >
                View Access Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Plans Step */}
        {step === 'plans' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-white">
                Choose Your Access Plan
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                All plans include platform access and 5 student slots
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Access */}
              <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Basic Access</h3>
                  <p className="text-3xl font-bold text-white">$29</p>
                  <p className="text-slate-400 text-sm">monthly subscription</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Full platform access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5 student slots included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All basic features
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email support
                  </li>
                </ul>

                <div className="text-center">
                  <Badge className="bg-green-600/80 text-white">Most Popular</Badge>
                </div>
              </div>

              {/* Premium Access */}
              <div className="border border-blue-500/50 rounded-lg p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Premium</Badge>
                </div>
                
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Premium Access</h3>
                  <p className="text-3xl font-bold text-white">$49</p>
                  <p className="text-slate-400 text-sm">monthly subscription</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Full platform access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    5 student slots included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced features
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Early access to new features
                  </li>
                </ul>

                <div className="text-center">
                  <Badge className="bg-blue-600/80 text-white">Best Value</Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => setStep('welcome')}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              
              <Button 
                onClick={handleAccessPayment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Processing...' : 'Pay to Access Platform'}
              </Button>
            </div>

            {/* Important Notice */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-sm">Important Notice</h4>
                  <p className="text-orange-200 text-xs">
                    • No free tier available - payment required for platform access<br/>
                    • 5 student slots included with initial payment<br/>
                    • Additional student slots can be purchased later<br/>
                    • Monthly recurring subscription with automatic billing
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-6"
          >
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Complete Your Platform Access
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                You'll be redirected to our secure payment processor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-2">What You'll Get</h3>
                <ul className="text-left space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Full AuraiumLMS platform access
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    5 student slots included
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    Create unlimited courses
                  </li>
                  <li className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-400" />
                    Host live classes
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    Create assignments & quizzes
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handlePaymentRedirect}
                  size="lg"
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue to Payment
                </Button>
                
                <Button 
                  onClick={() => setStep('plans')}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Back to Plans
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                Payment Processing! 🔄
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Your payment is being processed. You'll receive access confirmation shortly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-2">What Happens Next?</h3>
                <ul className="text-left space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    Payment processing (usually instant)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    Platform access unlocked
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    5 student slots available
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    Start creating courses immediately
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleComplete}
                size="lg"
                variant="success"
                className="px-8"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
