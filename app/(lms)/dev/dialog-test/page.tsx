"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { GlassCard } from "@/components/shared/glass-card"

export default function DialogTestPage() {
  const [basicDialogOpen, setBasicDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white text-center">Dialog Test Page</h1>
        
        {/* Basic Dialog Test */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Dialog Test</h2>
          <Dialog open={basicDialogOpen} onOpenChange={setBasicDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => console.log("Basic dialog trigger clicked")}>
                Open Basic Dialog
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 backdrop-blur border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Basic Dialog</DialogTitle>
                <DialogDescription>
                  This is a basic dialog test to verify the Dialog component is working.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <p className="text-slate-300">If you can see this, the Dialog component is working correctly!</p>
                <Button 
                  onClick={() => setBasicDialogOpen(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </GlassCard>

        {/* Manual Button Test */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Button Test</h2>
          <Button 
            onClick={() => {
              console.log("Manual button clicked!")
              setBasicDialogOpen(true)
            }}
          >
            Manual Open Dialog
          </Button>
        </GlassCard>

        {/* AuthModal Test */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">AuthModal Test</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-300 mb-2">AuthModal with Button:</p>
              <AuthModal label="Test Auth Modal" />
            </div>
            <div>
              <p className="text-slate-300 mb-2">AuthModal with Plain Button:</p>
              <AuthModal label="Test Plain Button" asPlainButton />
            </div>
          </div>
        </GlassCard>

        {/* Debug Info */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Info</h2>
          <div className="text-slate-300 space-y-2">
            <p>• Open your browser console to see click event logs</p>
            <p>• Check if any JavaScript errors are preventing the modal from opening</p>
            <p>• Verify that the Dialog component is properly rendered in the DOM</p>
            <p>• Current basic dialog state: {basicDialogOpen ? "Open" : "Closed"}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
