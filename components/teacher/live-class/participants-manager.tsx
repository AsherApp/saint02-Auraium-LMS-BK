import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  UserPlus, 
  Mail, 
  Search,
  Trash2,
  Check,
  X
} from "lucide-react"

interface Participant {
  id: string
  student_email: string
  joined_at: string
  left_at?: string
  is_active: boolean
  students?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ParticipantsManagerProps {
  participants: Participant[]
  onAddParticipant: (email: string) => Promise<void>
  onRemoveParticipant: (id: string) => Promise<void>
  onInviteStudents: (emails: string[]) => Promise<void>
  availableStudents: any[]
  selectedStudents: string[]
  onSelectStudent: (email: string) => void
  onDeselectStudent: (email: string) => void
  studentSearch: string
  onStudentSearchChange: (search: string) => void
}

export function ParticipantsManager({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onInviteStudents,
  availableStudents,
  selectedStudents,
  onSelectStudent,
  onDeselectStudent,
  studentSearch,
  onStudentSearchChange
}: ParticipantsManagerProps) {
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newStudentEmail, setNewStudentEmail] = useState("")

  const handleAddParticipant = async () => {
    if (newStudentEmail.trim()) {
      await onAddParticipant(newStudentEmail.trim())
      setNewStudentEmail("")
      setAddStudentOpen(false)
    }
  }

  const handleInviteStudents = async () => {
    if (selectedStudents.length > 0) {
      await onInviteStudents(selectedStudents)
      setInviteOpen(false)
    }
  }

  const filteredStudents = availableStudents.filter(student =>
    student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const activeParticipants = participants.filter(p => p.is_active)
  const totalParticipants = participants.length

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Participants</h2>
          <Badge 
            variant="outline" 
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            {activeParticipants.length} active
          </Badge>
        </div>
        <div className="flex gap-2">
          <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Add Student to Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentEmail" className="text-white font-medium">Student Email</Label>
                  <Input
                    id="studentEmail"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="Enter student email"
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddStudentOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddParticipant}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add Student
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite Students
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-white/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Invite Students to Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentSearch" className="text-white font-medium">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="studentSearch"
                      value={studentSearch}
                      onChange={(e) => onStudentSearchChange(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:ring-1 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.email}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        selectedStudents.includes(student.email)
                          ? "bg-blue-500/20 border-blue-500/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 text-sm font-medium">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-slate-400">{student.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => 
                          selectedStudents.includes(student.email)
                            ? onDeselectStudent(student.email)
                            : onSelectStudent(student.email)
                        }
                        variant="ghost"
                        size="sm"
                        className={selectedStudents.includes(student.email) 
                          ? "text-green-400 hover:text-green-300" 
                          : "text-slate-400 hover:text-white"
                        }
                      >
                        {selectedStudents.includes(student.email) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                {selectedStudents.length > 0 && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-blue-400 text-sm">
                      {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInviteStudents}
                    disabled={selectedStudents.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Send Invitations ({selectedStudents.length})
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-3">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm">Add students or send invitations to get started</p>
          </div>
        ) : (
          participants.map((participant) => (
            <div 
              key={participant.id} 
              className={`flex items-center justify-between p-4 rounded-lg border ${
                participant.is_active 
                  ? "bg-green-500/10 border-green-500/20" 
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  participant.is_active 
                    ? "bg-green-500/20" 
                    : "bg-slate-500/20"
                }`}>
                  <span className={`text-sm font-medium ${
                    participant.is_active ? "text-green-400" : "text-slate-400"
                  }`}>
                    {participant.students 
                      ? `${participant.students.first_name[0]}${participant.students.last_name[0]}`
                      : participant.student_email[0].toUpperCase()
                    }
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {participant.students 
                      ? `${participant.students.first_name} ${participant.students.last_name}`
                      : participant.student_email
                    }
                  </p>
                  <p className="text-sm text-slate-400">
                    {participant.students ? participant.students.email : participant.student_email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        participant.is_active 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {participant.is_active ? "Active" : "Left"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Joined: {new Date(participant.joined_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onRemoveParticipant(participant.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Total Participants: {totalParticipants}</span>
            <span>Active Now: {activeParticipants.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
