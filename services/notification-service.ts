import { useNotificationStore } from "@/store/notification-store"

export class NotificationService {
  private static instance: NotificationService
  private notificationStore: any

  private constructor() {
    // Initialize store reference
    if (typeof window !== 'undefined') {
      this.notificationStore = useNotificationStore.getState()
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Update store reference when called from components
  public updateStore() {
    if (typeof window !== 'undefined') {
      this.notificationStore = useNotificationStore.getState()
    }
  }

  // Announcement notifications
  public newAnnouncement(announcement: any, courseTitle?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'announcement',
      title: 'New Announcement',
      message: announcement.message || 'A new announcement has been posted.',
      actionUrl: `/teacher/announcements`,
      metadata: {
        courseId: announcement.course_id,
        senderEmail: announcement.teacher_email,
        senderName: 'Teacher'
      }
    })
  }

  // Discussion notifications
  public newDiscussion(discussion: any, courseTitle?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'discussion',
      title: 'New Discussion',
      message: discussion.title || 'A new discussion has been started.',
      actionUrl: `/forum/discussion/${discussion.id}`,
      metadata: {
        courseId: discussion.course_id,
        senderEmail: discussion.created_by,
        senderName: 'Teacher'
      }
    })
  }

  public newDiscussionPost(post: any, discussionTitle?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'discussion',
      title: 'New Discussion Post',
      message: `New post in: ${discussionTitle || 'Discussion'}`,
      actionUrl: `/forum/discussion/${post.discussion_id}`,
      metadata: {
        discussionId: post.discussion_id,
        senderEmail: post.created_by,
        senderName: 'Student'
      }
    })
  }

  // Assignment notifications
  public newAssignment(assignment: any, courseTitle?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'assignment',
      title: 'New Assignment',
      message: assignment.title || 'A new assignment has been assigned.',
      actionUrl: `/student/assignments`,
      metadata: {
        courseId: assignment.course_id,
        assignmentId: assignment.id,
        senderEmail: assignment.created_by,
        senderName: 'Teacher'
      }
    })
  }

  public assignmentDueSoon(assignment: any, daysLeft: number) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'assignment',
      title: 'Assignment Due Soon',
      message: `${assignment.title} is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`,
      actionUrl: `/student/assignment/${assignment.id}`,
      metadata: {
        courseId: assignment.course_id,
        assignmentId: assignment.id
      }
    })
  }

  public assignmentSubmitted(assignment: any, studentName?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'assignment',
      title: 'Assignment Submitted',
      message: `${studentName || 'Student'} submitted: ${assignment.title}`,
      actionUrl: `/teacher/assignments`,
      metadata: {
        courseId: assignment.course_id,
        assignmentId: assignment.id,
        senderEmail: assignment.student_email,
        senderName: studentName || 'Student'
      }
    })
  }

  // Live class notifications
  public liveClassStarting(session: any, minutesLeft: number) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'live_class',
      title: 'Live Class Starting Soon',
      message: `${session.title} starts in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      actionUrl: `/live/${session.id}`,
      metadata: {
        courseId: session.course_id,
        senderEmail: session.host_email,
        senderName: 'Teacher'
      }
    })
  }

  public liveClassStarted(session: any) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'live_class',
      title: 'Live Class Started',
      message: `${session.title} is now live!`,
      actionUrl: `/live/${session.id}`,
      metadata: {
        courseId: session.course_id,
        senderEmail: session.host_email,
        senderName: 'Teacher'
      }
    })
  }

  // Message notifications
  public newMessage(message: any, senderName?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'message',
      title: 'New Message',
      message: message.content || 'You have received a new message.',
      actionUrl: `/messages`,
      metadata: {
        senderEmail: message.sender_email,
        senderName: senderName || 'User'
      }
    })
  }

  // System notifications
  public systemMessage(title: string, message: string, actionUrl?: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'system',
      title,
      message,
      actionUrl
    })
  }

  // Success notifications
  public success(title: string, message: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'system',
      title,
      message
    })
  }

  // Error notifications
  public error(title: string, message: string) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'system',
      title,
      message
    })
  }

  // Course notifications
  public courseEnrolled(course: any) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'system',
      title: 'Course Enrolled',
      message: `You have been enrolled in ${course.title}`,
      actionUrl: `/student/course/${course.id}`
    })
  }

  public courseCompleted(course: any) {
    this.updateStore()
    this.notificationStore?.addNotification({
      type: 'system',
      title: 'Course Completed',
      message: `Congratulations! You have completed ${course.title}`,
      actionUrl: `/student/course/${course.id}`
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Hook for easy access in components
export const useNotificationService = () => {
  return notificationService
}
