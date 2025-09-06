# Bulk Course Creation System

## Overview

The bulk course creation system allows teachers to import multiple courses with all their modules, lessons, and content at once, rather than creating them one by one. This significantly speeds up the course creation process and enables bulk data migration.

## Features

### 🚀 **Core Functionality**
- **Bulk Import**: Create multiple courses with modules, lessons, and content in one operation
- **JSON Template**: Download and use structured JSON templates
- **Validation**: Pre-validate course data before creation
- **Error Handling**: Detailed error reporting for failed imports
- **Sample Generator**: Generate realistic sample courses for testing

### 📊 **Supported Content Types**
- **Video Content**: Upload, YouTube, Vimeo, OneDrive, Google Drive
- **Text Content**: Rich text with markdown support
- **File Content**: Document uploads and external files
- **Quiz Content**: Multiple choice, true/false, short answer questions
- **Assignment Content**: Essays, projects, discussions, presentations, code submissions

### 🛡️ **Security & Validation**
- **Authentication Required**: Only authenticated teachers can create courses
- **Data Validation**: Comprehensive validation before creation
- **Error Reporting**: Detailed error messages for troubleshooting
- **Batch Limits**: Maximum 50 courses per batch to prevent system overload

## API Endpoints

### 1. Get Template
```http
GET /api/bulk-courses/template
Authorization: Bearer <token>
```

Returns a JSON template with sample course structure.

### 2. Validate Courses
```http
POST /api/bulk-courses/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "courses": [
    {
      "title": "Course Title",
      "description": "Course Description",
      "course_mode": "normal",
      "status": "draft",
      "modules": [...]
    }
  ]
}
```

Validates course data before creation.

### 3. Create Bulk Courses
```http
POST /api/bulk-courses/bulk-create
Authorization: Bearer <token>
Content-Type: application/json

{
  "courses": [...]
}
```

Creates multiple courses with all content.

## JSON Structure

### Course Object
```json
{
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "course_mode": "normal",
  "status": "draft",
  "modules": [
    {
      "title": "Module 1: Getting Started",
      "description": "Introduction to programming concepts",
      "order_index": 1,
      "lessons": [
        {
          "title": "Lesson 1: What is Programming?",
          "description": "Understanding programming basics",
          "order_index": 1,
          "content_type": "video",
          "content": {
            "video": {
              "url": "https://example.com/video.mp4",
              "source": "upload",
              "description": "Introduction video"
            }
          }
        }
      ]
    }
  ]
}
```

### Content Types

#### Video Content
```json
{
  "content_type": "video",
  "content": {
    "video": {
      "url": "https://example.com/video.mp4",
      "source": "upload|youtube|vimeo|onedrive|googledrive",
      "description": "Video description"
    }
  }
}
```

#### Text Content
```json
{
  "content_type": "text",
  "content": {
    "text": {
      "content": "# Lesson Title\n\nLesson content with markdown support..."
    }
  }
}
```

#### File Content
```json
{
  "content_type": "file",
  "content": {
    "file": {
      "url": "https://example.com/document.pdf",
      "name": "Course Notes.pdf",
      "description": "Downloadable course notes"
    }
  }
}
```

#### Quiz Content
```json
{
  "content_type": "quiz",
  "content": {
    "quiz": {
      "questions": [
        {
          "question": "What is the capital of France?",
          "type": "multiple_choice",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "correct_answer": "Paris",
          "points": 10
        }
      ],
      "time_limit": 30,
      "passing_score": 70
    }
  }
}
```

#### Assignment Content
```json
{
  "content_type": "assignment",
  "content": {
    "assignment": {
      "instructions": "Write a 500-word essay on...",
      "type": "essay|project|discussion|presentation|code_submission|file_upload",
      "due_date": "2024-12-31T23:59:59Z",
      "max_points": 100
    }
  }
}
```

## Usage Guide

### 1. Using the UI

#### Step 1: Access Bulk Import
- Go to Teacher Dashboard → Courses
- Click "Bulk Import Courses" button

#### Step 2: Choose Import Method
- **Upload JSON File**: Upload a prepared JSON file
- **Manual Entry**: Paste JSON directly into the text area

#### Step 3: Download Template (Optional)
- Click "Download Template" to get a sample structure
- Modify the template with your course data

#### Step 4: Validate Data
- Click "Validate" to check your data before creation
- Fix any validation errors shown

#### Step 5: Create Courses
- Click "Create Courses" to import all courses
- Review the results and any errors

### 2. Using the Sample Generator

#### Step 1: Generate Sample Courses
- Click "Generate Sample Courses" button
- Configure course templates (title, modules, lessons, content type)
- Click "Generate Courses"

#### Step 2: Download Generated Data
- Review the generated courses
- Click "Download JSON" to save the file
- Use this file for bulk import

### 3. Programmatic Usage

```typescript
import { BulkCoursesAPI } from '@/services/bulk-courses/api'

// Get template
const template = await BulkCoursesAPI.getTemplate()

// Validate courses
const validation = await BulkCoursesAPI.validateBulkCourses(courses)

// Create courses
const result = await BulkCoursesAPI.createBulkCourses(courses)
```

## Error Handling

### Validation Errors
- **Missing Fields**: Required fields like title, modules, lessons
- **Invalid Content Types**: Must be one of: video, text, file, quiz, assignment
- **Invalid Data**: Malformed JSON or incorrect data types

### Creation Errors
- **Database Errors**: Issues with database operations
- **Permission Errors**: Unauthorized access attempts
- **System Limits**: Exceeding maximum batch size (50 courses)

### Error Response Format
```json
{
  "success": false,
  "summary": {
    "total": 5,
    "created": 3,
    "errors": 2
  },
  "results": [...],
  "errors": [
    {
      "index": 1,
      "course": "Course Title",
      "module": "Module Title",
      "lesson": "Lesson Title",
      "error": "Error description"
    }
  ]
}
```

## Best Practices

### 1. Data Preparation
- **Start Small**: Test with 2-3 courses first
- **Validate First**: Always validate before creating
- **Backup Data**: Keep original data files safe
- **Use Templates**: Start with provided templates

### 2. Content Organization
- **Logical Order**: Use proper order_index values
- **Descriptive Titles**: Clear, descriptive titles for courses, modules, and lessons
- **Consistent Naming**: Follow consistent naming conventions
- **Content Quality**: Ensure all content is properly formatted

### 3. Performance Considerations
- **Batch Size**: Keep batches under 50 courses
- **Content Size**: Large video files should use external URLs
- **Validation**: Validate data before large imports
- **Testing**: Test with sample data first

## Troubleshooting

### Common Issues

#### 1. "Missing Token" Error
- **Cause**: Not authenticated
- **Solution**: Log in as a teacher

#### 2. "Invalid JSON" Error
- **Cause**: Malformed JSON file
- **Solution**: Validate JSON syntax, use provided template

#### 3. "Validation Failed" Error
- **Cause**: Missing required fields or invalid data
- **Solution**: Check validation results and fix errors

#### 4. "Database Error" During Creation
- **Cause**: Database constraint violations or connection issues
- **Solution**: Check error details, ensure unique titles, retry

### Getting Help

1. **Check Validation Results**: Always validate before creating
2. **Review Error Messages**: Detailed error messages help identify issues
3. **Use Sample Generator**: Generate sample data to test the system
4. **Start Small**: Test with 1-2 courses before large imports

## Examples

### Complete Example: Programming Course
```json
{
  "courses": [
    {
      "title": "Introduction to Python Programming",
      "description": "Learn Python from scratch with hands-on projects",
      "course_mode": "normal",
      "status": "draft",
      "modules": [
        {
          "title": "Module 1: Python Basics",
          "description": "Learn the fundamentals of Python programming",
          "order_index": 1,
          "lessons": [
            {
              "title": "Lesson 1: Installing Python",
              "description": "Set up your Python development environment",
              "order_index": 1,
              "content_type": "video",
              "content": {
                "video": {
                  "url": "https://example.com/python-install.mp4",
                  "source": "upload",
                  "description": "Step-by-step Python installation guide"
                }
              }
            },
            {
              "title": "Lesson 2: Your First Program",
              "description": "Write and run your first Python program",
              "order_index": 2,
              "content_type": "text",
              "content": {
                "text": {
                  "content": "# Your First Python Program\n\nLet's start with the classic 'Hello World' program:\n\n```python\nprint('Hello, World!')\n```\n\nThis simple program demonstrates the basic syntax of Python."
                }
              }
            },
            {
              "title": "Lesson 3: Python Basics Quiz",
              "description": "Test your understanding of Python basics",
              "order_index": 3,
              "content_type": "quiz",
              "content": {
                "quiz": {
                  "questions": [
                    {
                      "question": "What is the correct way to print 'Hello World' in Python?",
                      "type": "multiple_choice",
                      "options": [
                        "echo 'Hello World'",
                        "print('Hello World')",
                        "console.log('Hello World')",
                        "printf('Hello World')"
                      ],
                      "correct_answer": "print('Hello World')",
                      "points": 10
                    }
                  ],
                  "time_limit": 15,
                  "passing_score": 80
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

This system provides a powerful and flexible way to create multiple courses efficiently while maintaining data integrity and providing comprehensive error handling.
