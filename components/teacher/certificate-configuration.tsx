"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/services/http"
import { 
  Award, 
  Palette, 
  Upload, 
  Save, 
  Eye,
  Settings,
  FileText,
  Calendar,
  Clock,
  Star
} from "lucide-react"

interface CertificateConfig {
  enabled: boolean
  template: string
  custom_text: string
  signature: string
  logo_url: string
  background_color: string
  text_color: string
  border_color: string
  show_completion_date: boolean
  show_course_duration: boolean
  show_grade: boolean
  custom_fields: Array<{
    label: string
    value: string
  }>
}

interface CertificateConfigurationProps {
  courseId: string
  onSave?: (config: CertificateConfig) => void
}

const TEMPLATES = [
  { value: "default", label: "Default", description: "Clean and professional" },
  { value: "classic", label: "Classic", description: "Traditional academic style" },
  { value: "modern", label: "Modern", description: "Contemporary design" },
  { value: "minimal", label: "Minimal", description: "Simple and elegant" }
]

const COLOR_PRESETS = [
  { name: "Blue", background: "#1e293b", text: "#ffffff", border: "#3b82f6" },
  { name: "Green", background: "#064e3b", text: "#ffffff", border: "#10b981" },
  { name: "Purple", background: "#581c87", text: "#ffffff", border: "#8b5cf6" },
  { name: "Red", background: "#7f1d1d", text: "#ffffff", border: "#ef4444" },
  { name: "Orange", background: "#9a3412", text: "#ffffff", border: "#f97316" }
]

export function CertificateConfiguration({ courseId, onSave }: CertificateConfigurationProps) {
  const [config, setConfig] = useState<CertificateConfig>({
    enabled: false,
    template: "default",
    custom_text: "",
    signature: "",
    logo_url: "",
    background_color: "#1e293b",
    text_color: "#ffffff",
    border_color: "#3b82f6",
    show_completion_date: true,
    show_course_duration: false,
    show_grade: false,
    custom_fields: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificateConfig()
  }, [courseId])

  const fetchCertificateConfig = async () => {
    try {
      setLoading(true)
      const response = await http<any>(`/api/courses/${courseId}`)
      const course = response
      
      if (course.certificate_config) {
        setConfig({ ...config, ...course.certificate_config })
      }
    } catch (error: any) {
      console.error('Error fetching certificate config:', error)
      toast({
        title: "Error",
        description: "Failed to load certificate configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveCertificateConfig = async () => {
    try {
      setSaving(true)
      
      const response = await http<any>(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: {
          certificate_config: config
        }
      })

      toast({
        title: "Certificate Configuration Saved",
        description: "Your certificate settings have been updated successfully.",
      })

      onSave?.(config)
    } catch (error: any) {
      console.error('Error saving certificate config:', error)
      toast({
        title: "Error",
        description: "Failed to save certificate configuration",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<CertificateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateConfig({
      background_color: preset.background,
      text_color: preset.text,
      border_color: preset.border
    })
  }

  const addCustomField = () => {
    updateConfig({
      custom_fields: [...config.custom_fields, { label: "", value: "" }]
    })
  }

  const removeCustomField = (index: number) => {
    updateConfig({
      custom_fields: config.custom_fields.filter((_, i) => i !== index)
    })
  }

  const updateCustomField = (index: number, field: "label" | "value", value: string) => {
    const newFields = [...config.custom_fields]
    newFields[index][field] = value
    updateConfig({ custom_fields: newFields })
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading certificate configuration...</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="h-6 w-6 text-yellow-400" />
            Certificate Configuration
          </h2>
          <p className="text-slate-400 mt-1">Configure certificates for course completion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={saveCertificateConfig}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Certificate Preview */
        <GlassCard className="p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-6">Certificate Preview</h3>
            <div 
              className="mx-auto w-full max-w-2xl aspect-[8.5/11] rounded-lg border-4 shadow-2xl"
              style={{
                backgroundColor: config.background_color,
                borderColor: config.border_color,
                color: config.text_color
              }}
            >
              <div className="p-8 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4" style={{ color: config.border_color }}>
                    CERTIFICATE OF COMPLETION
                  </h1>
                  <p className="text-lg mb-8">This is to certify that</p>
                </div>

                {/* Student Name */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-4">John Doe</h2>
                  <p className="text-lg mb-8">has successfully completed the course</p>
                </div>

                {/* Course Title */}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4" style={{ color: config.border_color }}>
                    "Introduction to Programming"
                  </h3>
                  {config.custom_text && (
                    <p className="text-lg mb-4">{config.custom_text}</p>
                  )}
                </div>

                {/* Details */}
                <div className="text-center space-y-2">
                  {config.show_completion_date && (
                    <p className="text-lg">Completed on: {new Date().toLocaleDateString()}</p>
                  )}
                  {config.show_course_duration && (
                    <p className="text-lg">Course Duration: 8 weeks</p>
                  )}
                  {config.show_grade && (
                    <p className="text-lg">Final Grade: 95%</p>
                  )}
                </div>

                {/* Custom Fields */}
                {config.custom_fields.map((field, index) => (
                  <div key={index} className="text-center">
                    <p className="text-lg">{field.label}: {field.value}</p>
                  </div>
                ))}

                {/* Signature */}
                <div className="text-center mt-8">
                  <div className="border-t-2 w-48 mx-auto mb-2" style={{ borderColor: config.border_color }}></div>
                  <p className="text-lg font-semibold">{config.signature || 'AuraiumLMS'}</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : (
        /* Configuration Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Basic Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-slate-300">Enable Certificates</Label>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>

              <div>
                <Label htmlFor="template" className="text-slate-300">Certificate Template</Label>
                <Select value={config.template} onValueChange={(value) => updateConfig({ template: value })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        <div>
                          <div className="font-medium">{template.label}</div>
                          <div className="text-sm text-slate-400">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom_text" className="text-slate-300">Custom Text</Label>
                <Textarea
                  id="custom_text"
                  value={config.custom_text}
                  onChange={(e) => updateConfig({ custom_text: e.target.value })}
                  placeholder="Additional text to include on the certificate..."
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="signature" className="text-slate-300">Signature/Authority</Label>
                <Input
                  id="signature"
                  value={config.signature}
                  onChange={(e) => updateConfig({ signature: e.target.value })}
                  placeholder="Your name or institution"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                />
              </div>
            </div>
          </GlassCard>

          {/* Display Options */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Display Options</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_completion_date" className="text-slate-300">Show Completion Date</Label>
                </div>
                <Switch
                  id="show_completion_date"
                  checked={config.show_completion_date}
                  onCheckedChange={(checked) => updateConfig({ show_completion_date: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_course_duration" className="text-slate-300">Show Course Duration</Label>
                </div>
                <Switch
                  id="show_course_duration"
                  checked={config.show_course_duration}
                  onCheckedChange={(checked) => updateConfig({ show_course_duration: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="show_grade" className="text-slate-300">Show Final Grade</Label>
                </div>
                <Switch
                  id="show_grade"
                  checked={config.show_grade}
                  onCheckedChange={(checked) => updateConfig({ show_grade: checked })}
                />
              </div>
            </div>
          </GlassCard>

          {/* Color Customization */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Color Customization</h3>
            </div>
            
            <div className="space-y-4">
              {/* Color Presets */}
              <div>
                <Label className="text-slate-300 mb-2 block">Color Presets</Label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="p-2 rounded-lg border border-slate-600 hover:border-slate-400 transition-colors"
                      style={{ backgroundColor: preset.background }}
                      title={preset.name}
                    >
                      <div className="w-full h-8 rounded" style={{ backgroundColor: preset.border }}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color" className="text-slate-300">Background</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="background_color"
                      value={config.background_color}
                      onChange={(e) => updateConfig({ background_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.background_color}
                      onChange={(e) => updateConfig({ background_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="text_color" className="text-slate-300">Text</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="text_color"
                      value={config.text_color}
                      onChange={(e) => updateConfig({ text_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.text_color}
                      onChange={(e) => updateConfig({ text_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="border_color" className="text-slate-300">Border</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="border_color"
                      value={config.border_color}
                      onChange={(e) => updateConfig({ border_color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-600"
                    />
                    <Input
                      value={config.border_color}
                      onChange={(e) => updateConfig({ border_color: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Custom Fields */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Custom Fields</h3>
              <Button
                onClick={addCustomField}
                size="sm"
                variant="outline"
                className="bg-white/10 text-white hover:bg-white/20 border-white/20"
              >
                Add Field
              </Button>
            </div>
            
            <div className="space-y-3">
              {config.custom_fields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
                  <Input
                    value={field.label}
                    onChange={(e) => updateCustomField(index, "label", e.target.value)}
                    placeholder="Field label"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomField(index, "value", e.target.value)}
                    placeholder="Field value"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={() => removeCustomField(index)}
                    size="sm"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {config.custom_fields.length === 0 && (
                <p className="text-slate-400 text-center py-4">
                  No custom fields added. Click "Add Field" to include additional information.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
