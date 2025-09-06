"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"

import { useLiveSessionsFn } from "@/services/live/hook"
import { useAuthStore } from "@/store/auth-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FluidTabs } from "@/components/ui/fluid-tabs"
import { CalendarDays, Radio, DoorOpen, RefreshCw, Clock3, Zap, History } from "lucide-react"
import { dateUtils } from "@/utils/date-utils"

export default function StudentLiveClassesPage() {
  const { user } = useAuthStore()
  const { sessions, loading, error, refetch } = useLiveSessionsFn(user?.email, user?.role)
  
  // Tab state
  const [activeTab, setActiveTab] = useState("upcoming")

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

      {/* Live Session Navigation */}
      <div className="w-full flex justify-center py-4">
        <FluidTabs
          tabs={[
            { 
              id: 'upcoming', 
              label: 'Upcoming', 
              icon: <Clock3 className="h-4 w-4" />, 
              badge: upcoming.length 
            },
            { 
              id: 'active', 
              label: 'Live Now', 
              icon: <Zap className="h-4 w-4" />, 
              badge: live.length 
            },
            { 
              id: 'past', 
              label: 'Past', 
              icon: <History className="h-4 w-4" />, 
              badge: past.length 
            }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="default"
          width="wide"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Upcoming Sessions Tab */}
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcoming.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Clock3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Sessions</h3>
              <p className="text-slate-400 mb-4">
                You don't have any scheduled live classes coming up.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {upcoming.map((session) => (
                <SessionCard key={session.id} session={session} showStart />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="active" className="space-y-4 mt-6">
          {live.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Live Classes</h3>
              <p className="text-slate-400 mb-4">
                There are no live classes happening right now.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {live.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Past Sessions Tab */}
        <TabsContent value="past" className="space-y-4 mt-6">
          {past.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Past Sessions</h3>
              <p className="text-slate-400 mb-4">
                You haven't attended any live classes yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {past.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Session card component
function SessionCard({ session, showStart = false }: { session: any; showStart?: boolean }) {
  const getStatusBadge = (status: string, isStarted?: boolean) => {
    if (status === 'active' && isStarted) {
      return <Badge className="bg-red-600/80 text-white border-red-500">🔴 Live Now</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600/80 text-white border-green-500">Live Now</Badge>
      case 'scheduled':
        return <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-200 border-yellow-400">Scheduled</Badge>
      case 'ended':
        return <Badge variant="outline" className="bg-slate-600/20 text-slate-300 border-slate-500">Ended</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-600/20 text-slate-300 border-slate-500">{status}</Badge>
    }
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">
              {session.title}
            </h3>
            {getStatusBadge(session.status, session.isStarted)}
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
              {session.sessionType || 'General'}
            </Badge>
          </div>
          <p className="text-slate-400 mb-3">{session.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {dateUtils.short(session.startAt)}
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              {dateUtils.time(session.startAt)}
            </div>
            <div className="flex items-center gap-1">
              <Radio className="h-4 w-4" />
              Host: {session.hostEmail}
            </div>
          </div>
          {(session.courseTitle || session.moduleTitle) && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {session.courseTitle && (
                <span>Course: {session.courseTitle}</span>
              )}
              {session.moduleTitle && (
                <>
                  <span>•</span>
                  <span>Module: {session.moduleTitle}</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* View Class Button - Always available */}
          <Link href={`/student/live-session/${session.id}`}>
            <Button 
              variant="outline"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              View Class
            </Button>
          </Link>
          
          {/* Join Live Button - Only for active sessions */}
          {session.status === 'active' && (
            <Link href={`/live/${session.id}`}>
              <Button 
                className="bg-green-600/80 hover:bg-green-600 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Join Live
              </Button>
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
