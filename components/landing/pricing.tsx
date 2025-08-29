import { Check, Star, Zap, Users, BookOpen, Video, FileText, Award, Shield, Clock } from "lucide-react"
import { AuthModal } from "@/components/auth/auth-modal"
import { GlassCard } from "@/components/shared/glass-card"

const plans = [
  {
    name: "Pro",
    price: "£50",
    period: "per month",
    description: "Everything you need for professional teaching",
    features: [
      "Up to 50 students",
      "Unlimited courses & modules",
      "Live video classes",
      "Interactive whiteboard",
      "Advanced assignments",
      "Real-time chat",
      "Progress tracking",
      "Priority support",
      "File uploads (100MB)",
      "Advanced analytics",
      "Student management",
      "Event scheduling"
    ],
    limitations: [],
    popular: true,
    color: "from-blue-500 to-purple-500",
    glow: "group-hover:shadow-blue-500/25"
  }
]

const featureIcons = {
  "Up to 50 students": Users,
  "Unlimited courses & modules": BookOpen,
  "File uploads (100MB)": FileText,
  "Live video classes": Video,
  "Interactive whiteboard": Zap,
  "Advanced assignments": FileText,
  "Real-time chat": Users,
  "Progress tracking": Award,
  "Priority support": Shield,
  "Advanced analytics": Award,
  "Student management": Users,
  "Event scheduling": Clock
}

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Simple, transparent
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> pricing</span>
        </h2>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Start with a 7-day free trial, then £50/month for unlimited access. No hidden fees, cancel anytime.
        </p>
      </div>

      {/* Trial Banner */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full">
          <Star className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-medium">7-Day Free Trial Available</span>
          <span className="text-green-400 text-sm">• No credit card required</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className="group relative md:scale-105"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  Most Popular
                </div>
              </div>

              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

              <GlassCard className={`relative p-8 h-full border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-blue-500/50 bg-white/10 shadow-xl hover:shadow-2xl backdrop-blur-sm`}>
                
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-300 text-lg">/{plan.period}</span>
                  </div>
                  <p className="text-slate-300 text-sm">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-white font-semibold text-lg mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => {
                      const Icon = featureIcons[feature as keyof typeof featureIcons] || Check
                      return (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                          <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <AuthModal 
                    label="Start Pro Trial" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105" 
                  />
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <div className="inline-flex items-center gap-2 text-slate-300 text-sm">
          <Shield className="w-4 h-4" />
          <span>All plans include secure hosting, backups, and 99.9% uptime guarantee</span>
        </div>
      </div>
    </section>
  )
}
