"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import { teacherSignIn, studentSignIn, createStudentLoginCode } from "@/services/auth/api"
import { http } from "@/services/http"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  User, 
  Lock, 
  GraduationCap, 
  Mail, 
  Key,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [activeTab, setActiveTab] = useState<"teacher" | "student">("teacher")
  
  // Teacher login state
  const [teacherEmail, setTeacherEmail] = useState("")
  const [teacherPassword, setTeacherPassword] = useState("")
  const [showTeacherPassword, setShowTeacherPassword] = useState(false)
  const [teacherLoading, setTeacherLoading] = useState(false)
  
  // Student login state
  const [studentCode, setStudentCode] = useState("")
  const [studentPassword, setStudentPassword] = useState("")
  const [showStudentPassword, setShowStudentPassword] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  
  const { setUser } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeacherLoading(true)

    try {
      const user = await teacherSignIn(teacherEmail, teacherPassword)
      setUser(user)
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
      })
      router.push("/teacher/dashboard")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setTeacherLoading(false)
    }
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStudentLoading(true)

    try {
      const user = await studentSignIn(studentCode, studentPassword)
      setUser(user)
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
      })
      router.push("/student/dashboard")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your student code and password.",
        variant: "destructive",
      })
    } finally {
      setStudentLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "teacher" | "student")} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/10">
        <TabsTrigger value="teacher" className="data-[state=active]:bg-white/20">
          <User className="h-4 w-4 mr-2" />
          Teacher
        </TabsTrigger>
        <TabsTrigger value="student" className="data-[state=active]:bg-white/20">
          <GraduationCap className="h-4 w-4 mr-2" />
          Student
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teacher" className="mt-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Teacher Login
            </CardTitle>
            <CardDescription className="text-slate-300">
              Sign in with your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="teacher-email"
                    type="email"
                    placeholder="Enter your email"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teacher-password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="teacher-password"
                    type={showTeacherPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-white/10"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                  >
                    {showTeacherPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={teacherLoading}>
                {teacherLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link
                    href="/"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Register as Teacher
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="student" className="mt-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Login
            </CardTitle>
            <CardDescription className="text-slate-300">
              Sign in with your student code and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-code" className="text-white">Student Code</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="student-code"
                    type="text"
                    placeholder="Enter your student code (e.g., AB1282501)"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Your student code is provided by your teacher
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="student-password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="student-password"
                    type={showStudentPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-white/10"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                  >
                    {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={studentLoading}>
                {studentLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-sm">
                Students need an invite link from their teacher to register.{' '}
                <span className="text-blue-400">Contact your teacher for an invitation.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
