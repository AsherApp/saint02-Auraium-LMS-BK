import { GlassCard } from "@/components/shared/glass-card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  )
} 