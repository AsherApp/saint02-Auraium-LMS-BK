"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { Loader2, Mail, Key, CheckCircle } from "lucide-react"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userType: "teacher" | "student"
}

export function ForgotPasswordModal({ isOpen, onClose, userType }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userType === "teacher" && !email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" })
      return
    }
    
    if (userType === "student" && !studentCode) {
      toast({ title: "Student code required", description: "Please enter your student code.", variant: "destructive" })
      return
    }

    setLoading(true)
    
    try {
      const endpoint = userType === "teacher" ? "/api/password-reset/request" : "/api/password-reset/request-student"
      const body = userType === "teacher" ? { email } : { student_code: studentCode }
      
      const response = await http(endpoint, {
        method: "POST",
        body
      })
      
      setSuccess(true)
      toast({ 
        title: "Reset link sent", 
        description: response.message || "If an account exists, a password reset link has been sent.",
        duration: 5000
      })
      
      // In development, show the reset URL
      if (response.resetUrl) {
        console.log("Password reset URL:", response.resetUrl)
        toast({ 
          title: "Development Mode", 
          description: `Reset URL: ${response.resetUrl}`,
          duration: 10000
        })
      }
      
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send reset link. Please try again.",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setStudentCode("")
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-white/10 backdrop-blur border-white/20 text-white p-0 overflow-hidden">
        <div className="relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
            <DialogHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  {userType === "teacher" ? <Mail className="h-6 w-6 text-white" /> : <Key className="h-6 w-6 text-white" />}
                </div>
              </div>
              <DialogTitle className="text-xl font-semibold">
                Reset Your Password
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                {userType === "teacher" 
                  ? "Enter your email address and we'll send you a password reset link"
                  : "Enter your student code and we'll send you a password reset link"
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <h3 className="text-lg font-semibold text-white">Check Your {userType === "teacher" ? "Email" : "Messages"}</h3>
                <p className="text-slate-300">
                  {userType === "teacher" 
                    ? "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."
                    : "We've sent a password reset link to your registered email. Please check your messages and follow the instructions."
                  }
                </p>
                <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {userType === "teacher" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
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
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="student-code">Student Code</Label>
                    <Input
                      id="student-code"
                      type="text"
                      placeholder="e.g., NT25081701"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500/50 transition-colors h-11"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-200 flex items-center justify-center gap-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
