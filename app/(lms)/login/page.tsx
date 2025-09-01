"use client"

import type * as React from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard } from "@/components/shared/glass-card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <GlassCard className="p-0 overflow-hidden shadow-2xl border border-white/20">
          <CardHeader className="bg-white/5 border-b border-white/10 p-4 sm:p-6">
            <CardTitle className="text-white text-xl sm:text-2xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-300 text-center text-sm sm:text-base">
              Sign in to access your learning management system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <LoginForm />
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
