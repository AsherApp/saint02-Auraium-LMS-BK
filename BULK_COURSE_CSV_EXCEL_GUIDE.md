# 📊 Bulk Course Upload - CSV/Excel Support

## ✅ **New Features Added**

Your bulk course upload system now supports **multiple file formats**:

- ✅ **JSON** (original format)
- ✅ **CSV** (comma-separated values)
- ✅ **Excel** (.xlsx, .xls)

---

## 🚀 **How to Use**

### **1. Download Templates**

Choose from three template formats:

#### **Excel Template (.xlsx)**
- **Best for**: Complex course structures with multiple modules and lessons
- **Features**: Multiple sheets, rich formatting, easy data entry
- **Download**: Click "Excel Template" button

#### **CSV Template (.csv)**
- **Best for**: Simple course structures, easy to edit in any text editor
- **Features**: Lightweight, universal compatibility
- **Download**: Click "CSV Template" button

#### **JSON Template (.json)**
- **Best for**: Developers, programmatic course creation
- **Features**: Structured data, nested objects
- **Download**: Click "JSON Template" button

### **2. Upload Files**

1. **Click "Choose File"** button
2. **Select your file** (JSON, CSV, or Excel)
3. **System automatically detects** file type and parses accordingly
4. **Validation runs** to ensure data integrity
5. **Create courses** with one click

---

## 📋 **File Format Specifications**

### **CSV/Excel Column Structure**

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `course_title` | Course name | ✅ | "Introduction to Programming" |
| `course_description` | Course description | ❌ | "Learn programming basics" |
| `course_status` | Course status | ❌ | "published" or "draft" |
| `course_visibility` | Course visibility | ❌ | "private" or "public" |
| `enrollment_policy` | Enrollment policy | ❌ | "open" or "invite_only" |
| `module_title` | Module name | ✅ | "Getting Started" |
| `module_description` | Module description | ❌ | "Introduction module" |
| `module_order` | Module order | ❌ | 1, 2, 3... |
| `lesson_title` | Lesson name | ✅ | "What is Programming?" |
| `lesson_description` | Lesson description | ❌ | "Understanding basics" |
| `lesson_type` | Lesson type | ✅ | "video", "text", "quiz", "assignment" |
| `lesson_content` | Lesson content | ✅ | "Programming is..." or video URL |
| `lesson_duration` | Duration in minutes | ❌ | 10, 15, 30... |
| `lesson_points` | Points for completion | ❌ | 5, 10, 20... |
| `lesson_order` | Lesson order | ❌ | 1, 2, 3... |
| `quiz_question` | Quiz question | ❌ | "What is programming?" |
| `quiz_type` | Quiz type | ❌ | "multiple-choice", "true-false", "fill-blank" |
| `quiz_options` | Quiz options (separated by \|) | ❌ | "Option 1\|Option 2\|Option 3" |
| `correct_answer` | Correct answer | ❌ | "Option 1" |
| `quiz_points` | Quiz points | ❌ | 2, 5, 10... |

---

## 📝 **Example Data**

### **CSV Example**
```csv
course_title,course_description,course_status,module_title,lesson_title,lesson_type,lesson_content,lesson_duration,lesson_points
"Introduction to Programming","Learn programming basics","published","Getting Started","What is Programming?","text","Programming is the process of creating instructions for computers...",10,5
"Introduction to Programming","Learn programming basics","published","Getting Started","Programming Languages","video","https://example.com/video1.mp4",15,10
"Introduction to Programming","Learn programming basics","published","Variables","What are Variables?","text","Variables are containers for storing data...",12,8
```

### **Excel Example**
The Excel template includes:
- **Sample data** in the first few rows
- **Column headers** clearly labeled
- **Data validation** hints
- **Multiple courses** in one file

---

## 🔧 **Technical Details**

### **Supported File Types**
- **JSON**: `application/json`
- **CSV**: `text/csv`
- **Excel**: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### **File Size Limits**
- **Maximum file size**: 10MB
- **Recommended**: Under 5MB for best performance

### **Data Validation**
- ✅ **Required fields** checked
- ✅ **Data types** validated
- ✅ **Course structure** verified
- ✅ **Duplicate detection** (by title)
- ✅ **Content validation** (URLs, text length, etc.)

---

## 🎯 **Best Practices**

### **1. File Organization**
- **One course per file** for simple structures
- **Multiple courses per file** for complex structures
- **Consistent naming** for courses and modules

### **2. Data Quality**
- **Use descriptive titles** for courses, modules, and lessons
- **Include meaningful descriptions** for better user experience
- **Set appropriate durations** and points
- **Test quiz questions** before uploading

### **3. Content Guidelines**
- **Video URLs**: Use direct links or embeddable URLs
- **Text content**: Keep under 10,000 characters per lesson
- **Quiz options**: Separate with pipe (|) character
- **File paths**: Use relative paths or full URLs

---

## 🚨 **Common Issues & Solutions**

### **File Upload Errors**
- **"Invalid file type"**: Ensure file is JSON, CSV, or Excel
- **"File too large"**: Reduce file size or split into multiple files
- **"Parsing failed"**: Check file format and encoding

### **Validation Errors**
- **"Title is required"**: Ensure all courses, modules, and lessons have titles
- **"Invalid lesson type"**: Use only: video, text, quiz, assignment
- **"Invalid quiz type"**: Use only: multiple-choice, true-false, fill-blank

### **Data Issues**
- **"Duplicate course titles"**: Use unique titles for each course
- **"Invalid URLs"**: Check video and file URLs are accessible
- **"Missing content"**: Ensure all lessons have content

---

## 📊 **File Format Comparison**

| Feature | JSON | CSV | Excel |
|---------|------|-----|-------|
| **Complexity** | High | Low | Medium |
| **File Size** | Large | Small | Medium |
| **Editing** | Code editor | Text editor | Spreadsheet |
| **Validation** | Built-in | Manual | Built-in |
| **Best For** | Developers | Simple data | Complex data |

---

## 🎉 **Ready to Use!**

Your bulk course upload system now supports:

- ✅ **Multiple file formats** (JSON, CSV, Excel)
- ✅ **Template downloads** for all formats
- ✅ **Automatic file type detection**
- ✅ **Comprehensive validation**
- ✅ **Error handling and reporting**
- ✅ **Real-time progress tracking**

**Start creating courses in bulk with your preferred file format!** 🚀
