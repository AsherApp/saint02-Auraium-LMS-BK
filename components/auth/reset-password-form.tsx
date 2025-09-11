"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/shared/glass-card"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"

export function ResetPasswordForm() {
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      verifyToken(tokenParam)
    } else {
      setError("No reset token provided")
      setVerifying(false)
    }
  }, [searchParams])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await http(`/api/password-reset/verify/${tokenToVerify}`)
      setEmail(response.email || "")
      setStudentCode(response.student_code || "")
      setVerified(true)
    } catch (error: any) {
      setError(error.message || "Invalid or expired reset token")
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast({ title: "All fields required", description: "Please fill in all fields.", variant: "destructive" })
      return
    }
    
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters long.", variant: "destructive" })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" })
      return
    }

    setLoading(true)
    
    try {
      await http("/api/password-reset/reset", {
        method: "POST",
        body: {
          token,
          newPassword
        }
      })
      
      setSuccess(true)
      toast({ 
        title: "Password reset successful", 
        description: "Your password has been updated. You can now sign in with your new password.",
        duration: 5000
      })
      
    } catch (error: any) {
      toast({ 
        title: "Reset failed", 
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push("/login")
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Verifying Reset Token</h2>
          <p className="text-slate-300">Please wait while we verify your reset link...</p>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <Button onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassCard className="p-8 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Password Reset Successful</h2>
          <p className="text-slate-300 mb-6">Your password has been updated successfully. You can now sign in with your new password.</p>
          <Button onClick={handleGoToLogin} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <GlassCard className="p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
            <p className="text-slate-300">
              {studentCode ? `Student Code: ${studentCode}` : `Email: ${email}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-white/10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-white/10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Remember your password?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
