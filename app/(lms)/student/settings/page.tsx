"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { useAuthStore } from "@/store/auth-store"
import { useSettingsFn } from "@/services/settings/hook"
import { useToast } from "@/hooks/use-toast"
import { Settings, Bell, Eye, Palette, Globe, Save, Loader2, GraduationCap, User, Camera, Edit3, X } from "lucide-react"

export default function StudentSettingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const { settings, loading, error, update } = useSettingsFn(user?.email || "", "student")
  
  const [activeTab, setActiveTab] = useState("profile")
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark')
  
  // Profile state - comprehensive profile data
  const [profile, setProfile] = useState({
    first_name: user?.first_name || user?.name?.split(' ')[0] || '',
    last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
    bio: '',
    avatar_url: '',
    student_code: '',
    grade_level: '',
    interests: '',
    // Personal Information
    date_of_birth: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    // Academic Information
    academic_level: '',
    major: '',
    minor: '',
    graduation_year: '',
    gpa: '',
    academic_interests: '',
    career_goals: '',
    // Additional Information
    timezone: '',
    preferred_language: '',
    accessibility_needs: '',
    dietary_restrictions: ''
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
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

  // Fetch comprehensive profile data
  useEffect(() => {
    if (user?.email) {
      fetchProfileData()
    }
  }, [user?.email])

  const fetchProfileData = async () => {
    try {
      const response = await http<any>(`/api/students/me/profile`)
      if (response) {
        setProfile(prev => ({
          ...prev,
          first_name: response.first_name || prev.first_name,
          last_name: response.last_name || prev.last_name,
          bio: response.bio || prev.bio,
          avatar_url: response.avatar_url || prev.avatar_url,
          student_code: response.student_code || prev.student_code,
          grade_level: response.grade_level || prev.grade_level,
          interests: response.interests || prev.interests,
          // Personal Information
          date_of_birth: response.date_of_birth || prev.date_of_birth,
          phone_number: response.phone_number || prev.phone_number,
          address: response.address || prev.address,
          city: response.city || prev.city,
          state: response.state || prev.state,
          country: response.country || prev.country,
          postal_code: response.postal_code || prev.postal_code,
          // Emergency Contact
          emergency_contact_name: response.emergency_contact_name || prev.emergency_contact_name,
          emergency_contact_phone: response.emergency_contact_phone || prev.emergency_contact_phone,
          emergency_contact_relationship: response.emergency_contact_relationship || prev.emergency_contact_relationship,
          // Academic Information
          academic_level: response.academic_level || prev.academic_level,
          major: response.major || prev.major,
          minor: response.minor || prev.minor,
          graduation_year: response.graduation_year || prev.graduation_year,
          gpa: response.gpa || prev.gpa,
          academic_interests: response.academic_interests || prev.academic_interests,
          career_goals: response.career_goals || prev.career_goals,
          // Additional Information
          timezone: response.timezone || prev.timezone,
          preferred_language: response.preferred_language || prev.preferred_language,
          accessibility_needs: response.accessibility_needs || prev.accessibility_needs,
          dietary_restrictions: response.dietary_restrictions || prev.dietary_restrictions
        }))
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err)
    }
  }

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'dark')
      if ('notifications' in settings) {
        setNotifications(settings.notifications)
      }
      if ('privacy' in settings) {
        setPrivacy(settings.privacy)
      }
      if ('preferences' in settings) {
        setPreferences(settings.preferences)
      }
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
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
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
              id: 'profile', 
              label: 'Profile', 
              icon: <User className="h-4 w-4" />
            },
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="content-match"
        />
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <GlassCard className="p-6">
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
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
                {profile.student_code && (
                  <p className="text-slate-300 text-sm mt-1">Student Code: {profile.student_code}</p>
                )}
                {profile.bio && (
                  <p className="text-slate-300 text-sm mt-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Profile Display */}
            {!isEditingProfile && (
              <div className="space-y-6">
                {/* Basic Information Display */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">First Name</Label>
                      <p className="text-white">{profile.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Last Name</Label>
                      <p className="text-white">{profile.last_name || 'Not provided'}</p>
                    </div>
                  </div>
                  {profile.bio && (
                    <div>
                      <Label className="text-slate-400 text-sm">Bio</Label>
                      <p className="text-white">{profile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Personal Information Display */}
                {(profile.date_of_birth || profile.phone_number || profile.address || profile.city || profile.state || profile.country) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.date_of_birth && (
                        <div>
                          <Label className="text-slate-400 text-sm">Date of Birth</Label>
                          <p className="text-white">{new Date(profile.date_of_birth).toLocaleDateString()}</p>
                        </div>
                      )}
                      {profile.phone_number && (
                        <div>
                          <Label className="text-slate-400 text-sm">Phone Number</Label>
                          <p className="text-white">{profile.phone_number}</p>
                        </div>
                      )}
                    </div>
                    {profile.address && (
                      <div>
                        <Label className="text-slate-400 text-sm">Address</Label>
                        <p className="text-white">{profile.address}</p>
                      </div>
                    )}
                    {(profile.city || profile.state || profile.postal_code) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {profile.city && (
                          <div>
                            <Label className="text-slate-400 text-sm">City</Label>
                            <p className="text-white">{profile.city}</p>
                          </div>
                        )}
                        {profile.state && (
                          <div>
                            <Label className="text-slate-400 text-sm">State/Province</Label>
                            <p className="text-white">{profile.state}</p>
                          </div>
                        )}
                        {profile.postal_code && (
                          <div>
                            <Label className="text-slate-400 text-sm">Postal Code</Label>
                            <p className="text-white">{profile.postal_code}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {profile.country && (
                      <div>
                        <Label className="text-slate-400 text-sm">Country</Label>
                        <p className="text-white">{profile.country}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Emergency Contact Display */}
                {(profile.emergency_contact_name || profile.emergency_contact_phone || profile.emergency_contact_relationship) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.emergency_contact_name && (
                        <div>
                          <Label className="text-slate-400 text-sm">Contact Name</Label>
                          <p className="text-white">{profile.emergency_contact_name}</p>
                        </div>
                      )}
                      {profile.emergency_contact_phone && (
                        <div>
                          <Label className="text-slate-400 text-sm">Contact Phone</Label>
                          <p className="text-white">{profile.emergency_contact_phone}</p>
                        </div>
                      )}
                    </div>
                    {profile.emergency_contact_relationship && (
                      <div>
                        <Label className="text-slate-400 text-sm">Relationship</Label>
                        <p className="text-white">{profile.emergency_contact_relationship}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Academic Information Display */}
                {(profile.academic_level || profile.major || profile.minor || profile.graduation_year || profile.gpa || profile.academic_interests || profile.career_goals) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Academic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.academic_level && (
                        <div>
                          <Label className="text-slate-400 text-sm">Academic Level</Label>
                          <p className="text-white capitalize">{profile.academic_level.replace('_', ' ')}</p>
                        </div>
                      )}
                      {profile.graduation_year && (
                        <div>
                          <Label className="text-slate-400 text-sm">Graduation Year</Label>
                          <p className="text-white">{profile.graduation_year}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.major && (
                        <div>
                          <Label className="text-slate-400 text-sm">Major/Field of Study</Label>
                          <p className="text-white">{profile.major}</p>
                        </div>
                      )}
                      {profile.minor && (
                        <div>
                          <Label className="text-slate-400 text-sm">Minor</Label>
                          <p className="text-white">{profile.minor}</p>
                        </div>
                      )}
                    </div>
                    {profile.gpa && (
                      <div>
                        <Label className="text-slate-400 text-sm">GPA</Label>
                        <p className="text-white">{profile.gpa}</p>
                      </div>
                    )}
                    {profile.academic_interests && (
                      <div>
                        <Label className="text-slate-400 text-sm">Academic Interests</Label>
                        <p className="text-white">{profile.academic_interests}</p>
                      </div>
                    )}
                    {profile.career_goals && (
                      <div>
                        <Label className="text-slate-400 text-sm">Career Goals</Label>
                        <p className="text-white">{profile.career_goals}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Information Display */}
                {(profile.timezone || profile.preferred_language || profile.accessibility_needs || profile.dietary_restrictions) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.timezone && (
                        <div>
                          <Label className="text-slate-400 text-sm">Timezone</Label>
                          <p className="text-white">{profile.timezone}</p>
                        </div>
                      )}
                      {profile.preferred_language && (
                        <div>
                          <Label className="text-slate-400 text-sm">Preferred Language</Label>
                          <p className="text-white">{profile.preferred_language}</p>
                        </div>
                      )}
                    </div>
                    {profile.accessibility_needs && (
                      <div>
                        <Label className="text-slate-400 text-sm">Accessibility Needs</Label>
                        <p className="text-white">{profile.accessibility_needs}</p>
                      </div>
                    )}
                    {profile.dietary_restrictions && (
                      <div>
                        <Label className="text-slate-400 text-sm">Dietary Restrictions</Label>
                        <p className="text-white">{profile.dietary_restrictions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Form */}
            {isEditingProfile && (
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <div>
                    <Label className="text-white font-medium">Bio</Label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-medium">Date of Birth</Label>
                      <Input
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Phone Number</Label>
                      <Input
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Address</Label>
                    <Input
                      value={profile.address}
                      onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white font-medium">City</Label>
                      <Input
                        value={profile.city}
                        onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">State/Province</Label>
                      <Input
                        value={profile.state}
                        onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Postal Code</Label>
                      <Input
                        value={profile.postal_code}
                        onChange={(e) => setProfile(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Country</Label>
                    <Input
                      value={profile.country}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-medium">Contact Name</Label>
                      <Input
                        value={profile.emergency_contact_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Contact Phone</Label>
                      <Input
                        type="tel"
                        value={profile.emergency_contact_phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Relationship</Label>
                    <Input
                      value={profile.emergency_contact_relationship}
                      onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Parent, Guardian, etc."
                    />
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Academic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-medium">Academic Level</Label>
                      <select
                        value={profile.academic_level}
                        onChange={(e) => setProfile(prev => ({ ...prev, academic_level: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                      >
                        <option value="">Select level</option>
                        <option value="high_school">High School</option>
                        <option value="undergraduate">Undergraduate</option>
                        <option value="graduate">Graduate</option>
                        <option value="professional">Professional</option>
                        <option value="other">Other</option>
                      </select>
                  </div>
                    <div>
                      <Label className="text-white font-medium">Graduation Year</Label>
                      <Input
                        type="number"
                        value={profile.graduation_year}
                        onChange={(e) => setProfile(prev => ({ ...prev, graduation_year: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="2024"
                      />
                </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-medium">Major/Field of Study</Label>
                      <Input
                        value={profile.major}
                        onChange={(e) => setProfile(prev => ({ ...prev, major: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Minor</Label>
                      <Input
                        value={profile.minor}
                        onChange={(e) => setProfile(prev => ({ ...prev, minor: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-medium">GPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={profile.gpa}
                      onChange={(e) => setProfile(prev => ({ ...prev, gpa: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="3.5"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Academic Interests</Label>
                    <textarea
                      value={profile.academic_interests}
                      onChange={(e) => setProfile(prev => ({ ...prev, academic_interests: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                      placeholder="What subjects or topics interest you most?"
                    />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Career Goals</Label>
                    <textarea
                      value={profile.career_goals}
                      onChange={(e) => setProfile(prev => ({ ...prev, career_goals: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                      placeholder="What are your career aspirations?"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <Label className="text-white font-medium">Timezone</Label>
                      <Input
                        value={profile.timezone}
                        onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="UTC-5"
                      />
                    </div>
                    <div>
                      <Label className="text-white font-medium">Preferred Language</Label>
                      <Input
                        value={profile.preferred_language}
                        onChange={(e) => setProfile(prev => ({ ...prev, preferred_language: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="English"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-medium">Accessibility Needs</Label>
                    <textarea
                      value={profile.accessibility_needs}
                      onChange={(e) => setProfile(prev => ({ ...prev, accessibility_needs: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-16"
                      placeholder="Any accessibility accommodations you need..."
                    />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Dietary Restrictions</Label>
                    <Input
                      value={profile.dietary_restrictions}
                      onChange={(e) => setProfile(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Vegetarian, allergies, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {isEditingProfile && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    // TODO: Implement profile save functionality
                    setIsEditingProfile(false)
                    toast({ title: "Profile updated successfully" })
                  }}
                  className=""
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Appearance Tab Content */}
      {activeTab === 'appearance' && (
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
      )}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && (
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
      )}

      {/* Privacy Tab Content */}
      {activeTab === 'privacy' && (
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
      )}

      {/* Preferences Tab Content */}
      {activeTab === 'preferences' && (
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
      )}

      {/* Security Tab Content */}
      {activeTab === 'security' && (
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
      )}
    </div>
  )
}

