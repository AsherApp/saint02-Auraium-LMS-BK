import React from "react"
import { UserDisplay } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"

interface StudentItemProps {
  email: string
  name: string
  state: "active" | "inactive" | "pending"
}

export function StudentItem({ email, name, state }: StudentItemProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "inactive":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-3">
        <UserDisplay email={email} name={name} />
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-sm text-slate-400">{email}</p>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={`${getStateColor(state)} border`}
      >
        {state}
      </Badge>
    </div>
  )
}
