import { http } from '@/services/http'

export interface StudentProgress {
  id: string;
  student_email: string;
  course_id: string;
  course_title?: string;
  module_id?: string;
  lesson_id?: string;
  type: 'lesson_completed' | 'quiz_passed' | 'assignment_submitted' | 'discussion_participated' | 'poll_responded';
  status: 'completed' | 'failed' | 'submitted' | 'in_progress';
  score: number;
  time_spent_seconds: number;
  lesson_title?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CourseCompletion {
  id: string;
  student_email: string;
  course_id: string;
  completion_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  total_assignments: number;
  completed_assignments: number;
  total_quizzes: number;
  passed_quizzes: number;
  average_grade: number;
  last_activity_at: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleCompletion {
  id: string;
  student_email: string;
  course_id: string;
  module_id: string;
  completion_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  total_assignments: number;
  completed_assignments: number;
  total_quizzes: number;
  passed_quizzes: number;
  last_activity_at: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentActivity {
  id: string;
  student_email: string;
  course_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TeacherStudentProgress {
  course_id: string;
  course_title: string;
  teacher_email: string;
  student_email: string;
  student_name: string;
  course_completion_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  total_assignments: number;
  completed_assignments: number;
  total_quizzes: number;
  passed_quizzes: number;
  average_grade: number;
  last_activity_at: string;
  started_at: string;
  completed_at?: string;
  total_activities: number;
  last_activity: string;
}

export interface CourseAnalytics {
  course: {
    id: string;
    title: string;
  };
  analytics: {
    totalStudents: number;
    completedStudents: number;
    inProgressStudents: number;
    notStartedStudents: number;
    averageCompletion: number;
    completionRate: number;
  };
  recentActivities: StudentActivity[];
}

export interface DetailedStudentProgress {
  student: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  courseCompletion?: CourseCompletion;
  moduleCompletions: ModuleCompletion[];
  activities: StudentActivity[];
  detailedProgress: StudentProgress[];
}

export class ProgressAPI {
  // Student Progress Methods

  static async getMyProgress(): Promise<StudentProgress[]> {
    const response = await http<StudentProgress[]>('/api/student-progress/my-progress');
    return response;
  }

  static async getCourseProgress(courseId: string): Promise<{
    courseCompletion?: CourseCompletion;
    moduleCompletions: ModuleCompletion[];
    activities: StudentActivity[];
    detailedProgress: StudentProgress[];
  }> {
    const response = await http<{
      courseCompletion?: CourseCompletion;
      moduleCompletions: ModuleCompletion[];
      activities: StudentActivity[];
      detailedProgress: StudentProgress[];
    }>(`/api/student-progress/course/${courseId}`);
    return response;
  }

  static async recordLessonCompletion(data: {
    courseId: string;
    moduleId?: string;
    lessonId: string;
    lessonTitle?: string;
    timeSpentSeconds?: number;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/lesson-completed', {
      method: 'POST',
      body: data
    });
    return response;
  }

  static async recordQuizCompletion(data: {
    courseId: string;
    moduleId?: string;
    quizId: string;
    score: number;
    passed: boolean;
    timeSpentSeconds?: number;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/quiz-completed', {
      method: 'POST',
      body: data
    });
    return response;
  }

  static async recordAssignmentSubmission(data: {
    courseId: string;
    moduleId?: string;
    assignmentId: string;
    timeSpentMinutes?: number;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/assignment-submitted', {
      method: 'POST',
      body: data
    });
    return response;
  }

  static async recordDiscussionParticipation(data: {
    courseId: string;
    moduleId?: string;
    discussionId: string;
    postId: string;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/discussion-participated', {
      method: 'POST',
      body: data
    });
    return response;
  }

  static async recordPollResponse(data: {
    courseId: string;
    moduleId?: string;
    pollId: string;
    responseId: string;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/poll-responded', {
      method: 'POST',
      body: data
    });
    return response;
  }

  static async recordPollParticipation(data: {
    courseId: string;
    moduleId?: string;
    lessonId: string;
    lessonTitle: string;
    pollQuestion: string;
    selectedOption: string;
  }): Promise<{ message: string; progress: StudentProgress }> {
    const response = await http<{ message: string; progress: StudentProgress }>('/api/student-progress/poll-participation', {
      method: 'POST',
      body: data
    });
    return response;
  }

  // Teacher Progress Methods

  static async getTeacherDashboard(courseId?: string): Promise<TeacherStudentProgress[]> {
    const url = courseId ? `/api/student-progress/teacher/dashboard?courseId=${courseId}` : '/api/student-progress/teacher/dashboard';
    const response = await http<TeacherStudentProgress[]>(url);
    return response;
  }

  static async getStudentProgressForTeacher(
    studentEmail: string,
    courseId: string
  ): Promise<DetailedStudentProgress> {
    const response = await http<DetailedStudentProgress>(`/api/student-progress/teacher/student/${studentEmail}/course/${courseId}`);
    return response;
  }

  static async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await http<CourseAnalytics>(`/api/student-progress/teacher/course/${courseId}/analytics`);
    return response;
  }

  // Utility Methods

  static getProgressTypeLabel(progressType: string): string {
    switch (progressType) {
      case 'lesson_completed':
        return 'Lesson Completed';
      case 'quiz_passed':
        return 'Quiz Completed';
      case 'assignment_submitted':
        return 'Assignment Submitted';
      case 'discussion_participated':
        return 'Discussion Participation';
      case 'poll_responded':
        return 'Poll Response';
      default:
        return 'Activity';
    }
  }

  static getProgressTypeIcon(progressType: string): string {
    switch (progressType) {
      case 'lesson_completed':
        return '📚';
      case 'quiz_passed':
        return '✅';
      case 'assignment_submitted':
        return '📝';
      case 'discussion_participated':
        return '💬';
      case 'poll_responded':
        return '📊';
      default:
        return '📋';
    }
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'submitted':
        return 'text-blue-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  static getCompletionPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  static formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
