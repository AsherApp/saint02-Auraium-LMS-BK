"use client"

import { useEffect, useMemo, useState } from "react"
import { useLiveClassStore } from "@/store/live-class-store"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { ChatWidget } from "./chat-widget"
import { ParticipantsList } from "./participants-list"
import { ResourceList } from "./resource-list"
import { PollWidget } from "./poll-widget"
import { AttendanceWidget } from "./attendance-widget"
import { ArrowLeft, Plus, StickyNote, ListChecks, Target, Loader2, Users, Power } from "lucide-react"
import Link from "next/link"
import { useLiveActivitiesFn } from "@/services/live-activities/hook"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LiveRoom({ sessionId, currentUserEmail }: { sessionId: string; currentUserEmail: string }) {
  const session = useLiveClassStore((s) => s.getById(sessionId))
  const join = useLiveClassStore((s) => s.join)
  const leave = useLiveClassStore((s) => s.leave)
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const isHost = useMemo(() => session?.hostEmail?.toLowerCase() === currentUserEmail.toLowerCase(), [session, currentUserEmail])

  // Use the new live activities hook
  const {
    notes,
    quizzes,
    polls,
    classwork,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuizAnswer,
    createPoll,
    updatePoll,
    deletePoll,
    submitPollResponse,
    createClasswork,
    updateClasswork,
    deleteClasswork,
    submitClasswork
  } = useLiveActivitiesFn(sessionId)

  const [createNoteOpen, setCreateNoteOpen] = useState(false)
  const [createQuizOpen, setCreateQuizOpen] = useState(false)
  const [createPollOpen, setCreatePollOpen] = useState(false)
  const [createClassworkOpen, setCreateClassworkOpen] = useState(false)
  
  const [newNote, setNewNote] = useState({ title: "", content: "", is_shared: false })
  const [newQuiz, setNewQuiz] = useState({ title: "", questions: [{ type: "multiple_choice", question: "", options: ["", ""] }] })
  const [newPoll, setNewPoll] = useState({ question: "", options: ["", ""] })
  const [newClasswork, setNewClasswork] = useState({ title: "", description: "" })
  const [endingSession, setEndingSession] = useState(false)

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this live session? This action cannot be undone.')) {
      return
    }
    
    setEndingSession(true)
    try {
      const { http } = await import('@/services/http')
      await http(`/api/live/${sessionId}/end`, { method: 'POST' })
      toast({ 
        title: "Session ended", 
        description: "The live session has been ended successfully." 
      })
      // Redirect to session details page
      window.location.href = `/teacher/live-class/${sessionId}`
    } catch (err: any) {
      toast({ 
        title: "Failed to end session", 
        description: err.message || "An error occurred while ending the session",
        variant: "destructive" 
      })
    } finally {
      setEndingSession(false)
    }
  }

  useEffect(() => {
    if (session) join(session.id, currentUserEmail)
    return () => {
      if (session) leave(session.id, currentUserEmail)
    }
  }, [session, currentUserEmail, join, leave])

  async function handleCreateNote() {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" })
      return
    }

    try {
      await createNote({
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        created_by: currentUserEmail,
        is_shared: isHost ? newNote.is_shared : false // Students can only create private notes
      })
      
      setNewNote({ title: "", content: "", is_shared: false })
      setCreateNoteOpen(false)
      toast({ title: "Note created successfully" })
    } catch (error: any) {
      toast({ title: "Failed to create note", description: error.message, variant: "destructive" })
    }
  }

  async function handleCreateQuiz() {
    if (!newQuiz.title.trim() || !newQuiz.questions[0].question.trim()) {
      toast({ title: "Error", description: "Title and at least one question are required", variant: "destructive" })
      return
    }

    try {
      await createQuiz({
        title: newQuiz.title.trim(),
        questions: newQuiz.questions.map((q, i) => ({
          id: `q${i}`,
          type: q.type as any,
          question: q.question.trim(),
          options: q.options.filter(opt => opt.trim()),
          correct_answer: q.options[0] // Default to first option
        })),
        created_by: currentUserEmail,
        is_active: true
      })
      
      setNewQuiz({ title: "", questions: [{ type: "multiple_choice", question: "", options: ["", ""] }] })
      setCreateQuizOpen(false)
      toast({ title: "Quiz created successfully" })
    } catch (error: any) {
      toast({ title: "Failed to create quiz", description: error.message, variant: "destructive" })
    }
  }

  async function handleCreatePoll() {
    if (!newPoll.question.trim() || newPoll.options.filter(opt => opt.trim()).length < 2) {
      toast({ title: "Error", description: "Question and at least 2 options are required", variant: "destructive" })
      return
    }

    try {
      await createPoll({
        question: newPoll.question.trim(),
        options: newPoll.options.filter(opt => opt.trim()),
        created_by: currentUserEmail,
        is_active: true
      })
      
      setNewPoll({ question: "", options: ["", ""] })
      setCreatePollOpen(false)
      toast({ title: "Poll created successfully" })
    } catch (error: any) {
      toast({ title: "Failed to create poll", description: error.message, variant: "destructive" })
    }
  }

  async function handleCreateClasswork() {
    if (!newClasswork.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" })
      return
    }

    try {
      await createClasswork({
        title: newClasswork.title.trim(),
        description: newClasswork.description.trim(),
        created_by: currentUserEmail,
        is_active: true
      })
      
      setNewClasswork({ title: "", description: "" })
      setCreateClassworkOpen(false)
      toast({ title: "Classwork created successfully" })
    } catch (error: any) {
      toast({ title: "Failed to create classwork", description: error.message, variant: "destructive" })
    }
  }

  if (!session) {
    return (
      <GlassCard className="p-6">
        <div className="text-white">Session not found.</div>
      </GlassCard>
    )
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          <span className="ml-2 text-slate-300">Loading live activities...</span>
        </div>
      </GlassCard>
    )
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-red-300">Error loading live activities: {error}</div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white text-xl font-semibold">{session.title}</div>
          <div className="text-slate-300 text-sm">Host: {session.hostEmail}</div>
        </div>
        <div className="flex gap-2">
          <Link href="/student/live-class">
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          
          {/* End session button for teachers */}
          {isHost && (
            <Button 
              onClick={handleEndSession}
              disabled={endingSession}
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {endingSession ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Ending...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-1" />
                  End Session
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-3 lg:col-span-2">
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-4">📚</div>
            <p>Live Class Tools</p>
            <p className="text-sm mt-2">Use the tabs below to access polls, classwork, and attendance</p>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-3">
            <ParticipantsList sessionId={session.id} />
          </GlassCard>
          <GlassCard className="p-3">
            <ResourceList sessionId={session.id} myEmail={currentUserEmail} canUpload={isHost} />
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-3 lg:col-span-2">
          <ChatWidget sessionId={session.id} />
        </GlassCard>
        
        <div className="space-y-4">
        <GlassCard className="p-3">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/10 border-white/20">
                <TabsTrigger value="notes" className="text-white data-[state=active]:bg-blue-600/80">
                  <StickyNote className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="text-white data-[state=active]:bg-blue-600/80">
                  <ListChecks className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="polls" className="text-white data-[state=active]:bg-blue-600/80">
                  <Target className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="classwork" className="text-white data-[state=active]:bg-blue-600/80">
                  <Target className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="attendance" className="text-white data-[state=active]:bg-blue-600/80">
                  <Users className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-300">Live Notes</div>
                    <Dialog open={createNoteOpen} onOpenChange={setCreateNoteOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600/80 hover:bg-blue-600 text-white">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                        <DialogHeader>
                          <DialogTitle>Create Live Note</DialogTitle>
                          <DialogDescription>
                            {isHost 
                              ? "Create a note that can be shared with the class during the live session."
                              : "Take notes during the live session for your personal reference."
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={newNote.title}
                              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                              className="bg-white/5 border-white/10 text-white"
                              placeholder="Note title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <textarea
                              value={newNote.content}
                              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                              className="w-full min-h-24 rounded-md border bg-white/5 border-white/10 text-white p-2"
                              placeholder="Note content..."
                            />
                          </div>
                          {isHost && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="shared"
                                checked={newNote.is_shared}
                                onChange={(e) => setNewNote(prev => ({ ...prev, is_shared: e.target.checked }))}
                                className="rounded border-white/20"
                              />
                              <Label htmlFor="shared" className="text-sm">Share with class</Label>
                            </div>
                          )}
                          <div className="flex flex-wrap justify-end gap-2 mt-2">
                            <Button variant="secondary" aria-label="Cancel note creation" onClick={() => setCreateNoteOpen(false)} className="bg-white/10 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-400">
                              Cancel
                            </Button>
                            <Button aria-label="Create note" onClick={handleCreateNote} className="bg-blue-600/80 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-400">
                              Create
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {notes.length === 0 ? (
                    <div className="text-slate-400 text-sm font-roboto">No live notes yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                          <div className="text-white text-base font-semibold font-exo mb-1">{note.title}</div>
                          <div className="text-slate-300 text-sm font-roboto">{note.content}</div>
                          <div className="text-slate-400 text-xs mt-2 font-roboto">
                            {note.is_shared ? "Shared" : "Private"} • {new Date(note.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quizzes" className="mt-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-300 font-roboto">Live Quizzes</div>
                    {isHost && (
                      <Dialog open={createQuizOpen} onOpenChange={setCreateQuizOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" aria-label="Create quiz" className="bg-blue-600/80 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-400">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                          <DialogHeader>
                            <DialogTitle>Create Live Quiz</DialogTitle>
                            <DialogDescription>Create a quiz that students can answer during the live session.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={newQuiz.title}
                                onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Quiz title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Input
                                value={newQuiz.questions[0].question}
                                onChange={(e) => setNewQuiz(prev => ({
                                  ...prev,
                                  questions: [{ ...prev.questions[0], question: e.target.value }]
                                }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Question"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Options (comma-separated)</Label>
                              <Input
                                value={newQuiz.questions[0].options.join(", ")}
                                onChange={(e) => setNewQuiz(prev => ({
                                  ...prev,
                                  questions: [{ ...prev.questions[0], options: e.target.value.split(",").map(s => s.trim()) }]
                                }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="secondary" onClick={() => setCreateQuizOpen(false)} className="bg-white/10 text-white hover:bg-white/20">
                                Cancel
                              </Button>
                              <Button onClick={handleCreateQuiz} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                                Create
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {quizzes.length === 0 ? (
                    <div className="text-slate-400 text-sm">No live quizzes yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                          <div className="text-white text-base font-semibold font-exo mb-1">{quiz.title}</div>
                          <div className="text-slate-300 text-sm font-roboto">{quiz.questions[0]?.question}</div>
                          <div className="text-slate-400 text-xs mt-2 font-roboto">
                            {quiz.is_active ? "Active" : "Inactive"} • {new Date(quiz.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="polls" className="mt-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-300 font-roboto">Live Polls</div>
                    {isHost && (
                      <Dialog open={createPollOpen} onOpenChange={setCreatePollOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" aria-label="Create poll" className="bg-blue-600/80 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-400">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                          <DialogHeader>
                            <DialogTitle>Create Live Poll</DialogTitle>
                            <DialogDescription>Create a poll that students can vote on during the live session.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Input
                                value={newPoll.question}
                                onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Poll question"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Options (comma-separated)</Label>
                              <Input
                                value={newPoll.options.join(", ")}
                                onChange={(e) => setNewPoll(prev => ({ ...prev, options: e.target.value.split(",").map(s => s.trim()) }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Option 1, Option 2, Option 3"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="secondary" onClick={() => setCreatePollOpen(false)} className="bg-white/10 text-white hover:bg-white/20">
                                Cancel
                              </Button>
                              <Button onClick={handleCreatePoll} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                                Create
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {polls.length === 0 ? (
                    <div className="text-slate-400 text-sm">No live polls yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {polls.map((poll) => (
                        <div key={poll.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                          <div className="text-white text-base font-semibold font-exo mb-1">{poll.question}</div>
                          <div className="text-slate-300 text-sm font-roboto">{poll.options.join(", ")}</div>
                          <div className="text-slate-400 text-xs mt-2 font-roboto">
                            {poll.responses.length} responses • {new Date(poll.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="classwork" className="mt-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-300 font-roboto">Live Classwork</div>
                    {isHost && (
                      <Dialog open={createClassworkOpen} onOpenChange={setCreateClassworkOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" aria-label="Create classwork" className="bg-blue-600/80 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-400">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/10 border-white/20 backdrop-blur text-white">
                          <DialogHeader>
                            <DialogTitle>Create Live Classwork</DialogTitle>
                            <DialogDescription>Create a classwork assignment that students can work on during the live session.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={newClasswork.title}
                                onChange={(e) => setNewClasswork(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Classwork title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <textarea
                                value={newClasswork.description}
                                onChange={(e) => setNewClasswork(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full min-h-20 rounded-md border bg-white/5 border-white/10 text-white p-2"
                                placeholder="Classwork description..."
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="secondary" onClick={() => setCreateClassworkOpen(false)} className="bg-white/10 text-white hover:bg-white/20">
                                Cancel
                              </Button>
                              <Button onClick={handleCreateClasswork} className="bg-blue-600/80 hover:bg-blue-600 text-white">
                                Create
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {classwork.length === 0 ? (
                    <div className="text-slate-400 text-sm">No live classwork yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {classwork.map((item) => (
                        <div key={item.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                          <div className="text-white text-base font-semibold font-exo mb-1">{item.title}</div>
                          <div className="text-slate-300 text-sm font-roboto">{item.description}</div>
                          <div className="text-slate-400 text-xs mt-2 font-roboto">
                            {item.submissions.length} submissions • {new Date(item.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                <AttendanceWidget sessionId={session.id} isHost={isHost} />
              </TabsContent>
            </Tabs>
        </GlassCard>
        </div>
      </div>
    </div>
  )
}
