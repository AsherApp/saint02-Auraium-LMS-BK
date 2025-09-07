import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middlewares/auth.js'
import multer from 'multer'
import { 
  parseExcelFile, 
  parseCSVFile, 
  generateExcelTemplate, 
  generateCSVTemplate,
  validateCourseData,
  type CourseData 
} from '../utils/file-parser.js'

export const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and Excel files are allowed.'))
    }
  }
})

// Interface for bulk course data
interface BulkCourseData {
  title: string
  description: string
  course_mode?: 'normal' | 'public'
  status?: 'draft' | 'published'
  modules: {
    title: string
    description?: string
    order_index: number
    lessons: {
      title: string
      description?: string
      order_index: number
      content_type: 'video' | 'text' | 'file' | 'quiz' | 'assignment'
      content: {
        // Video content
        video?: {
          url: string
          source: 'upload' | 'youtube' | 'vimeo' | 'onedrive' | 'googledrive'
          description?: string
        }
        // Text content
        text?: {
          content: string
        }
        // File content
        file?: {
          url: string
          name: string
          description?: string
        }
        // Quiz content
        quiz?: {
          questions: {
            question: string
            type: 'multiple_choice' | 'true_false' | 'short_answer'
            options?: string[]
            correct_answer: string
            points: number
          }[]
          time_limit?: number
          passing_score: number
        }
        // Assignment content
        assignment?: {
          instructions: string
          type: 'essay' | 'project' | 'discussion' | 'presentation' | 'code_submission' | 'file_upload'
          due_date?: string
          max_points: number
        }
      }
    }[]
  }[]
}

// Bulk create courses with modules, lessons, and content
router.post('/bulk-create', requireAuth, asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  const userRole = (req as any).user?.role
  
  if (!userEmail || userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' })
  }

  const { courses }: { courses: BulkCourseData[] } = req.body

  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ error: 'Courses array is required and cannot be empty' })
  }

  if (courses.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 courses can be created at once' })
  }

  const results = []
  const errors = []

  for (let i = 0; i < courses.length; i++) {
    const courseData = courses[i]
    
    try {
      // Validate course data
      if (!courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
        errors.push({
          index: i,
          course: courseData.title || `Course ${i + 1}`,
          error: 'Missing required fields: title and modules array'
        })
        continue
      }

      // Create course
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description || '',
          teacher_email: userEmail,
          status: courseData.status || 'draft',
          course_mode: courseData.course_mode || 'normal'
        })
        .select()
        .single()

      if (courseError) {
        errors.push({
          index: i,
          course: courseData.title,
          error: `Failed to create course: ${courseError.message}`
        })
        continue
      }

      const courseResult = {
        courseId: course.id,
        title: course.title,
        modules: [] as any[]
      }

      // Create modules and lessons
      for (const moduleData of courseData.modules) {
        const { data: module, error: moduleError } = await supabaseAdmin
          .from('modules')
          .insert({
            course_id: course.id,
            title: moduleData.title,
            description: moduleData.description || '',
            position: moduleData.order_index
          })
          .select()
          .single()

        if (moduleError) {
          errors.push({
            index: i,
            course: courseData.title,
            module: moduleData.title,
            error: `Failed to create module: ${moduleError.message}`
          })
          continue
        }

        const moduleResult = {
          moduleId: module.id,
          title: module.title,
          lessons: [] as any[]
        }

        // Create lessons
        for (const lessonData of moduleData.lessons) {
          const { data: lesson, error: lessonError } = await supabaseAdmin
            .from('lessons')
            .insert({
              module_id: module.id,
              title: lessonData.title,
              description: lessonData.description || '',
              position: lessonData.order_index,
              type: lessonData.content_type
            })
            .select()
            .single()

          if (lessonError) {
            errors.push({
              index: i,
              course: courseData.title,
              module: moduleData.title,
              lesson: lessonData.title,
              error: `Failed to create lesson: ${lessonError.message}`
            })
            continue
          }

          // Create lesson content based on type
          let contentResult = null
          if (lessonData.content) {
            const { data: content, error: contentError } = await supabaseAdmin
              .from('lesson_content')
              .insert({
                lesson_id: lesson.id,
                content: lessonData.content
              })
              .select()
              .single()

            if (contentError) {
              errors.push({
                index: i,
                course: courseData.title,
                module: moduleData.title,
                lesson: lessonData.title,
                error: `Failed to create lesson content: ${contentError.message}`
              })
            } else {
              contentResult = content
            }
          }

          moduleResult.lessons.push({
            lessonId: lesson.id,
            title: lesson.title,
            contentType: lesson.content_type,
            contentCreated: !!contentResult
          })
        }

        courseResult.modules.push(moduleResult)
      }

      results.push(courseResult)

    } catch (error: any) {
      errors.push({
        index: i,
        course: courseData.title || `Course ${i + 1}`,
        error: `Unexpected error: ${error.message}`
      })
    }
  }

  res.json({
    success: true,
    summary: {
      total: courses.length,
      created: results.length,
      errors: errors.length
    },
    results,
    errors
  })
}))

// Get bulk creation template
router.get('/template', requireAuth, asyncHandler(async (req, res) => {
  const userRole = (req as any).user?.role
  
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' })
  }

  const template = {
    courses: [
      {
        title: "Sample Course 1",
        description: "This is a sample course description",
        course_mode: "normal",
        status: "draft",
        modules: [
          {
            title: "Module 1: Introduction",
            description: "Introduction to the course",
            order_index: 1,
            lessons: [
              {
                title: "Lesson 1: Welcome",
                description: "Welcome to the course",
                order_index: 1,
                content_type: "video",
                content: {
                  video: {
                    url: "https://example.com/video.mp4",
                    source: "upload",
                    description: "Welcome video"
                  }
                }
              },
              {
                title: "Lesson 2: Course Overview",
                description: "Overview of what you'll learn",
                order_index: 2,
                content_type: "text",
                content: {
                  text: {
                    content: "This course will cover..."
                  }
                }
              }
            ]
          },
          {
            title: "Module 2: Advanced Topics",
            description: "Advanced concepts",
            order_index: 2,
            lessons: [
              {
                title: "Lesson 3: Advanced Concepts",
                description: "Learn advanced concepts",
                order_index: 1,
                content_type: "quiz",
                content: {
                  quiz: {
                    questions: [
                      {
                        question: "What is the main topic?",
                        type: "multiple_choice",
                        options: ["Option A", "Option B", "Option C"],
                        correct_answer: "Option A",
                        points: 10
                      }
                    ],
                    time_limit: 30,
                    passing_score: 70
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }

  res.json(template)
}))

// Validate bulk course data before creation
router.post('/validate', requireAuth, asyncHandler(async (req, res) => {
  const userRole = (req as any).user?.role
  
  if (userRole !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' })
  }

  const { courses }: { courses: BulkCourseData[] } = req.body

  if (!courses || !Array.isArray(courses)) {
    return res.status(400).json({ error: 'Courses array is required' })
  }

  const validationResults = []
  let isValid = true

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const courseValidation = {
      index: i,
      title: course.title || `Course ${i + 1}`,
      valid: true,
      errors: [] as string[]
    }

    // Validate course
    if (!course.title || course.title.trim().length === 0) {
      courseValidation.valid = false
      courseValidation.errors.push('Course title is required')
    }

    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      courseValidation.valid = false
      courseValidation.errors.push('At least one module is required')
    }

    // Validate modules
    if (course.modules) {
      for (let j = 0; j < course.modules.length; j++) {
        const module = course.modules[j]
        
        if (!module.title || module.title.trim().length === 0) {
          courseValidation.valid = false
          courseValidation.errors.push(`Module ${j + 1}: Title is required`)
        }

        if (!module.lessons || !Array.isArray(module.lessons) || module.lessons.length === 0) {
          courseValidation.valid = false
          courseValidation.errors.push(`Module ${j + 1}: At least one lesson is required`)
        }

        // Validate lessons
        if (module.lessons) {
          for (let k = 0; k < module.lessons.length; k++) {
            const lesson = module.lessons[k]
            
            if (!lesson.title || lesson.title.trim().length === 0) {
              courseValidation.valid = false
              courseValidation.errors.push(`Module ${j + 1}, Lesson ${k + 1}: Title is required`)
            }

            if (!lesson.content_type || !['video', 'text', 'file', 'quiz', 'assignment'].includes(lesson.content_type)) {
              courseValidation.valid = false
              courseValidation.errors.push(`Module ${j + 1}, Lesson ${k + 1}: Valid content type is required`)
            }

            if (!lesson.content) {
              courseValidation.valid = false
              courseValidation.errors.push(`Module ${j + 1}, Lesson ${k + 1}: Content is required`)
            }
          }
        }
      }
    }

    if (!courseValidation.valid) {
      isValid = false
    }

    validationResults.push(courseValidation)
  }

  res.json({
    valid: isValid,
    results: validationResults,
    summary: {
      total: courses.length,
      valid: validationResults.filter(r => r.valid).length,
      invalid: validationResults.filter(r => !r.valid).length
    }
  })
}))

// Upload and parse file (CSV/Excel/JSON)
router.post('/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  const userEmail = (req as any).user?.email
  
  if (!userEmail) {
    return res.status(401).json({ error: 'user_not_found' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'no_file_uploaded' })
  }

  try {
    const file = req.file
    let courses: CourseData[] = []

    // Parse file based on type
    if (file.mimetype === 'application/json') {
      const jsonData = JSON.parse(file.buffer.toString())
      courses = Array.isArray(jsonData) ? jsonData : [jsonData]
    } else if (file.mimetype === 'text/csv') {
      courses = await parseCSVFile(file.buffer)
    } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
      courses = await parseExcelFile(file.buffer)
    } else {
      return res.status(400).json({ error: 'unsupported_file_type' })
    }

    // Validate parsed data
    const validation = validateCourseData(courses)
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'validation_failed',
        details: validation.errors
      })
    }

    // Convert to BulkCourseData format
    const bulkCourses: BulkCourseData[] = courses.map(course => ({
      title: course.title,
      description: course.description,
      status: course.status,
      visibility: course.visibility,
      enrollment_policy: course.enrollment_policy,
      modules: course.modules.map(module => ({
        title: module.title,
        description: module.description,
        order_index: module.order_index,
        lessons: module.lessons.map(lesson => ({
          title: lesson.title,
          description: lesson.description,
          order_index: lesson.order_index,
          content_type: lesson.type as 'video' | 'text' | 'quiz' | 'assignment',
          content: {
            text: lesson.type === 'text' ? { content: lesson.content } : undefined,
            video: lesson.type === 'video' ? { url: lesson.content, source: 'upload' as const } : undefined,
            quiz: lesson.type === 'quiz' && lesson.quiz_questions ? {
              questions: lesson.quiz_questions.map(q => ({
                question: q.question,
                type: q.type as 'multiple_choice' | 'true_false' | 'short_answer',
                options: q.options,
                correct_answer: q.correct_answer,
                points: q.points
              })),
              passing_score: 70
            } : undefined,
            assignment: lesson.type === 'assignment' ? {
              instructions: lesson.content,
              type: 'essay' as const,
              max_points: lesson.points || 100
            } : undefined
          }
        }))
      }))
    }))

    res.json({
      success: true,
      courses: bulkCourses,
      summary: {
        total: bulkCourses.length,
        totalModules: bulkCourses.reduce((sum, course) => sum + course.modules.length, 0),
        totalLessons: bulkCourses.reduce((sum, course) => 
          sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0), 0
        )
      }
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    res.status(500).json({ 
      error: 'file_processing_failed',
      message: error.message 
    })
  }
}))

// Download Excel template
router.get('/template/excel', requireAuth, asyncHandler(async (req, res) => {
  try {
    const excelBuffer = generateExcelTemplate()
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="course_template.xlsx"')
    res.send(excelBuffer)
  } catch (error: any) {
    console.error('Excel template generation error:', error)
    res.status(500).json({ error: 'template_generation_failed' })
  }
}))

// Download CSV template
router.get('/template/csv', requireAuth, asyncHandler(async (req, res) => {
  try {
    const csvContent = generateCSVTemplate()
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="course_template.csv"')
    res.send(csvContent)
  } catch (error: any) {
    console.error('CSV template generation error:', error)
    res.status(500).json({ error: 'template_generation_failed' })
  }
}))

export default router
