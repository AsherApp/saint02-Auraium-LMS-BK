"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/shared/navbar"
import { Toaster } from "@/components/ui/toaster"

export default function LmsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900 relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <main className="relative w-full">{children}</main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-slate-900 to-blue-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b border-white/10 px-3 sm:px-4 md:px-6 glass-top">
          <Navbar />
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative w-full">
          <div className="container-responsive py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
