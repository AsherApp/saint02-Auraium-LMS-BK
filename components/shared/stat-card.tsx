import { GlassCard } from "./glass-card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  className?: string
}

const iconColorClasses = {
  blue: 'bg-blue-600/20 text-blue-300 shadow-lg shadow-blue-500/25',
  green: 'bg-green-600/20 text-green-300 shadow-lg shadow-green-500/25', 
  purple: 'bg-purple-600/20 text-purple-300 shadow-lg shadow-purple-500/25',
  orange: 'bg-orange-600/20 text-orange-300 shadow-lg shadow-orange-500/25',
  red: 'bg-red-600/20 text-red-300 shadow-lg shadow-red-500/25'
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconColor = 'blue',
  className 
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <GlassCard className={cn(
        "p-4 cursor-pointer transition-all duration-300",
        "hover:shadow-2xl hover:shadow-blue-500/20 hover:bg-white/15",
        "border border-white/20 hover:border-white/40",
        "backdrop-blur-md",
        className
      )}>
        <div className="flex items-center gap-3">
          <motion.div 
            className={cn(
              "p-3 rounded-xl transition-all duration-300",
              "group-hover:scale-110 group-hover:shadow-lg",
              iconColorClasses[iconColor]
            )}
            whileHover={{ 
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.6, ease: "easeInOut" }
            }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <div className="flex-1">
            <motion.div 
              className="text-white font-bold text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {value}
            </motion.div>
            <motion.div 
              className="text-slate-400 text-sm font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.div>
          </div>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </GlassCard>
    </motion.div>
  )
}

// Quick Action Card Component
interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  href: string
  className?: string
}

export function QuickActionCard({
  title,
  description, 
  icon: Icon,
  iconColor = 'blue',
  href,
  className
}: QuickActionCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.03,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.97 }}
      className="group"
    >
      <a href={href} className="block">
        <GlassCard className={cn(
          "p-5 transition-all duration-300 cursor-pointer",
          "hover:shadow-xl hover:shadow-purple-500/20 hover:bg-white/15",
          "border border-white/20 hover:border-white/40",
          "backdrop-blur-md",
          className
        )}>
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "p-3 rounded-xl transition-all duration-300",
                "group-hover:scale-110 group-hover:shadow-lg",
                iconColorClasses[iconColor]
              )}
              whileHover={{ 
                rotate: [0, -15, 15, 0],
                transition: { duration: 0.8, ease: "easeInOut" }
              }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div className="flex-1">
              <motion.div 
                className="text-white font-semibold text-lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.div>
              <motion.div 
                className="text-slate-300 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {description}
              </motion.div>
            </div>
            
            {/* Arrow indicator */}
            <motion.div
              className="text-slate-400 group-hover:text-white transition-colors duration-300"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ x: 5 }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </GlassCard>
      </a>
    </motion.div>
  )
}
