// Database query optimization utilities to reduce data transfer and improve performance

// Query optimization strategies
export const QueryOptimizer = {
  // Select only needed fields
  selectFields: (fields: string[]) => {
    return fields.join(', ')
  },

  // Add pagination to queries
  paginate: (page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit
    return { limit, offset }
  },

  // Add sorting
  sort: (field: string, direction: 'asc' | 'desc' = 'asc') => {
    return { field, direction }
  },

  // Add filtering
  filter: (filters: Record<string, any>) => {
    return filters
  },

  // Optimize joins
  optimizeJoins: (joins: string[]) => {
    // Remove unnecessary joins and optimize order
    return joins.filter(join => join.trim()).slice(0, 5) // Limit to 5 joins max
  },

  // Add caching hints
  cache: (ttl: number = 300) => { // 5 minutes default
    return { ttl }
  }
}

// Query builder for common patterns
export class OptimizedQueryBuilder {
  private query: {
    select: string[]
    from: string
    joins: string[]
    where: Record<string, any>
    orderBy: { field: string; direction: 'asc' | 'desc' }[]
    limit?: number
    offset?: number
    cache?: { ttl: number }
  }

  constructor() {
    this.query = {
      select: [],
      from: '',
      joins: [],
      where: {},
      orderBy: [],
    }
  }

  select(fields: string[]) {
    this.query.select = fields
    return this
  }

  from(table: string) {
    this.query.from = table
    return this
  }

  join(join: string) {
    this.query.joins.push(join)
    return this
  }

  where(conditions: Record<string, any>) {
    this.query.where = { ...this.query.where, ...conditions }
    return this
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.query.orderBy.push({ field, direction })
    return this
  }

  limit(count: number) {
    this.query.limit = count
    return this
  }

  offset(count: number) {
    this.query.offset = count
    return this
  }

  cache(ttl: number = 300) {
    this.query.cache = { ttl }
    return this
  }

  build() {
    return this.query
  }
}

// Common optimized queries
export const OptimizedQueries = {
  // Get user with minimal data
  getUserMinimal: (userId: string) => {
    return new OptimizedQueryBuilder()
      .select(['id', 'email', 'first_name', 'last_name', 'role'])
      .from('users')
      .where({ id: userId })
      .cache(600) // 10 minutes
      .build()
  },

  // Get courses with basic info
  getCoursesBasic: (teacherId: string, page: number = 1) => {
    const { limit, offset } = QueryOptimizer.paginate(page, 20)
    return new OptimizedQueryBuilder()
      .select(['id', 'title', 'status', 'created_at', 'enrollment_count'])
      .from('courses')
      .where({ teacher_email: teacherId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .cache(300) // 5 minutes
      .build()
  },

  // Get student progress summary
  getStudentProgressSummary: (studentId: string) => {
    return new OptimizedQueryBuilder()
      .select([
        'course_id',
        'progress_percentage',
        'last_accessed_at',
        'completed_lessons',
        'total_lessons'
      ])
      .from('student_progress')
      .where({ student_email: studentId })
      .cache(180) // 3 minutes
      .build()
  },

  // Get assignments with minimal data
  getAssignmentsMinimal: (courseId: string) => {
    return new OptimizedQueryBuilder()
      .select(['id', 'title', 'due_date', 'status', 'type'])
      .from('assignments')
      .where({ course_id: courseId })
      .orderBy('due_date', 'asc')
      .cache(300) // 5 minutes
      .build()
  },

  // Get recent activities
  getRecentActivities: (userId: string, limit: number = 10) => {
    return new OptimizedQueryBuilder()
      .select(['id', 'type', 'description', 'created_at'])
      .from('activities')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .cache(60) // 1 minute
      .build()
  }
}

// Data transformation utilities
export const DataTransformer = {
  // Transform user data to minimal format
  transformUserMinimal: (user: any) => {
    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      avatar: user.avatar_url || null
    }
  },

  // Transform course data to basic format
  transformCourseBasic: (course: any) => {
    return {
      id: course.id,
      title: course.title,
      status: course.status,
      createdAt: course.created_at,
      enrollmentCount: course.enrollment_count || 0,
      thumbnail: course.thumbnail_url || null
    }
  },

  // Transform assignment data to minimal format
  transformAssignmentMinimal: (assignment: any) => {
    return {
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.due_date,
      status: assignment.status,
      type: assignment.type,
      points: assignment.points || 0
    }
  },

  // Transform progress data
  transformProgress: (progress: any) => {
    return {
      courseId: progress.course_id,
      percentage: progress.progress_percentage || 0,
      lastAccessed: progress.last_accessed_at,
      completedLessons: progress.completed_lessons || 0,
      totalLessons: progress.total_lessons || 0
    }
  }
}

// Cache management
export const CacheManager = {
  // Cache keys
  keys: {
    user: (id: string) => `user:${id}`,
    courses: (teacherId: string, page: number) => `courses:${teacherId}:${page}`,
    progress: (studentId: string) => `progress:${studentId}`,
    assignments: (courseId: string) => `assignments:${courseId}`,
    activities: (userId: string) => `activities:${userId}`
  },

  // Cache TTL in seconds
  ttl: {
    user: 600, // 10 minutes
    courses: 300, // 5 minutes
    progress: 180, // 3 minutes
    assignments: 300, // 5 minutes
    activities: 60 // 1 minute
  },

  // Invalidate cache
  invalidate: (pattern: string) => {
    // Implementation would depend on your cache system (Redis, etc.)
    console.log(`Invalidating cache pattern: ${pattern}`)
  }
}

// Query performance monitoring
export const QueryMonitor = {
  // Track query performance
  track: (queryName: string, startTime: number, endTime: number) => {
    const duration = endTime - startTime
    console.log(`Query "${queryName}" took ${duration}ms`)
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: "${queryName}" took ${duration}ms`)
    }
  },

  // Get query statistics
  getStats: () => {
    // Implementation would track and return query statistics
    return {
      totalQueries: 0,
      averageTime: 0,
      slowQueries: 0
    }
  }
}

// Batch operations
export const BatchOperations = {
  // Batch insert
  batchInsert: (table: string, data: any[], batchSize: number = 100) => {
    const batches = []
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize))
    }
    return batches
  },

  // Batch update
  batchUpdate: (table: string, updates: any[], batchSize: number = 50) => {
    const batches = []
    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize))
    }
    return batches
  }
}

// Connection pooling optimization
export const ConnectionPool = {
  // Pool configuration
  config: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Get connection
  getConnection: () => {
    // Implementation would get connection from pool
    return null
  },

  // Release connection
  releaseConnection: (connection: any) => {
    // Implementation would release connection back to pool
  }
}

// Export all utilities
export const DatabaseOptimizer = {
  QueryOptimizer,
  OptimizedQueryBuilder,
  OptimizedQueries,
  DataTransformer,
  CacheManager,
  QueryMonitor,
  BatchOperations,
  ConnectionPool
}

export default DatabaseOptimizer
