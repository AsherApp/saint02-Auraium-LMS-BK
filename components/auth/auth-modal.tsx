"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuthFn } from "@/services/auth/hook"
import { cn } from "@/lib/utils"
import { GraduationCap, User, ArrowRight, Loader2 } from "lucide-react"
import { BillingSignupFlow } from "./billing-signup-flow"
import { ForgotPasswordModal } from "./forgot-password-modal"

type Props = {
  label?: string
  className?: string
  asPlainButton?: boolean
}

export function AuthModal({ label = "Login", className, asPlainButton = false }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [role, setRole] = useState<"teacher" | "student">("teacher")
  
  // Check if we should open in signup mode based on URL hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#register') {
      setMode('signup')
      setOpen(true)
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])
  const router = useRouter()
  const { toast } = useToast()
  const { signInTeacher, signInStudent, registerTeacher, loading, error } = useAuthFn()

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [name, setName] = useState("") // Keep for backward compatibility
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [showBillingFlow, setShowBillingFlow] = useState(false)
  const [registeredTeacher, setRegisteredTeacher] = useState<{ name: string; email: string } | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)


  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setStudentCode("")
  }

  const handleModeSwitch = (newMode: "login" | "signup") => {
    setMode(newMode)
    resetForm()
  }

  const handleRoleSwitch = (newRole: "teacher" | "student") => {
    setRole(newRole)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (mode === "signup" && password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }

    try {
      if (mode === "login") {
        if (role === "teacher") {
          if (!email || !password) {
            throw new Error("Please provide your email and password")
          }
          const user = await signInTeacher(email, password)
          toast({ title: "Welcome back!", description: `Signed in as ${user.role}.` })
          router.push("/teacher/dashboard")
        } else {
          // Simple student login with student code and password
          if (!studentCode || !password) {
            throw new Error("Please provide your student code and password")
          }
          const user = await signInStudent(studentCode, password)
          toast({ title: "Welcome back!", description: `Signed in as ${user.role}.` })
          router.push("/student/dashboard")
        }
      } else {
        // Signup mode
        if (role === "teacher") {
          if (!firstName || !lastName || !email || !password) {
            throw new Error("Please fill in all required fields")
          }
          const user = await registerTeacher({ first_name: firstName, last_name: lastName, email, password })
          
          // Store teacher info and show billing flow
          setRegisteredTeacher({ name: `${firstName} ${lastName}`, email: user.email || email })
          setShowBillingFlow(true)
          
          // Don't close modal yet - let billing flow handle it
        } else {
          // Students should register via invite links only
          toast({ 
            title: "Student Registration", 
            description: "Students can only register through invite links provided by their teachers. Please contact your teacher for an invitation.", 
            variant: "destructive" 
          })
        }
      }
      
      if (mode === "login") {
        setOpen(false)
        resetForm()
      }
    } catch (err: any) {
      toast({
        title: mode === "login" ? "Sign-in failed" : "Registration failed",
        description: err?.message || "Please check your credentials.",
        variant: "destructive",
      })
    }
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("AuthModal trigger clicked, current open state:", open)
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        className={cn(
          asPlainButton 
            ? "inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur px-6 text-white hover:bg-white/20 transition-all duration-200"
            : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 h-10 px-4 py-2 bg-white/10 text-white hover:bg-white/20",
          className
        )}
        onClick={handleTriggerClick}
        aria-label="Open authentication"
      >
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-white/10 backdrop-blur border-white/20 text-white p-0 overflow-hidden">
        <div className="relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
            <DialogHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <DialogTitle className="text-xl font-semibold">
                {mode === "login" ? "Welcome Back" : "Join AuraiumLMS"}
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                {mode === "login" 
                  ? "Sign in to continue your learning journey" 
                  : "Create your account to start teaching or learning"
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Mode Toggle */}
          <div className="p-6 pb-4">
            <div className="flex bg-white/5 rounded-lg p-1 mb-6">
              <button
                onClick={() => handleModeSwitch("login")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                  mode === "login" 
                    ? "bg-blue-600/80 text-white shadow-sm" 
                    : "text-slate-300 hover:text-white"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => handleModeSwitch("signup")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                  mode === "signup" 
                    ? "bg-blue-600/80 text-white shadow-sm" 
                    : "text-slate-300 hover:text-white"
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Role Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 mb-6">
              <button
                onClick={() => handleRoleSwitch("teacher")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                  role === "teacher" 
                    ? "bg-blue-600/80 text-white shadow-sm" 
                    : "text-slate-300 hover:text-white"
                )}
              >
                <User className="h-4 w-4" />
                Teacher
              </button>
              <button
                onClick={() => handleRoleSwitch("student")}
                disabled={mode === "signup"}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                  role === "student" 
                    ? "bg-blue-600/80 text-white shadow-sm" 
                    : mode === "signup" 
                      ? "text-slate-500 cursor-not-allowed opacity-50" 
                      : "text-slate-300 hover:text-white"
                )}
                title={mode === "signup" ? "Students can only register via invite links" : ""}
              >
                <GraduationCap className="h-4 w-4" />
                Student
              </button>
            </div>
            
            {mode === "signup" && (
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <GraduationCap className="h-4 w-4" />
                  <span>Students can only register through invite links provided by their teachers.</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && role === "teacher" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required={mode === "signup"}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={mode === "signup"}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {mode === "signup" && role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "signup"}
                    disabled={loading}
                  />
                </div>
              )}

              {role === "teacher" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {role === "teacher" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={mode === "signup"}
                        disabled={loading}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {mode === "login" ? (
                    // Simple Student Login - Just Student Code + Password
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="student-code">Student Code</Label>
                        <Input
                          id="student-code"
                          type="text"
                          placeholder="e.g., NT25081701"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                          value={studentCode}
                          onChange={(e) => setStudentCode(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-password">Password</Label>
                        <Input
                          id="student-password"
                          type="password"
                          placeholder="••••••••"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </>
                  ) : (
                    // Student Signup - Not allowed
                    <div className="space-y-2">
                      <Label htmlFor="student-code">Student Code</Label>
                      <Input
                        id="student-code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        required={role === "student"}
                        disabled={loading}
                        maxLength={6}
                      />
                      <p className="text-xs text-slate-400">
                        Get this code from your teacher
                      </p>
                    </div>
                  )}
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>


            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 text-center">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => handleModeSwitch(mode === "login" ? "signup" : "login")}
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
              
              {/* Forgot Password Link - Only show in login mode */}
              {mode === "login" && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-slate-400 hover:text-blue-400 underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </DialogContent>

      {/* Billing Signup Flow */}
      {showBillingFlow && registeredTeacher && (
        <BillingSignupFlow
          isOpen={showBillingFlow}
          onClose={() => {
            setShowBillingFlow(false)
            setRegisteredTeacher(null)
            setOpen(false)
            resetForm()
          }}
          teacherEmail={registeredTeacher.email}
          teacherName={registeredTeacher.name}
        />
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType={role}
      />
    </Dialog>
  )
} 