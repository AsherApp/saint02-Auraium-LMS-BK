"use client"

import type * as React from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlassCard } from "@/components/shared/glass-card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <GlassCard className="p-0 overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-slate-300">
              Sign in to access your learning management system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <LoginForm />
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
