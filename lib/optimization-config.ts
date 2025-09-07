// Comprehensive optimization configuration for the LMS system

export const OptimizationConfig = {
  // Bundle optimization
  bundle: {
    // Enable tree shaking
    treeShaking: true,
    
    // Enable code splitting
    codeSplitting: true,
    
    // Chunk size limits
    maxChunkSize: 244 * 1024, // 244KB
    
    // Enable compression
    compression: true,
    
    // Minification
    minification: {
      enabled: true,
      removeConsole: process.env.NODE_ENV === 'production',
      removeDebugger: process.env.NODE_ENV === 'production'
    }
  },

  // Image optimization
  images: {
    // Enable WebP format
    webp: true,
    
    // Enable AVIF format (for modern browsers)
    avif: true,
    
    // Default quality
    quality: 80,
    
    // Lazy loading
    lazyLoading: true,
    
    // Responsive images
    responsive: true,
    
    // Placeholder blur
    blurPlaceholder: true
  },

  // Font optimization
  fonts: {
    // Preload critical fonts
    preload: ['Inter', 'Geist'],
    
    // Font display strategy
    display: 'swap',
    
    // Subset fonts
    subset: true
  },

  // CSS optimization
  css: {
    // Purge unused CSS
    purge: true,
    
    // Minify CSS
    minify: true,
    
    // Critical CSS
    critical: true,
    
    // CSS modules
    modules: false
  },

  // JavaScript optimization
  javascript: {
    // Enable SWC minification
    swcMinify: true,
    
    // Remove unused code
    deadCodeElimination: true,
    
    // Optimize imports
    optimizeImports: true,
    
    // Bundle analysis
    analyze: process.env.ANALYZE === 'true'
  },

  // Database optimization
  database: {
    // Query optimization
    queryOptimization: true,
    
    // Connection pooling
    connectionPooling: true,
    
    // Query caching
    queryCaching: true,
    
    // Batch operations
    batchOperations: true,
    
    // Pagination
    pagination: {
      defaultLimit: 20,
      maxLimit: 100
    }
  },

  // API optimization
  api: {
    // Response compression
    compression: true,
    
    // Request caching
    caching: true,
    
    // Rate limiting
    rateLimiting: true,
    
    // Request batching
    batching: true,
    
    // Response pagination
    pagination: true
  },

  // Caching strategy
  caching: {
    // Browser caching
    browser: {
      static: '1y',
      dynamic: '1h'
    },
    
    // CDN caching
    cdn: {
      static: '1y',
      dynamic: '1h'
    },
    
    // API caching
    api: {
      user: '10m',
      courses: '5m',
      progress: '3m',
      assignments: '5m',
      activities: '1m'
    }
  },

  // Performance monitoring
  performance: {
    // Enable monitoring
    enabled: true,
    
    // Core Web Vitals
    coreWebVitals: true,
    
    // Bundle analysis
    bundleAnalysis: process.env.ANALYZE === 'true',
    
    // Performance budgets
    budgets: {
      js: '250kb',
      css: '50kb',
      images: '500kb',
      fonts: '100kb'
    }
  },

  // Lazy loading
  lazyLoading: {
    // Components
    components: [
      'BulkCourseImport',
      'BulkCourseGenerator',
      'AssignmentCreator',
      'PerformanceChart',
      'AnalyticsChart',
      'LiveVideoPlayer',
      'DocumentViewer',
      'Calendar',
      'DataTable',
      'RichTextEditor',
      'CodeEditor'
    ],
    
    // Routes
    routes: [
      '/teacher/courses/new',
      '/teacher/assignments',
      '/teacher/performance',
      '/student/performance',
      '/student/calendar'
    ],
    
    // Images
    images: true,
    
    // Videos
    videos: true
  },

  // Preloading strategy
  preloading: {
    // Critical resources
    critical: [
      '/fonts/inter.woff2',
      '/icons/sprite.svg',
      '/api/user/profile'
    ],
    
    // Route preloading
    routes: [
      '/teacher/dashboard',
      '/student/dashboard',
      '/teacher/courses',
      '/student/courses'
    ],
    
    // Component preloading
    components: [
      'CourseCard',
      'AssignmentCard',
      'ProgressChart'
    ]
  },

  // Service Worker
  serviceWorker: {
    // Enable service worker
    enabled: true,
    
    // Cache strategy
    cacheStrategy: 'staleWhileRevalidate',
    
    // Offline support
    offline: true,
    
    // Background sync
    backgroundSync: true
  },

  // CDN configuration
  cdn: {
    // Enable CDN
    enabled: true,
    
    // Static assets
    static: {
      images: true,
      fonts: true,
      icons: true
    },
    
    // Dynamic content
    dynamic: {
      api: false,
      pages: false
    }
  },

  // Security optimizations
  security: {
    // Content Security Policy
    csp: true,
    
    // Subresource Integrity
    sri: true,
    
    // HTTPS redirect
    httpsRedirect: true,
    
    // Security headers
    headers: true
  },

  // Development optimizations
  development: {
    // Hot reload
    hotReload: true,
    
    // Source maps
    sourceMaps: true,
    
    // Dev tools
    devTools: true,
    
    // Fast refresh
    fastRefresh: true
  },

  // Production optimizations
  production: {
    // Remove source maps
    sourceMaps: false,
    
    // Remove dev tools
    devTools: false,
    
    // Enable compression
    compression: true,
    
    // Enable caching
    caching: true,
    
    // Enable monitoring
    monitoring: true
  }
}

// Environment-specific configurations
export const getOptimizationConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    ...OptimizationConfig,
    // Override with environment-specific settings
    ...(isProduction && OptimizationConfig.production),
    ...(isDevelopment && OptimizationConfig.development)
  }
}

// Bundle size limits
export const BundleLimits = {
  // JavaScript bundles
  js: {
    main: 250 * 1024, // 250KB
    vendor: 500 * 1024, // 500KB
    chunk: 244 * 1024 // 244KB
  },
  
  // CSS bundles
  css: {
    main: 50 * 1024, // 50KB
    vendor: 100 * 1024 // 100KB
  },
  
  // Image assets
  images: {
    max: 500 * 1024, // 500KB
    thumbnail: 50 * 1024, // 50KB
    avatar: 25 * 1024 // 25KB
  },
  
  // Font assets
  fonts: {
    max: 100 * 1024 // 100KB
  }
}

// Performance budgets
export const PerformanceBudgets = {
  // First Contentful Paint
  fcp: 1.8, // seconds
  
  // Largest Contentful Paint
  lcp: 2.5, // seconds
  
  // First Input Delay
  fid: 100, // milliseconds
  
  // Cumulative Layout Shift
  cls: 0.1, // score
  
  // Time to Interactive
  tti: 3.8, // seconds
  
  // Total Blocking Time
  tbt: 200 // milliseconds
}

// Export all configurations
export const OptimizationSettings = {
  config: OptimizationConfig,
  getConfig: getOptimizationConfig,
  limits: BundleLimits,
  budgets: PerformanceBudgets
}

export default OptimizationSettings
