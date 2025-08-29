"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { AuthModal } from "@/components/auth/auth-modal"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { NotificationSystem } from "@/components/shared/notification-system"

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-semibold text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          AuraiumLMS
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <NotificationSystem />
            <Link href={`/${user.role}/profile`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${user.role}/settings`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 text-sm font-medium">{user.name || user.email}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-slate-300 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <AuthModal label="Get Started" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium" />
        )}
      </div>
    </div>
  )
}
