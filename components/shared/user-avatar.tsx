"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserInitials, getAvatarProps, type UserDisplayInfo } from "@/utils/user-display"

interface UserAvatarProps {
  user: UserDisplayInfo
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showTooltip?: boolean
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm", 
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg"
}

export function UserAvatar({ user, size = "md", className = "", showTooltip = false }: UserAvatarProps) {
  const avatarProps = getAvatarProps(user)
  const initials = getUserInitials(user)
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={avatarProps.src} 
        alt={avatarProps.alt}
        className="object-cover"
        onError={(e) => {
          // Hide the image if it fails to load, showing fallback instead
          e.currentTarget.style.display = 'none'
        }}
      />
      <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 border border-white/10">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

interface UserDisplayProps {
  user: UserDisplayInfo
  showAvatar?: boolean
  showSecondary?: boolean
  avatarSize?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function UserDisplay({ 
  user, 
  showAvatar = true, 
  showSecondary = true, 
  avatarSize = "md",
  className = ""
}: UserDisplayProps) {
  const displayName = user.name || user.studentCode || (user.email ? user.email.split('@')[0] : 'User')
  const secondaryText = showSecondary ? (user.studentCode ? `ID: ${user.studentCode}` : user.email) : ''
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAvatar && <UserAvatar user={user} size={avatarSize} />}
      <div className="flex flex-col">
        <div className="text-white font-medium text-sm">{displayName}</div>
        {secondaryText && (
          <div className="text-slate-400 text-xs">{secondaryText}</div>
        )}
      </div>
    </div>
  )
}
