"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import { useProfileFn } from "@/services/profile/hook"
import { useToast } from "@/hooks/use-toast"
import { User, Save, Loader2, GraduationCap } from "lucide-react"

export default function StudentProfilePage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const { profile, loading, error, update } = useProfileFn(user?.email || "")
  
  // Also fetch student data from students table
  const [studentData, setStudentData] = useState<any>(null)
  const [studentLoading, setStudentLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)

  // Fetch student data from students table
  useEffect(() => {
    if (!user?.email) return
    
    setStudentLoading(true)
    const fetchStudentData = async () => {
      try {
        const response = await fetch(`/api/profiles/email/${user.email}`)
        if (response.ok) {
          const data = await response.json()
          setStudentData(data)
          // Use student data as primary source
          setName(data.name || "")
          setAvatarUrl(data.avatar_url || "")
          setBio(data.bio || "")
        }
      } catch (err) {
        console.error('Failed to fetch student data:', err)
      } finally {
        setStudentLoading(false)
      }
    }
    
    fetchStudentData()
  }, [user?.email])

  // Update form when profile loads (fallback)
  useEffect(() => {
    if (profile && !studentData) {
      setName(profile.name || "")
      setAvatarUrl(profile.avatar_url || "")
      setBio(profile.bio || "")
    }
  }, [profile, studentData])

  async function save() {
    if (!user?.id) {
      toast({ title: "Error", description: "No user found", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      await update({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
      })
      toast({ title: "Profile saved successfully" })
    } catch (error: any) {
      toast({ 
        title: "Failed to save profile", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || studentLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-white text-2xl font-semibold">My Profile</h1>
        <GlassCard className="p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            <span className="ml-2 text-slate-300">Loading profile...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-white text-2xl font-semibold">My Profile</h1>
        <GlassCard className="p-5">
          <div className="text-red-300">Error loading profile: {error}</div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-white text-2xl font-semibold">My Profile</h1>
      
      <GlassCard className="p-5 space-y-4">
        {/* Avatar Preview */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || undefined} alt={name || user?.email} />
            <AvatarFallback className="bg-green-600/20 text-green-300">
              {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || <GraduationCap className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-white font-medium">{name || "No name set"}</div>
            <div className="text-slate-400 text-sm">{user?.email}</div>
            <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input 
              id="name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-white/5 border-white/10 text-white" 
              placeholder="Enter your display name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL (optional)</Label>
            <Input
              id="avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="text-xs text-slate-400">
              Enter a URL to an image for your profile picture
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-24 rounded-md border bg-white/5 border-white/10 text-white p-3 resize-none"
              placeholder="Tell us about yourself, your interests, what you're studying..."
            />
            <div className="text-xs text-slate-400">
              Brief bio that will be visible to teachers
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={save} 
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
                Save Profile
              </>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

