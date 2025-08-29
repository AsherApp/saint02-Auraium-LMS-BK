import Link from "next/link"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { BookOpen, GraduationCap, Users, Video, FileText, Award } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 -z-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-blue-950/10"></div>
      </div>

      {/* Animated Background Bubbles - More Transparent */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-1500"></div>
      </div>

      {/* Floating Animation Bubbles - More Transparent */}
      <div className="absolute inset-0 -z-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-300/15 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-purple-300/10 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-cyan-300/20 rounded-full animate-bounce delay-1500"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Main Hero Content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white animate-fade-in">
              Auraium
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                LMS
              </span>
            </h1>
            <p className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in-delay">
              Transform education with our modern learning platform. 
              <span className="text-blue-300 font-semibold"> Teachers</span> create engaging courses, 
              <span className="text-purple-300 font-semibold"> Students</span> learn at their own pace.
            </p>
          </div>

          {/* Floating Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay-2">
            <AuthModal 
              label="Get Started" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1" 
            />
            <AuthModal 
              label="Sign In" 
              asPlainButton 
              className="px-8 py-4 text-lg border-2 border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/40 rounded-xl shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 backdrop-blur-sm" 
            />
          </div>

          {/* Teacher and Student Cartoons */}
          <div className="relative mt-16 animate-fade-in-delay-3">
            <div className="flex justify-center items-center gap-8 md:gap-16">
              {/* Teacher Cartoon */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-2">
                  <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-white font-medium text-sm">Teacher</span>
                </div>
                {/* Floating elements around teacher */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/60 rounded-full flex items-center justify-center animate-bounce">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400/60 rounded-full flex items-center justify-center animate-bounce delay-500">
                  <FileText className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Connection Line */}
              <div className="hidden md:block w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>

              {/* Student Cartoon */}
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-300 transform group-hover:scale-110 group-hover:-translate-y-2">
                  <Users className="w-16 h-16 md:w-20 md:h-20 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-white font-medium text-sm">Student</span>
                </div>
                {/* Floating elements around student */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-cyan-400/60 rounded-full flex items-center justify-center animate-bounce delay-1000">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-orange-400/60 rounded-full flex items-center justify-center animate-bounce delay-1500">
                  <Award className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in-delay-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-blue-300" />
              </div>
              <p className="text-white font-medium text-sm">Interactive Courses</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <Video className="w-6 h-6 text-purple-300" />
              </div>
              <p className="text-white font-medium text-sm">Live Classes</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-cyan-300" />
              </div>
              <p className="text-white font-medium text-sm">Smart Assignments</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-pink-300" />
              </div>
              <p className="text-white font-medium text-sm">Progress Tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
    </section>
  )
}
