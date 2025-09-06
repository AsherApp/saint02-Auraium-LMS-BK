import { GlassCard } from "@/components/shared/glass-card"
import { BookOpen, ListChecks, Users, Video, FolderOpenDot, Mail, MessageSquare, BarChart3, Calendar, Shield, Zap, Target } from "lucide-react"

const items = [
  {
    icon: BookOpen,
    title: "Interactive Courses",
    desc: "Create engaging courses with multimedia content, quizzes, and interactive elements.",
    color: "from-blue-500 to-cyan-500",
    glow: "group-hover:shadow-blue-500/25",
  },
  {
    icon: Video,
    title: "Live Classes",
    desc: "Host real-time video sessions with screen sharing and interactive whiteboards.",
    color: "from-purple-500 to-pink-500",
    glow: "group-hover:shadow-purple-500/25",
  },
  {
    icon: ListChecks,
    title: "Smart Assignments",
    desc: "Create, submit, and auto-grade assignments with detailed feedback.",
    color: "from-green-500 to-emerald-500",
    glow: "group-hover:shadow-green-500/25",
  },
  {
    icon: Users,
    title: "Student Management",
    desc: "Invite students with magic links and manage enrollments securely.",
    color: "from-orange-500 to-red-500",
    glow: "group-hover:shadow-orange-500/25",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "Monitor student progress with detailed analytics and performance insights.",
    color: "from-indigo-500 to-blue-500",
    glow: "group-hover:shadow-indigo-500/25",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    desc: "Foster collaboration with live chat, discussions, and announcements.",
    color: "from-teal-500 to-cyan-500",
    glow: "group-hover:shadow-teal-500/25",
  },
  {
    icon: Calendar,
    title: "Event Scheduling",
    desc: "Schedule office hours, study groups, and important deadlines.",
    color: "from-pink-500 to-rose-500",
    glow: "group-hover:shadow-pink-500/25",
  },
  {
    icon: Shield,
    title: "Secure Access",
    desc: "Role-based permissions and secure authentication for all users.",
    color: "from-slate-500 to-gray-500",
    glow: "group-hover:shadow-slate-500/25",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    desc: "Keep everyone updated with real-time notifications and alerts.",
    color: "from-yellow-500 to-orange-500",
    glow: "group-hover:shadow-yellow-500/25",
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Everything you need for
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> modern education</span>
        </h2>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Powerful features designed to enhance teaching and learning experiences
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f, index) => (
          <div
            key={f.title}
            className={`group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${f.glow} hover:shadow-2xl`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500 blur-xl`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${f.color} shadow-lg group-hover:shadow-xl transition-all duration-300 mb-6`}>
                <f.icon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-white font-bold text-xl mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent">
                {f.title}
              </h3>
              
              <p className="text-slate-300 text-base leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                {f.desc}
              </p>
            </div>

            {/* Hover Border Effect */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 cursor-pointer">
          <Target className="h-5 w-5" />
          <span>Ready to transform your teaching experience?</span>
        </div>
      </div>
    </section>
  )
}
