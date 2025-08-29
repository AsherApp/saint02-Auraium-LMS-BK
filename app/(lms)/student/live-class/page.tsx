"use client"

import type React from "react"
import { useMemo } from "react"
import Link from "next/link"

import { useLiveSessionsFn } from "@/services/live/hook"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Radio, DoorOpen, RefreshCw } from "lucide-react"

export default function StudentLiveClassesPage() {
  const { user } = useAuthStore()
  const { sessions, loading, error, refetch } = useLiveSessionsFn(user?.email, user?.role)

  const { live, upcoming, past } = useMemo(() => {
    console.log('Student sessions:', sessions)
    const l = sessions.filter((s) => s.status === "active")
    const u = sessions.filter((s) => s.status === "scheduled").sort((a, b) => a.startAt - b.startAt)
    const p = sessions.filter((s) => s.status === "ended").sort((a, b) => b.startAt - a.startAt)
    console.log('Filtered sessions:', { live: l, upcoming: u, past: p })
    return { live: l, upcoming: u, past: p }
  }, [sessions])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Live Classes</h1>
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl font-semibold">My Live Classes</h1>
        <div className="text-red-300">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">My Live Classes</h1>
        <Button
          onClick={refetch}
          disabled={loading}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20 border-white/20"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Section title="Live Now" icon={<Radio className="h-4 w-4" />}>
        {live.length === 0 ? (
          <Empty text="No live classes right now." />
        ) : (
          live.map((s) => <Row key={s.id} session={s} />)
        )}
      </Section>

      <Section title="Upcoming" icon={<CalendarDays className="h-4 w-4" />}>
        {upcoming.length === 0 ? (
          <Empty text="Nothing scheduled." />
        ) : (
          upcoming.map((s) => <Row key={s.id} session={s} showStart />)
        )}
      </Section>

      <Section title="Past Sessions" icon={<DoorOpen className="h-4 w-4" />}>
        {past.length === 0 ? <Empty text="No past sessions yet." /> : past.map((s) => <Row key={s.id} session={s} />)}
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center gap-2 text-white font-medium">
        <span className="text-blue-300">{icon}</span>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </GlassCard>
  )
}

function Row({ session, showStart = false }: { session: any; showStart?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
      <div>
        <div className="text-white font-medium">{session.title}</div>
        <div className="text-xs text-slate-400">
          Starts {new Date(session.startAt).toLocaleString()} • Host: {session.hostEmail}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showStart && (
          <Badge variant="secondary" className="bg-white/10 text-slate-200 border-white/10">
            {new Date(session.startAt).toLocaleString()}
          </Badge>
        )}
        <Link href={`/live/${session.id}`}>
          <Button className="bg-blue-600/80 hover:bg-blue-600 text-white">
                            {session.status === "active" ? "Join" : "Open"}
          </Button>
        </Link>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="text-slate-300 text-sm">{text}</div>
}
