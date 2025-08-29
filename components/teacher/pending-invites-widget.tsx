"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { deleteInvite } from "@/services/invites/api"
import { 
  Mail, 
  Clock, 
  UserX, 
  Trash2, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users
} from "lucide-react"

interface PendingInvite {
  code: string
  email: string
  name: string
  role: string
  course_id: string
  used: boolean
  created_at: string
  expires_at: string
  created_by: string
  courses: {
    title: string
    description: string
  }
}

interface PendingInvitesWidgetProps {
  courseId?: string
  title?: string
  showCourseInfo?: boolean
}

export function PendingInvitesWidget({ 
  courseId, 
  title = "Pending Invites", 
  showCourseInfo = false 
}: PendingInvitesWidgetProps) {
  const { toast } = useToast()
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inviteToDelete, setInviteToDelete] = useState<PendingInvite | null>(null)

  const fetchInvites = async () => {
    setLoading(true)
    try {
      const response = await http<{ items: PendingInvite[]; total: number }>(
        `/api/invites${courseId ? `?course_id=${courseId}` : ''}`
      )
      // Filter out used invites to show only pending ones
      setInvites(response.items.filter(invite => !invite.used))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch invites",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvites()
  }, [courseId])

  const handleDeleteInvite = async (invite: PendingInvite) => {
    setInviteToDelete(invite)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!inviteToDelete) return

    try {
      await deleteInvite(inviteToDelete.code)
      toast({
        title: "Success",
        description: "Invite deleted successfully"
      })
      fetchInvites() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invite",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setInviteToDelete(null)
    }
  }

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(inviteUrl)
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard"
    })
  }

  const getStatusBadge = (invite: PendingInvite) => {
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 1) {
      return <Badge variant="destructive">Expires Soon</Badge>
    } else if (daysLeft <= 3) {
      return <Badge variant="secondary">Expires in {daysLeft} days</Badge>
    } else {
      return <Badge variant="default">Active</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Loading invites...</span>
        </div>
      </GlassCard>
    )
  }

  if (invites.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="text-center text-muted-foreground">
          <Mail className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No pending invites</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="outline">{invites.length}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {invites.map((invite) => (
            <div key={invite.code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {invite.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{invite.name}</span>
                    {getStatusBadge(invite)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{invite.email}</span>
                    </div>
                    
                    {showCourseInfo && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{invite.courses.title}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Invited: {formatDate(invite.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Expires: {formatDate(invite.expires_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteLink(invite.code)}
                  title="Copy invite link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteInvite(invite)}
                  title="Delete invite"
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invite</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The student will no longer be able to use this invite link.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the invite for{" "}
              <strong>{inviteToDelete?.name}</strong> ({inviteToDelete?.email})?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The student will no longer be able to use this invite link.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
