import Link from "next/link"
import { Heart, Github, Twitter, Mail, Shield, Zap, Info, FileText, HelpCircle, CreditCard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function LandingFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 pt-8 pb-6 w-full">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 w-full">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white font-extrabold text-2xl tracking-wide">AuraiumLMS</span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm w-full sm:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Platform Features">
                  <Info className="w-4 h-4" />
                  Features
                </button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Platform Features</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h4 className="text-white font-semibold mb-2">For Teachers:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Create unlimited courses and modules</li>
                      <li>• Host live video classes with screen sharing</li>
                      <li>• Interactive whiteboard and real-time chat</li>
                      <li>• Advanced assignment creation and grading</li>
                      <li>• Student progress tracking and analytics</li>
                      <li>• Secure student invitation system</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">For Students:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Access courses anytime, anywhere</li>
                      <li>• Participate in live classes</li>
                      <li>• Submit assignments and get feedback</li>
                      <li>• Track your learning progress</li>
                      <li>• Real-time notifications</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Pricing Plans">
                  <CreditCard className="w-4 h-4" />
                  Pricing
                </button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Pricing Plans</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-slate-300">
                  <div className="p-4 border border-white/10 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Free Plan - £0/month</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Up to 5 students</li>
                      <li>• Basic course creation</li>
                      <li>• File uploads (10MB max)</li>
                      <li>• Email support</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                    <h4 className="text-white font-semibold mb-2">Pro Plan - £50/month</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Up to 50 students</li>
                      <li>• Live video classes</li>
                      <li>• Interactive whiteboard</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Documentation & Guides">
                  <FileText className="w-4 h-4" />
                  Documentation
                </button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Documentation & Guides</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Getting Started:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <a href="#" className="text-blue-400 hover:underline">Teacher Setup Guide</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Student Onboarding</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Course Creation Tutorial</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Advanced Features:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <a href="#" className="text-blue-400 hover:underline">Live Class Setup</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Assignment Management</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Analytics Dashboard</a></li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Support & Contact">
                  <HelpCircle className="w-4 h-4" />
                  Support
                </button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/95 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Support & Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Get Help:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <a href="mailto:hello@auraiumlms.com" className="text-blue-400 hover:underline">Email Support</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Knowledge Base</a></li>
                      <li>• <a href="#" className="text-blue-400 hover:underline">Video Tutorials</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Community:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• <a href="https://github.com/auraiumlms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">GitHub</a></li>
                      <li>• <a href="https://twitter.com/auraiumlms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter</a></li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
          <p className="text-slate-400 text-base font-medium text-center sm:text-left">
            © {new Date().getFullYear()} AuraiumLMS. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-base w-full sm:w-auto">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4" />
              <span className="font-semibold">Secure & Reliable</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>for education</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
