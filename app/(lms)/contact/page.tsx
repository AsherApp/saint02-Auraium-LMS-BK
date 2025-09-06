'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare,
  BookOpen,
  Users,
  CheckCircle,
  Globe,
  Calendar,
  Video,
  FileText,
  HelpCircle,
  Star,
  ChevronRight,
  HeadphonesIcon,
  Zap,
  AlertCircle
} from 'lucide-react'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'general' | 'technical' | 'billing' | 'course_content' | 'live_sessions' | 'assignments'
}

export default function ContactPage() {
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [form, setForm] = useState<ContactForm>({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.subject || !form.message) {
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call to support system
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 2000)
  }

  const contactMethods = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'Email Support',
      description: 'Get help via email with detailed responses',
      contact: 'support@aurarium.com',
      responseTime: 'Within 4 hours',
      available: '24/7',
      color: 'text-blue-400'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Live Chat',
      description: 'Instant help through our chat system',
      contact: 'Start Chat',
      responseTime: 'Immediate',
      available: 'Mon-Fri 9am-6pm GMT',
      color: 'text-green-400'
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      contact: '+44 20 7946 0958',
      responseTime: 'Immediate',
      available: 'Mon-Fri 9am-5pm GMT',
      color: 'text-purple-400'
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: 'Knowledge Base',
      description: 'Self-service help articles and guides',
      contact: 'Browse Articles',
      responseTime: 'Instant',
      available: '24/7',
      color: 'text-orange-400'
    }
  ]

  const quickActions = [
    { icon: <FileText className="h-4 w-4" />, label: 'View Documentation', href: '/knowledge-base' },
    { icon: <Video className="h-4 w-4" />, label: 'Video Tutorials', href: '/tutorials' },
            { icon: <Users className="h-4 w-4" />, label: 'Discussions', href: '/discussions' },
    { icon: <HelpCircle className="h-4 w-4" />, label: 'FAQ', href: '/faq' }
  ]

  const supportStats = [
    { label: 'Avg Response', value: '2.4 hours', icon: <Clock className="h-4 w-4 text-blue-400" /> },
    { label: 'Satisfaction', value: '4.8/5', icon: <Star className="h-4 w-4 text-yellow-400" /> },
    { label: 'Resolution', value: '98.5%', icon: <CheckCircle className="h-4 w-4 text-green-400" /> },
    { label: 'Languages', value: '12', icon: <Globe className="h-4 w-4 text-purple-400" /> }
  ]

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl mb-4">Message Sent Successfully!</CardTitle>
            <CardDescription className="text-base mb-6">
              Thank you for contacting us. We've received your message and will get back to you within 4 hours during business hours.
            </CardDescription>
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm">
                <strong>Ticket #AU-{Date.now().toString().slice(-6)}</strong> has been created for your inquiry.
                You can track its progress in your messages.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
              >
                Send Another Message
              </Button>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Get Help & Support</h1>
        <p className="text-xl text-slate-300 mb-6">
          Need assistance? Our support team is here to help you make the most of AuraiumLMS.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-blue-400" />
            Avg response: 2.4 hours
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
            4.8/5 satisfaction
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
            98.5% resolution rate
          </div>
        </div>
      </div>

      {/* Support Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {supportStats.map((stat, index) => (
          <Card key={index} className="border-white/10">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contactMethods.map((method, index) => (
          <Card key={index} className="cursor-pointer hover:bg-white/5 transition-colors border-white/10">
            <CardContent className="p-6">
              <div className={`h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center mb-4 ${method.color}`}>
                {method.icon}
              </div>
              <CardTitle className="text-lg mb-2">{method.title}</CardTitle>
              <CardDescription className="mb-4">{method.description}</CardDescription>
              <div className="space-y-2 text-sm">
                <div className="text-white font-medium">{method.contact}</div>
                <div className="text-slate-400 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {method.responseTime}
                </div>
                <div className="text-slate-400">{method.available}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                {user ? `Logged in as ${user.name || user.email} (${user.role})` : 'Please describe your issue in detail'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={!!user?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      disabled={!!user?.email}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Subscriptions</SelectItem>
                        <SelectItem value="course_content">Course Content</SelectItem>
                        <SelectItem value="live_sessions">Live Sessions</SelectItem>
                        <SelectItem value="assignments">Assignments & Grading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General question</SelectItem>
                        <SelectItem value="medium">Medium - Need assistance</SelectItem>
                        <SelectItem value="high">High - Important issue</SelectItem>
                        <SelectItem value="urgent">Urgent - System down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="min-h-[120px]"
                    placeholder="Please provide detailed information about your inquiry, including any error messages or specific questions..."
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-400">
                    We typically respond within 4 hours during business hours.
                  </p>
                  <Button
                    type="submit"
                    disabled={!form.subject || !form.message || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
                  asChild
                >
                  <a href={action.href}>
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Emergency Support */}
          <Card className="border-red-400/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Emergency Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                For critical issues affecting your live classes or urgent technical problems:
              </CardDescription>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                <Phone className="h-4 w-4 mr-2" />
                Emergency Hotline
              </Button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Available 24/7 for all users
              </p>
            </CardContent>
          </Card>

          {/* Office Information */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Support Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Business Hours</p>
                  <p className="text-slate-400 text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM GMT<br />
                    Weekend: Emergency support only
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Global Support</p>
                  <p className="text-slate-400 text-sm">
                    24/7 email support<br />
                    Multi-language assistance
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule a Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}