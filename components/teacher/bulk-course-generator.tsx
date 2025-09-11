"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BulkCoursesAPI, type BulkCourseData } from "@/services/bulk-courses/api"
import { Download, Plus, Trash2, Wand2, Upload } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

interface CourseTemplate {
  title: string
  description: string
  modules: number
  lessonsPerModule: number
  contentType: 'video' | 'text' | 'quiz' | 'mixed'
}

export function BulkCourseGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<CourseTemplate[]>([
    {
      title: "Introduction to Programming",
      description: "Learn the basics of programming",
      modules: 3,
      lessonsPerModule: 4,
      contentType: 'mixed'
    }
  ])
  const [generatedCourses, setGeneratedCourses] = useState<BulkCourseData[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()

  const addTemplate = () => {
    setTemplates([...templates, {
      title: "",
      description: "",
      modules: 3,
      lessonsPerModule: 4,
      contentType: 'mixed'
    }])
  }

  const removeTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index))
  }

  const updateTemplate = (index: number, field: keyof CourseTemplate, value: any) => {
    const updated = [...templates]
    updated[index] = { ...updated[index], [field]: value }
    setTemplates(updated)
  }

  const generateCourses = () => {
    const courses: BulkCourseData[] = []

    templates.forEach((template, templateIndex) => {
      if (!template.title.trim()) return

      const course: BulkCourseData = {
        title: template.title,
        description: template.description,
        course_mode: 'normal',
        status: 'draft',
        modules: []
      }

      // Generate modules
      for (let moduleIndex = 0; moduleIndex < template.modules; moduleIndex++) {
        const module = {
          title: `Module ${moduleIndex + 1}: ${getModuleTitle(template.title, moduleIndex)}`,
          description: `Learn about ${getModuleDescription(template.title, moduleIndex)}`,
          order_index: moduleIndex + 1,
          lessons: []
        }

        // Generate lessons
        for (let lessonIndex = 0; lessonIndex < template.lessonsPerModule; lessonIndex++) {
          const contentType = template.contentType === 'mixed' 
            ? getRandomContentType(lessonIndex)
            : template.contentType

          const lesson = {
            title: `Lesson ${lessonIndex + 1}: ${getLessonTitle(template.title, moduleIndex, lessonIndex)}`,
            description: `Learn about ${getLessonDescription(template.title, moduleIndex, lessonIndex)}`,
            order_index: lessonIndex + 1,
            content_type: contentType === 'quiz' ? 'quiz' : contentType === 'video' ? 'video' : 'text',
            content: generateContent(contentType, template.title, moduleIndex, lessonIndex)
          }

          module.lessons.push(lesson)
        }

        course.modules.push(module)
      }

      courses.push(course)
    })

    setGeneratedCourses(courses)
    toast({
      title: "Courses generated!",
      description: `Generated ${courses.length} courses with ${courses.reduce((acc, c) => acc + c.modules.length, 0)} modules`
    })
  }

  const downloadGenerated = () => {
    if (generatedCourses.length === 0) {
      toast({
        title: "No courses to download",
        description: "Generate courses first",
        variant: "destructive"
      })
      return
    }

    BulkCoursesAPI.downloadTemplate({ courses: generatedCourses })
    toast({
      title: "Courses downloaded!",
      description: "Use this file to import your generated courses"
    })
  }

  const createCourses = async () => {
    if (generatedCourses.length === 0) {
      toast({
        title: "No courses to create",
        description: "Generate courses first",
        variant: "destructive"
      })
      return
    }

    if (!user?.email) {
      toast({
        title: "Authentication required",
        description: "Please log in to create courses",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      // Add teacher email to all courses
      const coursesWithTeacher = generatedCourses.map(course => ({
        ...course,
        teacher_email: user.email
      }))

      const result = await BulkCoursesAPI.createCourses(coursesWithTeacher)
      
      // Calculate totals from results
      const totalModules = result.results.reduce((acc, course) => acc + course.modules.length, 0)
      const totalLessons = result.results.reduce((acc, course) => 
        acc + course.modules.reduce((moduleAcc, module) => moduleAcc + module.lessons.length, 0), 0
      )
      
      toast({
        title: "Courses created successfully!",
        description: `Created ${result.summary.created} courses with ${totalModules} modules and ${totalLessons} lessons`
      })

      // Clear generated courses and close dialog
      setGeneratedCourses([])
      setIsOpen(false)
      
      // Refresh the page to show new courses
      window.location.reload()
    } catch (error: any) {
      console.error("Failed to create courses:", error)
      toast({
        title: "Failed to create courses",
        description: error.message || "An error occurred while creating courses",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getModuleTitle = (courseTitle: string, moduleIndex: number): string => {
    const moduleTitles = {
      "Introduction to Programming": ["Getting Started", "Variables and Data Types", "Control Structures", "Functions"],
      "Web Development": ["HTML Basics", "CSS Styling", "JavaScript Fundamentals", "Responsive Design"],
      "Data Science": ["Data Collection", "Data Analysis", "Visualization", "Machine Learning"],
      "default": ["Introduction", "Core Concepts", "Advanced Topics", "Practical Applications"]
    }

    const titles = moduleTitles[courseTitle as keyof typeof moduleTitles] || moduleTitles.default
    return titles[moduleIndex] || `Module ${moduleIndex + 1}`
  }

  const getModuleDescription = (courseTitle: string, moduleIndex: number): string => {
    return `Essential concepts and practical applications in ${getModuleTitle(courseTitle, moduleIndex).toLowerCase()}`
  }

  const getLessonTitle = (courseTitle: string, moduleIndex: number, lessonIndex: number): string => {
    const lessonTitles = [
      "Overview and Introduction",
      "Key Concepts and Theory",
      "Hands-on Practice",
      "Real-world Applications",
      "Advanced Techniques",
      "Best Practices",
      "Common Pitfalls",
      "Summary and Review"
    ]
    return lessonTitles[lessonIndex] || `Lesson ${lessonIndex + 1}`
  }

  const getLessonDescription = (courseTitle: string, moduleIndex: number, lessonIndex: number): string => {
    return `Deep dive into ${getLessonTitle(courseTitle, moduleIndex, lessonIndex).toLowerCase()}`
  }

  const getRandomContentType = (lessonIndex: number): 'video' | 'text' | 'quiz' => {
    const types: ('video' | 'text' | 'quiz')[] = ['video', 'text', 'quiz']
    return types[lessonIndex % types.length]
  }

  const generateContent = (contentType: string, courseTitle: string, moduleIndex: number, lessonIndex: number) => {
    switch (contentType) {
      case 'video':
        return {
          video: {
            url: `https://example.com/videos/${courseTitle.toLowerCase().replace(/\s+/g, '-')}-module-${moduleIndex + 1}-lesson-${lessonIndex + 1}.mp4`,
            source: 'upload' as const,
            description: `Video lesson covering ${getLessonTitle(courseTitle, moduleIndex, lessonIndex)}`
          }
        }
      case 'text':
        return {
          text: {
            content: `# ${getLessonTitle(courseTitle, moduleIndex, lessonIndex)}\n\nThis lesson covers the fundamental concepts of ${getLessonTitle(courseTitle, moduleIndex, lessonIndex).toLowerCase()}.\n\n## Learning Objectives\n\nBy the end of this lesson, you will be able to:\n- Understand the core concepts\n- Apply the knowledge in practical scenarios\n- Identify key principles and best practices\n\n## Key Points\n\n- **Concept 1**: Important foundational knowledge\n- **Concept 2**: Practical applications and examples\n- **Concept 3**: Advanced techniques and considerations\n\n## Examples\n\nHere are some practical examples to help you understand the concepts:\n\n1. **Example 1**: Basic application\n2. **Example 2**: Intermediate scenario\n3. **Example 3**: Advanced use case\n\n## Summary\n\nIn this lesson, you learned about the key aspects of ${getLessonTitle(courseTitle, moduleIndex, lessonIndex).toLowerCase()}. These concepts will be essential for your understanding of the course material.\n\n## Next Steps\n\n- Review the key points\n- Practice with the examples provided\n- Prepare for the next lesson`
          }
        }
      case 'quiz':
        return {
          quiz: {
            questions: [
              {
                question: `What is the main focus of ${getLessonTitle(courseTitle, moduleIndex, lessonIndex)}?`,
                type: 'multiple_choice' as const,
                options: [
                  'Understanding fundamental concepts',
                  'Learning advanced techniques', 
                  'Practical applications',
                  'All of the above'
                ],
                correct_answer: 'All of the above',
                points: 10
              },
              {
                question: `True or False: The concepts covered in this lesson are essential for understanding ${courseTitle}.`,
                type: 'true_false' as const,
                correct_answer: 'True',
                points: 5
              },
              {
                question: `Which of the following best describes the learning approach in this lesson?`,
                type: 'multiple_choice' as const,
                options: [
                  'Theory only',
                  'Practice only',
                  'Combination of theory and practice',
                  'None of the above'
                ],
                correct_answer: 'Combination of theory and practice',
                points: 10
              }
            ],
            time_limit: 15,
            passing_score: 70
          }
        }
      default:
        return {
          text: {
            content: `# ${getLessonTitle(courseTitle, moduleIndex, lessonIndex)}\n\nThis lesson provides comprehensive coverage of ${getLessonTitle(courseTitle, moduleIndex, lessonIndex).toLowerCase()}.\n\n## Overview\n\nThis lesson introduces you to the essential concepts and practical applications.\n\n## Key Learning Points\n\n- Fundamental principles\n- Real-world applications\n- Best practices and tips\n\n## Summary\n\nYou have completed this lesson on ${getLessonTitle(courseTitle, moduleIndex, lessonIndex).toLowerCase()}.`
          }
        }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0">
          <Wand2 className="h-4 w-4 mr-2" />
          Generate Sample Courses
        </Button>
      </DialogTrigger>
      
      <DialogContent size="xl" className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-md border-white/20 shadow-glass">
        <DialogHeader>
          <DialogTitle>Bulk Course Generator</DialogTitle>
          <DialogDescription>
            Generate sample courses with realistic content for testing and demonstration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Templates */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                Course Templates
                <Button onClick={addTemplate} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template, index) => (
                <div key={index} className="p-4 border border-white/20 rounded-lg space-y-4 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Template {index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTemplate(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${index}`}>Course Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={template.title}
                        onChange={(e) => updateTemplate(index, 'title', e.target.value)}
                        placeholder="e.g., Introduction to Programming"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`modules-${index}`}>Number of Modules</Label>
                      <Input
                        id={`modules-${index}`}
                        type="number"
                        min="1"
                        max="10"
                        value={template.modules}
                        onChange={(e) => updateTemplate(index, 'modules', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={template.description}
                      onChange={(e) => updateTemplate(index, 'description', e.target.value)}
                      placeholder="Brief description of the course"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`lessons-${index}`}>Lessons per Module</Label>
                      <Input
                        id={`lessons-${index}`}
                        type="number"
                        min="1"
                        max="20"
                        value={template.lessonsPerModule}
                        onChange={(e) => updateTemplate(index, 'lessonsPerModule', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`content-${index}`}>Content Type</Label>
                      <Select
                        value={template.contentType}
                        onValueChange={(value: any) => updateTemplate(index, 'contentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Only</SelectItem>
                          <SelectItem value="text">Text Only</SelectItem>
                          <SelectItem value="quiz">Quiz Only</SelectItem>
                          <SelectItem value="mixed">Mixed Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Generated Courses Preview */}
          {generatedCourses.length > 0 && (
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  Generated Courses Preview
                  <div className="flex gap-2">
                    <Button onClick={downloadGenerated} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button 
                      onClick={createCourses} 
                      disabled={isCreating}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Create Courses
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedCourses.map((course, index) => (
                    <div key={index} className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <div className="font-medium text-white">{course.title}</div>
                      <div className="text-sm text-slate-300">
                        {course.modules.length} modules, {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setTemplates([{
                  title: "",
                  description: "",
                  modules: 3,
                  lessonsPerModule: 4,
                  contentType: 'mixed'
                }])
                setGeneratedCourses([])
              }}
            >
              Reset
            </Button>
            
            <Button
              onClick={generateCourses}
              disabled={templates.length === 0 || templates.some(t => !t.title.trim())}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Courses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
