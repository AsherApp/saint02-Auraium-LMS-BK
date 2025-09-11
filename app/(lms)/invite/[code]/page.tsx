"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"
import { validateStudentCode } from "@/utils/student-code"
import { useAuthStore } from "@/store/auth-store"
import { studentSignIn } from "@/services/auth/api"
import { User, Lock, Mail, CheckCircle, AlertCircle } from "lucide-react"

interface InviteData {
  code: string
  email: string
  name: string
  role: string
  course_id?: string
  course_title?: string
  course_description?: string
  teacher_email: string
  teacher_name: string
  student_email: string
  student_name: string
  created_by: string
  expires_at: string
  used: boolean
  created_at: string
}

export default function InvitePage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { setUser } = useAuthStore()
  
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Comprehensive profile data
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    academicLevel: "",
    major: "",
    minor: "",
    graduationYear: "",
    gpa: "",
    academicInterests: "",
    careerGoals: "",
    bio: "",
    timezone: "",
    preferredLanguage: "",
    accessibilityNeeds: "",
    dietaryRestrictions: ""
  })
  
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [studentData, setStudentData] = useState<any>(null)

  // Fetch invite data
  useEffect(() => {
    const fetchInvite = async () => {
      if (!params.code) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await http<any>(`/api/invites/${params.code}`)
        setInvite(response)
        
        // Pre-fill form with student's data from invite
        if (response.student_name) {
          const nameParts = response.student_name.split(' ')
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(' ') || "",
            email: response.student_email || ""
          }))
        }
      } catch (err: any) {
        setError(err.message || "Invalid or expired invite code")
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvite()
  }, [params.code])

  const handleRegistration = async () => {
    if (!invite) return
    
    // Validate only basic required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Error", description: "First and last name are required", variant: "destructive" })
      return
    }
    
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" })
      return
    }
    
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    
    setRegistrationLoading(true)
    
    try {
      const response = await http(`/api/auth/student/register`, {
        method: 'POST',
        body: {
          invite_code: invite.code,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          // Send all profile data (optional fields)
          date_of_birth: formData.dateOfBirth || null,
          phone_number: formData.phoneNumber || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          postal_code: formData.postalCode || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          emergency_contact_relationship: formData.emergencyContactRelationship || null,
          academic_level: formData.academicLevel || null,
          major: formData.major || null,
          minor: formData.minor || null,
          graduation_year: formData.graduationYear || null,
          gpa: formData.gpa || null,
          academic_interests: formData.academicInterests || null,
          career_goals: formData.careerGoals || null,
          bio: formData.bio || null,
          timezone: formData.timezone || null,
          preferred_language: formData.preferredLanguage || null,
          accessibility_needs: formData.accessibilityNeeds || null,
          dietary_restrictions: formData.dietaryRestrictions || null
        }
      })
      
      // Store student data and token for auto-login
      setStudentData(response.student)
      
      // If we have a token, auto-login the student
      if (response.token && response.user) {
        // Store the auth token and user data
        localStorage.setItem('auth-token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Update auth store
        setUser(response.user)
        
        toast({
          title: "Welcome!",
          description: `Successfully registered and logged in as ${response.user.name}`,
        })
        
        setShowRegistration(false)
        router.push('/student/dashboard')
      } else {
        // Fallback to welcome modal if no token
      setShowRegistration(false)
      setShowWelcome(true)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create account", variant: "destructive" })
    } finally {
      setRegistrationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <GlassCard className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-slate-300">Loading invite...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <GlassCard className="p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Invalid Invite</h2>
            <p className="text-slate-300">{error}</p>
            <Button onClick={() => router.push('/login')} className="bg-blue-600/80 hover:bg-blue-600">
              Go to Login
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <GlassCard className="p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Invite Not Found</h2>
            <p className="text-slate-300">This invite link is invalid or has expired.</p>
            <Button onClick={() => router.push('/login')} className="bg-blue-600/80 hover:bg-blue-600">
              Go to Login
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (invite.used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <GlassCard className="p-8">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Invite Already Used</h2>
            <p className="text-slate-300">This invite has already been used to create an account.</p>
            <Button onClick={() => router.push('/login')} className="bg-blue-600/80 hover:bg-blue-600">
              Go to Login
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <GlassCard className="p-8 max-w-md w-full">
                  <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Welcome!</h1>
              <p className="text-slate-300">
                You've been invited by <span className="text-blue-400 font-medium">{invite.teacher_name}</span>
              </p>
            </div>

            {invite.course_title && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-1">Course: {invite.course_title}</h3>
                {invite.course_description && (
                  <p className="text-slate-300 text-sm">{invite.course_description}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="text-left space-y-2">
                <Label className="text-slate-300">Student Name</Label>
                <div className="text-white font-medium">{invite.student_name}</div>
              </div>
              
              <div className="text-left space-y-2">
                <Label className="text-slate-300">Email</Label>
                <div className="text-white font-medium">{invite.student_email}</div>
              </div>
            </div>

          <div className="space-y-4">
            <Button 
              onClick={() => setShowRegistration(true)}
              className="w-full bg-blue-600/80 hover:bg-blue-600"
            >
              <User className="mr-2 h-4 w-4" />
              Create Account
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => router.push('/login')}
              className="w-full bg-white/10 text-white hover:bg-white/20"
            >
              Already have an account? Login
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Registration Modal */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Your Account</DialogTitle>
            <DialogDescription>
              Please fill in your details to create your student account. Only basic fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                    required
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                    required
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                  required
              />
            </div>
            
              <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="At least 6 characters"
                    required
              />
            </div>
            <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Parent, Guardian, etc."
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Academic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicLevel">Academic Level</Label>
                  <select
                    id="academicLevel"
                    value={formData.academicLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicLevel: e.target.value }))}
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
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="2024"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major/Field of Study</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minor">Minor</Label>
                  <Input
                    id="minor"
                    value={formData.minor}
                    onChange={(e) => setFormData(prev => ({ ...prev, minor: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="3.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicInterests">Academic Interests</Label>
                <textarea
                  id="academicInterests"
                  value={formData.academicInterests}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicInterests: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                  placeholder="What subjects or topics interest you most?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="careerGoals">Career Goals</Label>
                <textarea
                  id="careerGoals"
                  value={formData.careerGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                  placeholder="What are your career aspirations?"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-20"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="UTC-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">Preferred Language</Label>
                  <Input
                    id="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="English"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
                <textarea
                  id="accessibilityNeeds"
                  value={formData.accessibilityNeeds}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessibilityNeeds: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-md p-3 min-h-16"
                  placeholder="Any accessibility accommodations you need..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Input
                  id="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Vegetarian, allergies, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-white/20">
              <Button 
                variant="secondary" 
                onClick={() => setShowRegistration(false)}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRegistration}
                disabled={registrationLoading}
                className="bg-blue-600/80 hover:bg-blue-600"
              >
                {registrationLoading ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Welcome to Your Learning Journey! 🎉</DialogTitle>
            <DialogDescription className="text-center text-slate-300">
              Your account has been created successfully. Here are your login details:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Student Code Section */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="text-center space-y-2">
                <h3 className="text-white font-semibold">Your Student Code</h3>
                <div className="text-2xl font-mono font-bold text-blue-300 bg-blue-500/10 px-4 py-2 rounded border border-blue-500/20">
                  {studentData?.student_code}
                </div>
                <p className="text-xs text-blue-200">
                  ⚠️ Please note your student code - this is what you'll use to login along with your password
                </p>
              </div>
            </div>

            {/* Student Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Name:</span>
                <span className="text-white font-medium">{studentData?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Email:</span>
                <span className="text-white font-medium">{studentData?.email}</span>
              </div>
            </div>

            {/* Login Instructions */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <h4 className="text-green-300 font-medium mb-2">How to Login:</h4>
              <ul className="text-sm text-green-200 space-y-1">
                <li>• Go to the login page</li>
                <li>• Use your <strong>Student Code</strong> (not email)</li>
                <li>• Enter your password</li>
                <li>• You'll be redirected to your dashboard</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                onClick={async () => {
                  try {
                    // Auto-login the student
                    const user = await studentSignIn(studentData.student_code, formData.password)
                    setUser(user)
                    
                    toast({
                      title: "Welcome!",
                      description: `Successfully logged in as ${user.name}`,
                    })
                    
                    setShowWelcome(false)
                    router.push('/student/dashboard')
                  } catch (error: any) {
                    toast({
                      title: "Login Error",
                      description: "Please go to login page and sign in manually",
                      variant: "destructive"
                    })
                    setShowWelcome(false)
                    router.push('/login')
                  }
                }}
                className="bg-blue-600/80 hover:bg-blue-600"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
