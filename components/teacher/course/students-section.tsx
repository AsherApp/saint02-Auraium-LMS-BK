"use client"

import React, { useState } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Trash2, Mail } from "lucide-react"
import { useInvitesFn } from "@/services/invites/hook"

interface StudentsSectionProps {
  courseId: string
}

export function StudentsSection({ courseId }: StudentsSectionProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteType, setInviteType] = useState("student")
  const { toast } = useToast()
  
  const { invites, loading, createInvite, deleteInvite } = useInvitesFn(courseId)

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    try {
      await createInvite({
        course_id: courseId,
        email: inviteEmail,
        type: inviteType,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      
      setInviteEmail("")
      setInviteType("student")
      setShowInviteModal(false)
      
      toast({
        title: "Success",
        description: "Invite sent successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive"
      })
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await deleteInvite(inviteId)
      toast({
        title: "Success",
        description: "Invite deleted successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invite",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          Course Students
        </h2>
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Student
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Invite Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-slate-300">Student Type</Label>
                <Select value={inviteType} onValueChange={setInviteType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Regular Student</SelectItem>
                    <SelectItem value="public_student">Public Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} className="bg-blue-600 hover:bg-blue-700">
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {invites.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No students invited yet</p>
            <p className="text-sm text-slate-500">Invite students to join your course</p>
          </div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{invite.email}</h3>
                  <p className="text-sm text-slate-400">
                    {invite.type === 'public_student' ? 'Public Student' : 'Regular Student'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteInvite(invite.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}
