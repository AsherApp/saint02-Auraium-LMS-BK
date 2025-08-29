"use client"

import { useState, useEffect } from "react"
import { useAuthStore, UserRole } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, GraduationCap, Save, Loader2 } from "lucide-react"

export default function TeacherProfile() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile state
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    role: "teacher" as UserRole,
    bio: "",
    avatar_url: "",
    subscription_status: "free",
    max_students_allowed: 5
  })

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      // Use user email for profile lookup
      const response = await fetch(`/api/profiles/email/${user.email}`)
      if (response.ok) {
        const data = await response.json()
        setProfile({
          id: data.id || user.id,
          name: data.name || user.name || user.email?.split('@')[0] || 'User',
          email: data.email || user.email || '',
          role: data.role || user.role,
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          subscription_status: data.subscription_status || 'free',
          max_students_allowed: data.max_students_allowed || 5
        })
      } else if (response.status === 404) {
        // User not found, create a default profile
        setProfile({
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: user.role,
          bio: '',
          avatar_url: '',
          subscription_status: 'free',
          max_students_allowed: 5
        })
      } else {
        throw new Error('Failed to load profile')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user?.email) return
    
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/profiles/email/${user.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      if (response.ok) {
        toast({ title: "Profile updated successfully!" })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile')
      toast({ 
        title: "Failed to update profile", 
        description: "Please try again.",
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-300">
            Manage your personal information and account details.
          </p>
        </div>
        <Button 
          onClick={saveProfile}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Profile Form */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                {profile.name?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
              <p className="text-slate-400 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Teacher
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                  placeholder="your@email.com"
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white font-medium">Bio</Label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-slate-400 focus:border-blue-500/50 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Account Information */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Role</p>
              <p className="text-white font-medium">Teacher</p>
            </div>
            <GraduationCap className="h-5 w-5 text-blue-400" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Account Status</p>
              <p className="text-green-400 font-medium">Active</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Member Since</p>
              <p className="text-white font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

