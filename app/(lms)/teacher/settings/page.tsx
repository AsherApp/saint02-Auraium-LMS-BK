"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useSettingsFn } from "@/services/settings/hook"
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Mail, 
  Globe, 
  Monitor, 
  User, 
  BookOpen, 
  Award, 
  Video, 
  Shield, 
  CreditCard, 
  Download,
  Upload,
  Palette,
  Clock,
  Calendar,
  Users,
  FileText,
  Zap,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  BarChart3
} from "lucide-react"
import { BillingSection } from "@/components/teacher/billing-section"
import { BillingDashboard } from "@/components/teacher/billing-dashboard"
import { TransactionsSection } from "@/components/teacher/transactions-section"

export default function TeacherSettings() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { settings, loading, error, update } = useSettingsFn(user?.id || "", "teacher")
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Settings state - structured to match backend
  const [localSettings, setLocalSettings] = useState({
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      assignments: true,
      announcements: true,
      live_class: true,
      student_questions: true,
      course_announcements: true,
      live_session_reminders: true
    },
    privacy: {
      profile_visibility: 'public',
      show_email_to_students: false,
      allow_student_messages: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY'
    },
    course_settings: {
      default_course_duration: 60,
      auto_publish_courses: false,
      allow_student_discussions: true
    },
    grading_settings: {
      default_grading_scale: 'percentage',
      allow_late_submissions: true,
      late_submission_penalty: 10,
      auto_grade_quizzes: true
    },
    live_class_settings: {
      default_session_duration: 60,
      allow_recording: true,
      require_approval_to_join: false,
      max_participants: 50
    },
    advanced_settings: {
      data_export_enabled: true,
      analytics_tracking: true,
      beta_features: false
    }
  })

  const [profile, setProfile] = useState({
    first_name: user?.name?.split(' ')[0] || '',
    last_name: user?.name?.split(' ').slice(1).join(' ') || '',
    bio: '',
    avatar_url: '',
    website: '',
    location: '',
    expertise: '',
    education: '',
    experience: ''
  })

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Update local settings when settings load from API
  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({
        ...prev,
        theme: settings.theme || prev.theme,
        notifications: { ...prev.notifications, ...settings.notifications },
        privacy: { ...prev.privacy, ...settings.privacy },
        preferences: { ...prev.preferences, ...settings.preferences },
        course_settings: { ...prev.course_settings, ...(settings as any).course_settings },
        grading_settings: { ...prev.grading_settings, ...(settings as any).grading_settings },
        live_class_settings: { ...prev.live_class_settings, ...(settings as any).live_class_settings },
        advanced_settings: { ...prev.advanced_settings, ...(settings as any).advanced_settings }
      }))
    }
  }, [settings])

  const saveSettings = async () => {
    if (!user?.email) return
    
    setSaving(true)
    try {
      await update(localSettings as any)
      toast({ title: "Settings saved successfully!" })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({ 
        title: "Failed to save settings", 
        description: error.message || "Please try again.",
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-300">
            Manage your account preferences and application settings.
          </p>
        </div>
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/10">
          <p className="text-red-400">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
          >
            Retry
          </Button>
        </GlassCard>
      )}

      {/* Teacher Settings Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
            { id: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
            { id: 'transactions', label: 'Transactions', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'appearance', label: 'Appearance', icon: <Monitor className="h-4 w-4" /> },
            { id: 'courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" /> },
            { id: 'grading', label: 'Grading', icon: <Award className="h-4 w-4" /> },
            { id: 'live-classes', label: 'Live Classes', icon: <Video className="h-4 w-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
            { id: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
            { id: 'advanced', label: 'Advanced', icon: <Zap className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="compact"
          width="full"
        />
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  <p className="text-slate-400 text-sm">Manage your personal information and profile settings</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  {isEditingProfile ? <X className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </div>
                  {isEditingProfile && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      variant="default"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-lg">
                    {profile.first_name} {profile.last_name}
                  </h4>
                  <p className="text-slate-400">{user?.email}</p>
                  {profile.bio && (
                    <p className="text-slate-300 text-sm mt-2">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              {isEditingProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white font-medium">First Name</Label>
                      <Input
                        value={profile.first_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Last Name</Label>
                      <Input
                        value={profile.last_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Bio</Label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-24"
                        placeholder="Tell students about yourself..."
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white font-medium">Website</Label>
                      <Input
                        value={profile.website}
                        onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Location</Label>
                      <Input
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Expertise</Label>
                      <Input
                        value={profile.expertise}
                        onChange={(e) => setProfile(prev => ({ ...prev, expertise: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Mathematics, Computer Science"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Security */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-white font-medium mb-4">Account Security</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Password</Label>
                      <p className="text-slate-400 text-sm">Last changed: 30 days ago</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordDialog(true)}
                      className="bg-white/10 text-white hover:bg-white/20"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Billing Tab Content */}
      {activeTab === 'billing' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Billing & Subscription</h3>
              <p className="text-slate-400 text-sm">Manage your billing information and subscription plan</p>
            </div>
            <BillingDashboard />
          </div>
        </GlassCard>
      )}

      {/* Transactions Tab Content */}
      {activeTab === 'transactions' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Transaction History</h3>
              <p className="text-slate-400 text-sm">View your payment history and transaction details</p>
            </div>
            <TransactionsSection />
          </div>
        </GlassCard>
      )}

      {/* Appearance Tab Content */}
      {activeTab === 'appearance' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Appearance Settings</h3>
              <p className="text-slate-400 text-sm">Customize how the application looks and feels</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Theme</Label>
                  <p className="text-slate-400 text-sm">Choose your preferred theme</p>
                </div>
                <Select value={localSettings.theme} onValueChange={(value) => setLocalSettings(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Language</Label>
                  <p className="text-slate-400 text-sm">Choose your preferred language</p>
                </div>
                <Select value={localSettings.preferences.language} onValueChange={(value) => setLocalSettings(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, language: value }
                }))}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Timezone</Label>
                  <p className="text-slate-400 text-sm">Set your local timezone</p>
                </div>
                <Select value={localSettings.preferences.timezone} onValueChange={(value) => setLocalSettings(prev => ({ 
                  ...prev, 
                  preferences: { ...prev.preferences, timezone: value }
                }))}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Course Settings</h3>
              <p className="text-slate-400 text-sm">Configure default settings for new courses</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Default Course Duration (minutes)</Label>
                  <p className="text-slate-400 text-sm">Default duration for new courses</p>
                </div>
                <Input
                  type="number"
                  value={(localSettings as any).default_course_duration}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, default_course_duration: parseInt(e.target.value) || 60 }))}
                  className="w-32 bg-white/5 border-white/10 text-white"
                  min="15"
                  max="180"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Auto-publish Courses</Label>
                  <p className="text-slate-400 text-sm">Automatically publish courses when created</p>
                </div>
                <Switch 
                  checked={(localSettings as any).auto_publish_courses}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_publish_courses: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Allow Student Discussions</Label>
                  <p className="text-slate-400 text-sm">Enable discussion forums in courses</p>
                </div>
                <Switch 
                  checked={(localSettings as any).allow_student_discussions}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, allow_student_discussions: checked }))}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Grading Tab Content */}
      {activeTab === 'grading' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Grading Preferences</h3>
              <p className="text-slate-400 text-sm">Configure how assignments are graded and managed</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Default Grading Scale</Label>
                  <p className="text-slate-400 text-sm">Choose your preferred grading system</p>
                </div>
                <Select value={(localSettings as any).default_grading_scale} onValueChange={(value) => setLocalSettings(prev => ({ ...prev, default_grading_scale: value }))}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (0-100%)</SelectItem>
                    <SelectItem value="letter">Letter Grades (A-F)</SelectItem>
                    <SelectItem value="points">Points-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Allow Late Submissions</Label>
                  <p className="text-slate-400 text-sm">Allow students to submit assignments after due date</p>
                </div>
                <Switch 
                  checked={(localSettings as any).allow_late_submissions}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, allow_late_submissions: checked }))}
                />
              </div>

              {(localSettings as any).allow_late_submissions && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white font-medium">Late Submission Penalty (%)</Label>
                    <p className="text-slate-400 text-sm">Percentage penalty for late submissions</p>
                  </div>
                  <Input
                    type="number"
                    value={(localSettings as any).late_submission_penalty}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, late_submission_penalty: parseInt(e.target.value) || 0 }))}
                    className="w-32 bg-white/5 border-white/10 text-white"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Auto-grade Quizzes</Label>
                  <p className="text-slate-400 text-sm">Automatically grade multiple choice quizzes</p>
                </div>
                <Switch 
                  checked={(localSettings as any).auto_grade_quizzes}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_grade_quizzes: checked }))}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Live Classes Tab Content */}
      {activeTab === 'live-classes' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Live Class Settings</h3>
              <p className="text-slate-400 text-sm">Configure settings for live class sessions</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Default Session Duration (minutes)</Label>
                  <p className="text-slate-400 text-sm">Default duration for new live sessions</p>
                </div>
                <Input
                  type="number"
                  value={(localSettings as any).default_session_duration}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, default_session_duration: parseInt(e.target.value) || 60 }))}
                  className="w-32 bg-white/5 border-white/10 text-white"
                  min="15"
                  max="180"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Allow Recording</Label>
                  <p className="text-slate-400 text-sm">Allow recording of live class sessions</p>
                </div>
                <Switch 
                  checked={(localSettings as any).allow_recording}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, allow_recording: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Require Approval to Join</Label>
                  <p className="text-slate-400 text-sm">Students must be approved before joining live sessions</p>
                </div>
                <Switch 
                  checked={(localSettings as any).require_approval_to_join}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, require_approval_to_join: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Maximum Participants</Label>
                  <p className="text-slate-400 text-sm">Maximum number of students per live session</p>
                </div>
                <Input
                  type="number"
                  value={(localSettings as any).max_participants}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 50 }))}
                  className="w-32 bg-white/5 border-white/10 text-white"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
              <p className="text-slate-400 text-sm">Choose what notifications you want to receive</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Push Notifications</Label>
                  <p className="text-slate-400 text-sm">Receive notifications in your browser</p>
                </div>
                <Switch 
                  checked={localSettings.notifications.push}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, push: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Email Notifications</Label>
                  <p className="text-slate-400 text-sm">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={localSettings.notifications.email}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, email: checked }
                  }))}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-medium mb-3">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Assignment Submissions</Label>
                      <p className="text-slate-400 text-sm">When students submit assignments</p>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.assignments}
                      onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, assignments: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Student Questions</Label>
                      <p className="text-slate-400 text-sm">When students ask questions</p>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.student_questions}
                      onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, student_questions: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Course Announcements</Label>
                      <p className="text-slate-400 text-sm">Important course announcements</p>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.course_announcements}
                      onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, course_announcements: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Live Session Reminders</Label>
                      <p className="text-slate-400 text-sm">Reminders for upcoming live sessions</p>
                    </div>
                    <Switch 
                      checked={localSettings.notifications.live_session_reminders}
                      onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, live_session_reminders: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Privacy Tab Content */}
      {activeTab === 'privacy' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
              <p className="text-slate-400 text-sm">Control your privacy and security settings</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Profile Visibility</Label>
                  <p className="text-slate-400 text-sm">Who can see your profile information</p>
                </div>
                <Select value={localSettings.privacy.profile_visibility} onValueChange={(value) => setLocalSettings(prev => ({ 
                  ...prev, 
                  privacy: { ...prev.privacy, profile_visibility: value }
                }))}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (All students)</SelectItem>
                    <SelectItem value="enrolled">Enrolled Students Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Show Email to Students</Label>
                  <p className="text-slate-400 text-sm">Allow students to see your email address</p>
                </div>
                <Switch 
                  checked={localSettings.privacy.show_email_to_students}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    privacy: { ...prev.privacy, show_email_to_students: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Allow Student Messages</Label>
                  <p className="text-slate-400 text-sm">Allow students to send you direct messages</p>
                </div>
                <Switch 
                  checked={localSettings.privacy.allow_student_messages}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    privacy: { ...prev.privacy, allow_student_messages: checked }
                  }))}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Advanced Tab Content */}
      {activeTab === 'advanced' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>
              <p className="text-slate-400 text-sm">Advanced configuration options</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Data Export</Label>
                  <p className="text-slate-400 text-sm">Allow export of your course data</p>
                </div>
                <Switch 
                  checked={localSettings.advanced_settings.data_export_enabled}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    advanced_settings: { ...prev.advanced_settings, data_export_enabled: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Analytics Tracking</Label>
                  <p className="text-slate-400 text-sm">Help improve the platform with usage analytics</p>
                </div>
                <Switch 
                  checked={localSettings.advanced_settings.analytics_tracking}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    advanced_settings: { ...prev.advanced_settings, analytics_tracking: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Beta Features</Label>
                  <p className="text-slate-400 text-sm">Enable experimental features</p>
                </div>
                <Switch 
                  checked={localSettings.advanced_settings.beta_features}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    advanced_settings: { ...prev.advanced_settings, beta_features: checked }
                  }))}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-white font-medium mb-3">Data Management</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="bg-red-600/20 text-red-400 hover:bg-red-600/30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Change Password</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Current Password</Label>
              <Input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">New Password</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter new password"
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowPasswordDialog(false)}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Handle password change logic here
                  toast({ title: "Password changed successfully" })
                  setShowPasswordDialog(false)
                  setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
                }}
                disabled={!passwordData.current_password || !passwordData.new_password || passwordData.new_password !== passwordData.confirm_password}
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

