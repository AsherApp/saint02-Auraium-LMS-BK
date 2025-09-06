"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useToast } from "@/hooks/use-toast"
import { BillingService, SubscriptionStatus } from "@/services/billing/api"
import { http } from "@/services/http"
import { 
  Crown, 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  CreditCard,
  BarChart3,
  Video,
  HeadphonesIcon,
  Shield,
  Star,
  TrendingUp,
  BookOpen,
  FileText,
  MessageSquare,
  Clock,
  Lock,
  Plus,
  Info,
  RefreshCw
} from "lucide-react"
import { motion } from "framer-motion"

export default function TeacherBillingPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { activeTab, handleTabChange } = useFluidTabs('overview')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [studentData, setStudentData] = useState<{
    totalStudents: number
    activeStudents: number
    studentsWithCourses: number
    averageProgress: number
  }>({
    totalStudents: 0,
    activeStudents: 0,
    studentsWithCourses: 0,
    averageProgress: 0
  })

  // Fetch subscription status and student data
  useEffect(() => {
    if (user?.email) {
      fetchSubscriptionStatus()
      fetchStudentData()
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

  const fetchStudentData = async () => {
    try {
      const response = await http<any>('/api/students/consolidated')
      const students = response.items || []
      
      setStudentData({
        totalStudents: students.length,
        activeStudents: students.filter((s: any) => s.status === 'active').length,
        studentsWithCourses: students.filter((s: any) => s.total_courses > 0).length,
        averageProgress: students.length > 0 
          ? Math.round(students.reduce((sum: number, s: any) => sum + s.overall_progress, 0) / students.length)
          : 0
      })
    } catch (error) {
      console.error('Failed to fetch student data:', error)
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
  const remainingSlots = Math.max(0, currentSlots - studentData.totalStudents)

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Platform Access & Student Slots</h1>
          <p className="text-slate-400 mt-2">Manage your platform access and purchase additional student slots</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-600/80 text-white">
            Platform Access Active
          </Badge>
        </div>
      </div>

            {/* Current Status Overview */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Platform Access */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Platform Access</h3>
            <p className="text-2xl font-bold text-white">Active</p>
            <p className="text-slate-400 text-sm">Full access granted</p>
          </div>

          {/* Student Slots */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Student Slots</h3>
            <p className="text-2xl font-bold text-white">{currentSlots}</p>
            <p className="text-slate-400 text-sm">slots available</p>
          </div>

          {/* Remaining Slots */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-3">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Remaining</h3>
            <p className="text-2xl font-bold text-white">{remainingSlots}</p>
            <p className="text-slate-400 text-sm">slots unused</p>
          </div>

          {/* Access Type */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Access Type</h3>
            <p className="text-lg font-semibold text-white">Paid Access</p>
            <p className="text-slate-400 text-sm">Monthly subscription</p>
          </div>
        </div>
      </GlassCard>

      {/* Real-Time Student Statistics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Real-Time Student Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Total Students</h4>
            <p className="text-2xl font-bold text-white">{studentData.totalStudents}</p>
            <p className="text-slate-400 text-sm">enrolled</p>
          </div>

          {/* Active Students */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Active Students</h4>
            <p className="text-2xl font-bold text-white">{studentData.activeStudents}</p>
            <p className="text-slate-400 text-sm">currently active</p>
          </div>

          {/* Students with Courses */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Enrolled</h4>
            <p className="text-2xl font-bold text-white">{studentData.studentsWithCourses}</p>
            <p className="text-slate-400 text-sm">in courses</p>
          </div>

          {/* Average Progress */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Avg Progress</h4>
            <p className="text-2xl font-bold text-white">{studentData.averageProgress}%</p>
            <p className="text-slate-400 text-sm">across all students</p>
          </div>
        </div>
      </GlassCard>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <FluidTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'purchase', label: 'Purchase Slots', icon: <Plus className="h-4 w-4" /> },
            { id: 'access', label: 'Access Info', icon: <Info className="h-4 w-4" /> },
            { id: 'usage', label: 'Usage', icon: <TrendingUp className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-6"
          width="content-match"
        />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => document.getElementById('purchase-tab')?.click()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Purchase More Student Slots
              </Button>
              
              <Button 
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => window.open('/teacher/student-management', '_blank')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Button>

              <Button 
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={fetchStudentData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </GlassCard>

          {/* Current Status */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Platform Access</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <Badge className="bg-green-600/80 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Access Type:</span>
                    <span className="text-white">Paid Access</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payment Model:</span>
                    <span className="text-white">Monthly</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-white">Student Slots</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Slots:</span>
                    <span className="text-white font-semibold">{currentSlots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Remaining:</span>
                    <span className="text-white font-semibold">{remainingSlots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Used:</span>
                    <span className="text-white font-semibold">{currentSlots - remainingSlots}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          </div>
        )}

        {/* Purchase Slots Tab */}
        {activeTab === 'purchase' && (
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
        )}

        {/* Access Info Tab */}
        {activeTab === 'access' && (
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
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced analytics
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
                  <li className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Immediate activation after payment
                  </li>
                </ul>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Usage */}
              <div>
                <h4 className="font-medium text-white mb-3">Student Slot Usage</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Current Students</span>
                    <span className="text-white font-semibold">{studentData.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Student Slots</span>
                    <span className="text-white font-semibold">{currentSlots}</span>
                  </div>
                  <Progress 
                    value={studentData.totalStudents} 
                    className="h-2" 
                    max={currentSlots}
                  />
                  <p className="text-xs text-slate-500">
                    {remainingSlots > 0 ? `You can add ${remainingSlots} more students` : 'All slots used'}
                  </p>
                </div>
              </div>

              {/* Feature Usage */}
              <div>
                <h4 className="font-medium text-white mb-3">Feature Access</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Live Classes</span>
                    <Badge variant="default" className="bg-green-600/80">
                      Available
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Advanced Analytics</span>
                    <Badge variant="default" className="bg-green-600/80">
                      Available
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Priority Support</span>
                    <Badge variant="default" className="bg-green-600/80">
                      Available
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </motion.div>
  )
}
