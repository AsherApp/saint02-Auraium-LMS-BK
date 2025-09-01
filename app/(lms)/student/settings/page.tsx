"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { useSettingsFn } from "@/services/settings/hook"
import { useToast } from "@/hooks/use-toast"
import { Settings, Bell, Eye, Palette, Globe, Save, Loader2, GraduationCap } from "lucide-react"

export default function StudentSettingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const { settings, loading, error, update } = useSettingsFn(user?.email || "")
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    assignments: true,
    announcements: true,
    live_class: true
  })
  const [privacy, setPrivacy] = useState({
    profile_visible: true,
    show_email: false,
    show_bio: true
  })
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY'
  })
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme)
      setNotifications(settings.notifications)
      setPrivacy(settings.privacy)
      setPreferences(settings.preferences)
    }
  }, [settings])

  async function saveSettings() {
    if (!user?.email) {
      toast({ title: "Error", description: "No user found", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await update({
        theme,
        notifications,
        privacy,
        preferences
      })
      toast({ title: "Settings saved successfully" })
    } catch (error: any) {
      toast({ 
        title: "Failed to save settings", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (!user?.email) {
      toast({ title: "Error", description: "No user found", variant: "destructive" })
      return
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords don't match", variant: "destructive" })
      return
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" })
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('/api/auth/student/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      toast({ title: "Password changed successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({ 
        title: "Failed to change password", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
        <GlassCard className="p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            <span className="ml-2 text-slate-300">Loading settings...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
        <GlassCard className="p-5">
          <div className="text-red-300">Error loading settings: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">Settings</h1>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-blue-600/80 hover:bg-blue-600 text-white"
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

      {/* Student Settings Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'appearance', 
              label: 'Appearance', 
              icon: <Palette className="h-4 w-4" />
            },
            { 
              id: 'notifications', 
              label: 'Notifications', 
              icon: <Bell className="h-4 w-4" />
            },
            { 
              id: 'privacy', 
              label: 'Privacy', 
              icon: <Eye className="h-4 w-4" />
            },
            { 
              id: 'preferences', 
              label: 'Preferences', 
              icon: <Globe className="h-4 w-4" />
            },
            { 
              id: 'security', 
              label: 'Security', 
              icon: <GraduationCap className="h-4 w-4" />
            }
          ]}
          activeTab="appearance"
          onTabChange={() => {}}
          variant="default"
          width="content-match"
        />
      </div>

      <Tabs defaultValue="appearance" className="w-full">

        <TabsContent value="appearance" className="mt-6">
          <GlassCard className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'auto') => setTheme(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 text-white border-white/10">
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-slate-400">
                Choose your preferred theme. Auto will follow your system settings.
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <GlassCard className="p-5 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <div className="text-xs text-slate-400">Receive notifications via email</div>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <div className="text-xs text-slate-400">Receive browser push notifications</div>
                </div>
                <Switch 
                  checked={notifications.push} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Assignment Notifications</Label>
                  <div className="text-xs text-slate-400">Get notified about new assignments and due dates</div>
                </div>
                <Switch 
                  checked={notifications.assignments} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, assignments: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Announcement Notifications</Label>
                  <div className="text-xs text-slate-400">Get notified about course announcements</div>
                </div>
                <Switch 
                  checked={notifications.announcements} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, announcements: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Live Class Notifications</Label>
                  <div className="text-xs text-slate-400">Get notified about live class events</div>
                </div>
                <Switch 
                  checked={notifications.live_class} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, live_class: checked }))}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <GlassCard className="p-5 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <div className="text-xs text-slate-400">Allow teachers to see your profile</div>
                </div>
                <Switch 
                  checked={privacy.profile_visible} 
                  onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, profile_visible: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Email</Label>
                  <div className="text-xs text-slate-400">Display your email to teachers</div>
                </div>
                <Switch 
                  checked={privacy.show_email} 
                  onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_email: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Bio</Label>
                  <div className="text-xs text-slate-400">Display your bio to teachers</div>
                </div>
                <Switch 
                  checked={privacy.show_bio} 
                  onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_bio: checked }))}
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <GlassCard className="p-5 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select value={preferences.date_format} onValueChange={(value) => setPreferences(prev => ({ ...prev, date_format: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 text-white border-white/10">
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <GlassCard className="p-5 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter your new password"
                />
                <div className="text-xs text-slate-400">
                  Password must be at least 6 characters long
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Confirm your new password"
                />
              </div>
              
              <Button 
                onClick={changePassword} 
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-red-600/80 hover:bg-red-600 text-white"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

