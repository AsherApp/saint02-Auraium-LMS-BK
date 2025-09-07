import React from "react"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}
