"use client"

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BulkCoursesAPI, type BulkCourseData, type BulkCourseResponse, type ValidationResponse } from "@/services/bulk-courses/api"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Plus,
  Eye,
  Trash2
} from "lucide-react"

interface BulkCourseImportProps {
  onCoursesCreated?: (results: BulkCourseResponse) => void
}

export function BulkCourseImport({ onCoursesCreated }: BulkCourseImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload')
  const [courses, setCourses] = useState<BulkCourseData[]>([])
  const [validation, setValidation] = useState<ValidationResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<BulkCourseResponse | null>(null)
  const [manualJson, setManualJson] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    const allowedExtensions = ['.json', '.csv', '.xlsx', '.xls']
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON, CSV, or Excel file.",
        variant: "destructive"
      })
      return
    }

    try {
      let parsedCourses: BulkCourseData[] = []
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // Handle JSON files (legacy)
        parsedCourses = await BulkCoursesAPI.parseUploadedFile(file)
      } else {
        // Handle CSV/Excel files via API
        const response = await BulkCoursesAPI.uploadFile(file)
        parsedCourses = response.courses
      }
      
      setCourses(parsedCourses)
      setValidation(null)
      setResults(null)
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${parsedCourses.length} courses`
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive"
      })
    }
  }

  const handleManualJsonChange = (value: string) => {
    setManualJson(value)
    try {
      const data = JSON.parse(value)
      if (data.courses && Array.isArray(data.courses)) {
        setCourses(data.courses)
        setValidation(null)
        setResults(null)
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  const validateCourses = async () => {
    if (courses.length === 0) {
      toast({
        title: "No courses to validate",
        description: "Please upload or enter course data first",
        variant: "destructive"
      })
      return
    }

    setIsValidating(true)
    try {
      const validationResult = await BulkCoursesAPI.validateBulkCourses(courses)
      setValidation(validationResult)
      
      if (validationResult.valid) {
        toast({
          title: "Validation successful",
          description: `All ${validationResult.summary.total} courses are valid`
        })
      } else {
        toast({
          title: "Validation failed",
          description: `${validationResult.summary.invalid} courses have errors`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: error instanceof Error ? error.message : "Failed to validate courses",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const createCourses = async () => {
    if (courses.length === 0) {
      toast({
        title: "No courses to create",
        description: "Please upload or enter course data first",
        variant: "destructive"
      })
      return
    }

    if (validation && !validation.valid) {
      toast({
        title: "Please fix validation errors first",
        description: "All courses must be valid before creation",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await BulkCoursesAPI.createBulkCourses(courses)
      setResults(result)
      
      if (result.summary.errors === 0) {
        toast({
          title: "Success!",
          description: `Successfully created ${result.summary.created} courses`
        })
        onCoursesCreated?.(result)
      } else {
        toast({
          title: "Partial success",
          description: `Created ${result.summary.created} courses, ${result.summary.errors} failed`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create courses",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const template = await BulkCoursesAPI.getTemplate()
      BulkCoursesAPI.downloadTemplate(template)
      toast({
        title: "Template downloaded",
        description: "Use this template to create your bulk course data"
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download template",
        variant: "destructive"
      })
    }
  }

  const downloadExcelTemplate = async () => {
    try {
      await BulkCoursesAPI.downloadExcelTemplate()
      toast({
        title: "Excel template downloaded",
        description: "Use this Excel template to create your bulk course data"
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download Excel template",
        variant: "destructive"
      })
    }
  }

  const downloadCSVTemplate = async () => {
    try {
      await BulkCoursesAPI.downloadCSVTemplate()
      toast({
        title: "CSV template downloaded",
        description: "Use this CSV template to create your bulk course data"
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download CSV template",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setCourses([])
    setValidation(null)
    setResults(null)
    setManualJson('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const canCreate = courses.length > 0 && (!validation || validation.valid) && !isCreating

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Bulk Import Courses
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-md border-white/20 shadow-glass">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Bulk Course Import</DialogTitle>
          <DialogDescription className="text-slate-300">
            Import multiple courses with modules, lessons, and content at once
          </DialogDescription>
        </DialogHeader>

        {/* Consistent Tab Navigation */}
        <div className="w-full flex justify-center py-6">
          <div className="flex bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'manual'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="h-4 w-4" />
              Manual Entry
            </button>
          </div>
        </div>

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-glass">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold">
                  <Upload className="h-5 w-5 text-blue-400" />
                  Upload Course Data
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Upload a JSON, CSV, or Excel file containing your course data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Upload Section */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                  >
                    <FileText className="h-5 w-5 mr-3" />
                    Choose File (JSON/CSV/Excel)
                  </Button>
                  
                  {/* Template Downloads */}
                  <div className="space-y-3">
                    <h4 className="text-white font-medium text-sm">Download Templates:</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        JSON Template
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadCSVTemplate}
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV Template
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadExcelTemplate}
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel Template
                      </Button>
                    </div>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {courses.length > 0 && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white">Loaded Courses:</span>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {courses.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {courses.slice(0, 3).map((course, index) => (
                        <div key={index} className="text-sm text-slate-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          {course.title} ({course.modules.length} modules)
                        </div>
                      ))}
                      {courses.length > 3 && (
                        <div className="text-sm text-slate-400 italic">
                          ... and {courses.length - 3} more courses
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-glass">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Manual JSON Entry
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Paste your course data in JSON format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="json-input" className="text-white font-medium">Course Data (JSON)</Label>
                  <Textarea
                    id="json-input"
                    value={manualJson}
                    onChange={(e) => handleManualJsonChange(e.target.value)}
                    placeholder="Paste your JSON course data here..."
                    className="min-h-[300px] font-mono text-sm bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template for Reference
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Validation Results */}
        {validation && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-glass">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold">
                {validation.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <Badge className={`${validation.valid ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                  {validation.summary.valid} Valid
                </Badge>
                <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
                  {validation.summary.invalid} Invalid
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {validation.summary.total} Total
                </Badge>
              </div>

              {!validation.valid && (
                <div className="space-y-3">
                  {validation.results
                    .filter(result => !result.valid)
                    .map((result, index) => (
                      <Alert key={index} variant="destructive" className="bg-red-500/10 border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                          <div className="font-medium">{result.title}</div>
                          <ul className="mt-2 list-disc list-inside space-y-1">
                            {result.errors.map((error, errorIndex) => (
                              <li key={errorIndex} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Creation Results */}
        {results && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-glass">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white text-lg font-semibold">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Creation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {results.summary.created} Created
                </Badge>
                <Badge className={`${results.summary.errors > 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                  {results.summary.errors} Errors
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {results.summary.total} Total
                </Badge>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-red-400">Errors:</h4>
                  {results.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="bg-red-500/10 border-red-500/20">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        <div className="font-medium">{error.course}</div>
                        {error.module && <div>Module: {error.module}</div>}
                        {error.lesson && <div>Lesson: {error.lesson}</div>}
                        <div className="text-sm mt-1">{error.error}</div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {results.results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-400">Successfully Created:</h4>
                  {results.results.map((result, index) => (
                    <div key={index} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="font-medium text-green-300">{result.title}</div>
                      <div className="text-sm text-green-400">
                        {result.modules.length} modules, {result.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={isCreating}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={validateCourses}
              disabled={courses.length === 0 || isValidating}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Validate
            </Button>
            
            <Button
              onClick={createCourses}
              disabled={!canCreate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Courses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
