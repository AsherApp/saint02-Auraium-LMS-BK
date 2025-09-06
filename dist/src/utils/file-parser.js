import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
// Parse Excel file
export async function parseExcelFile(buffer) {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const courses = [];
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) {
            throw new Error('Excel file must have at least a header row and one data row');
        }
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);
        // Group rows by course
        const courseGroups = new Map();
        for (const row of dataRows) {
            if (!row[0])
                continue; // Skip empty rows
            const courseTitle = row[0];
            if (!courseGroups.has(courseTitle)) {
                courseGroups.set(courseTitle, []);
            }
            courseGroups.get(courseTitle).push(row);
        }
        // Convert each course group to CourseData
        for (const [courseTitle, rows] of courseGroups) {
            const course = convertRowsToCourseData(courseTitle, rows, headers);
            courses.push(course);
        }
        return courses;
    }
    catch (error) {
        throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Parse CSV file
export async function parseCSVFile(buffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());
        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
            try {
                const courses = convertCSVToCourseData(results);
                resolve(courses);
            }
            catch (error) {
                reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        })
            .on('error', (error) => {
            reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        });
    });
}
// Convert CSV rows to CourseData
function convertCSVToCourseData(rows) {
    const courseGroups = new Map();
    for (const row of rows) {
        if (!row.course_title)
            continue;
        const courseTitle = row.course_title;
        if (!courseGroups.has(courseTitle)) {
            courseGroups.set(courseTitle, []);
        }
        courseGroups.get(courseTitle).push(row);
    }
    const courses = [];
    for (const [courseTitle, courseRows] of courseGroups) {
        const course = convertCSVRowsToCourseData(courseTitle, courseRows);
        courses.push(course);
    }
    return courses;
}
// Convert CSV rows to CourseData
function convertCSVRowsToCourseData(courseTitle, rows) {
    const firstRow = rows[0];
    const course = {
        title: courseTitle,
        description: firstRow.course_description || '',
        status: firstRow.course_status || 'draft',
        visibility: firstRow.course_visibility || 'private',
        enrollment_policy: firstRow.enrollment_policy || 'invite_only',
        modules: []
    };
    // Group rows by module
    const moduleGroups = new Map();
    for (const row of rows) {
        if (!row.module_title)
            continue;
        const moduleTitle = row.module_title;
        if (!moduleGroups.has(moduleTitle)) {
            moduleGroups.set(moduleTitle, []);
        }
        moduleGroups.get(moduleTitle).push(row);
    }
    // Convert modules
    let moduleIndex = 0;
    for (const [moduleTitle, moduleRows] of moduleGroups) {
        const firstModuleRow = moduleRows[0];
        const module = {
            title: moduleTitle,
            description: firstModuleRow.module_description || '',
            order_index: moduleIndex++,
            lessons: []
        };
        // Convert lessons
        let lessonIndex = 0;
        for (const row of moduleRows) {
            if (!row.lesson_title)
                continue;
            const lesson = {
                title: row.lesson_title,
                description: row.lesson_description || '',
                type: row.lesson_type || 'text',
                content: row.lesson_content || '',
                duration: parseInt(row.lesson_duration) || 0,
                points: parseInt(row.lesson_points) || 0,
                order_index: lessonIndex++,
                quiz_questions: []
            };
            // Add quiz questions if present
            if (row.quiz_question && row.quiz_question.trim()) {
                const quizQuestion = {
                    question: row.quiz_question,
                    type: row.quiz_type || 'multiple-choice',
                    options: row.quiz_options ? row.quiz_options.split('|') : [],
                    correct_answer: row.correct_answer || '',
                    points: parseInt(row.quiz_points) || 1
                };
                lesson.quiz_questions.push(quizQuestion);
            }
            module.lessons.push(lesson);
        }
        course.modules.push(module);
    }
    return course;
}
// Convert Excel rows to CourseData
function convertRowsToCourseData(courseTitle, rows, headers) {
    const firstRow = rows[0];
    const course = {
        title: courseTitle,
        description: getValueByHeader(firstRow, headers, 'course_description') || '',
        status: getValueByHeader(firstRow, headers, 'course_status') || 'draft',
        visibility: getValueByHeader(firstRow, headers, 'course_visibility') || 'private',
        enrollment_policy: getValueByHeader(firstRow, headers, 'enrollment_policy') || 'invite_only',
        modules: []
    };
    // Group rows by module
    const moduleGroups = new Map();
    for (const row of rows) {
        const moduleTitle = getValueByHeader(row, headers, 'module_title');
        if (!moduleTitle)
            continue;
        if (!moduleGroups.has(moduleTitle)) {
            moduleGroups.set(moduleTitle, []);
        }
        moduleGroups.get(moduleTitle).push(row);
    }
    // Convert modules
    let moduleIndex = 0;
    for (const [moduleTitle, moduleRows] of moduleGroups) {
        const firstModuleRow = moduleRows[0];
        const module = {
            title: moduleTitle,
            description: getValueByHeader(firstModuleRow, headers, 'module_description') || '',
            order_index: moduleIndex++,
            lessons: []
        };
        // Convert lessons
        let lessonIndex = 0;
        for (const row of moduleRows) {
            const lessonTitle = getValueByHeader(row, headers, 'lesson_title');
            if (!lessonTitle)
                continue;
            const lesson = {
                title: lessonTitle,
                description: getValueByHeader(row, headers, 'lesson_description') || '',
                type: getValueByHeader(row, headers, 'lesson_type') || 'text',
                content: getValueByHeader(row, headers, 'lesson_content') || '',
                duration: parseInt(getValueByHeader(row, headers, 'lesson_duration')) || 0,
                points: parseInt(getValueByHeader(row, headers, 'lesson_points')) || 0,
                order_index: lessonIndex++,
                quiz_questions: []
            };
            // Add quiz questions if present
            const quizQuestion = getValueByHeader(row, headers, 'quiz_question');
            if (quizQuestion && quizQuestion.trim()) {
                const quizQuestionData = {
                    question: quizQuestion,
                    type: getValueByHeader(row, headers, 'quiz_type') || 'multiple-choice',
                    options: getValueByHeader(row, headers, 'quiz_options') ? getValueByHeader(row, headers, 'quiz_options').split('|') : [],
                    correct_answer: getValueByHeader(row, headers, 'correct_answer') || '',
                    points: parseInt(getValueByHeader(row, headers, 'quiz_points')) || 1
                };
                lesson.quiz_questions.push(quizQuestionData);
            }
            module.lessons.push(lesson);
        }
        course.modules.push(module);
    }
    return course;
}
// Helper function to get value by header name
function getValueByHeader(row, headers, headerName) {
    const index = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
    return index >= 0 ? (row[index] || '').toString() : '';
}
// Generate Excel template
export function generateExcelTemplate() {
    const templateData = [
        // Headers
        [
            'course_title', 'course_description', 'course_status', 'course_visibility', 'enrollment_policy',
            'module_title', 'module_description', 'module_order',
            'lesson_title', 'lesson_description', 'lesson_type', 'lesson_content', 'lesson_duration', 'lesson_points', 'lesson_order',
            'quiz_question', 'quiz_type', 'quiz_options', 'correct_answer', 'quiz_points'
        ],
        // Sample data
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Getting Started', 'Introduction to programming concepts', '1',
            'What is Programming?', 'Understanding programming basics', 'text', 'Programming is the process of creating instructions for computers...', '10', '5', '1',
            'What is programming?', 'multiple-choice', 'Creating instructions for computers|Writing documents|Drawing pictures|Making music', 'Creating instructions for computers', '2'
        ],
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Getting Started', 'Introduction to programming concepts', '1',
            'Programming Languages', 'Overview of different programming languages', 'video', 'https://example.com/video1.mp4', '15', '10', '2',
            'Which is a programming language?', 'multiple-choice', 'Python|English|Spanish|French', 'Python', '3'
        ],
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Variables and Data Types', 'Understanding variables and data types', '2',
            'What are Variables?', 'Introduction to variables', 'text', 'Variables are containers for storing data...', '12', '8', '1',
            'Variables store data', 'true-false', '', 'true', '2'
        ]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Course Template');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
// Generate CSV template
export function generateCSVTemplate() {
    const headers = [
        'course_title', 'course_description', 'course_status', 'course_visibility', 'enrollment_policy',
        'module_title', 'module_description', 'module_order',
        'lesson_title', 'lesson_description', 'lesson_type', 'lesson_content', 'lesson_duration', 'lesson_points', 'lesson_order',
        'quiz_question', 'quiz_type', 'quiz_options', 'correct_answer', 'quiz_points'
    ];
    const sampleData = [
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Getting Started', 'Introduction to programming concepts', '1',
            'What is Programming?', 'Understanding programming basics', 'text', 'Programming is the process of creating instructions for computers...', '10', '5', '1',
            'What is programming?', 'multiple-choice', 'Creating instructions for computers|Writing documents|Drawing pictures|Making music', 'Creating instructions for computers', '2'
        ],
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Getting Started', 'Introduction to programming concepts', '1',
            'Programming Languages', 'Overview of different programming languages', 'video', 'https://example.com/video1.mp4', '15', '10', '2',
            'Which is a programming language?', 'multiple-choice', 'Python|English|Spanish|French', 'Python', '3'
        ],
        [
            'Introduction to Programming', 'Learn the basics of programming', 'published', 'private', 'invite_only',
            'Variables and Data Types', 'Understanding variables and data types', '2',
            'What are Variables?', 'Introduction to variables', 'text', 'Variables are containers for storing data...', '12', '8', '1',
            'Variables store data', 'true-false', '', 'true', '2'
        ]
    ];
    const csvContent = [
        headers.join(','),
        ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    return csvContent;
}
// Validate course data
export function validateCourseData(courses) {
    const errors = [];
    if (!courses || courses.length === 0) {
        errors.push('No courses found in file');
        return { isValid: false, errors };
    }
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const coursePrefix = `Course ${i + 1}`;
        if (!course.title || course.title.trim() === '') {
            errors.push(`${coursePrefix}: Title is required`);
        }
        if (!course.modules || course.modules.length === 0) {
            errors.push(`${coursePrefix}: At least one module is required`);
        }
        for (let j = 0; j < course.modules.length; j++) {
            const module = course.modules[j];
            const modulePrefix = `${coursePrefix}, Module ${j + 1}`;
            if (!module.title || module.title.trim() === '') {
                errors.push(`${modulePrefix}: Title is required`);
            }
            if (!module.lessons || module.lessons.length === 0) {
                errors.push(`${modulePrefix}: At least one lesson is required`);
            }
            for (let k = 0; k < module.lessons.length; k++) {
                const lesson = module.lessons[k];
                const lessonPrefix = `${modulePrefix}, Lesson ${k + 1}`;
                if (!lesson.title || lesson.title.trim() === '') {
                    errors.push(`${lessonPrefix}: Title is required`);
                }
                if (!lesson.type || !['video', 'text', 'quiz', 'assignment'].includes(lesson.type)) {
                    errors.push(`${lessonPrefix}: Valid lesson type is required (video, text, quiz, assignment)`);
                }
                if (lesson.duration < 0) {
                    errors.push(`${lessonPrefix}: Duration must be a positive number`);
                }
                if (lesson.points < 0) {
                    errors.push(`${lessonPrefix}: Points must be a positive number`);
                }
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
