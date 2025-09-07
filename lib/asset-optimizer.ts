// Asset optimization utilities to reduce bundle size and improve performance

// Image optimization
export const optimizeImage = (src: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  blur?: boolean
} = {}) => {
  const { width, height, quality = 80, format = 'webp', blur = false } = options
  
  // For external images, use a proxy service or return original
  if (src.startsWith('http')) {
    return src
  }
  
  // For local images, we can optimize them
  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  if (quality) params.set('q', quality.toString())
  if (format) params.set('f', format)
  if (blur) params.set('blur', '1')
  
  return params.toString() ? `${src}?${params.toString()}` : src
}

// Lazy loading for images
export const createLazyImage = (src: string, alt: string, className?: string) => {
  return {
    src,
    alt,
    className,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }
}

// Preload critical images
export const preloadImage = (src: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  }
}

// Optimize CSS classes
export const optimizeClasses = (classes: string[]) => {
  // Remove duplicates and sort for better compression
  return [...new Set(classes)].sort().join(' ')
}

// Bundle size optimization
export const createChunkOptimizer = () => {
  const chunks = new Map<string, any>()
  
  return {
    addChunk: (name: string, component: any) => {
      chunks.set(name, component)
    },
    getChunk: (name: string) => {
      return chunks.get(name)
    },
    removeChunk: (name: string) => {
      chunks.delete(name)
    },
    clearChunks: () => {
      chunks.clear()
    }
  }
}

// Memory optimization
export const createMemoryOptimizer = () => {
  const cache = new Map<string, any>()
  const maxSize = 100 // Maximum number of items in cache
  
  return {
    get: (key: string) => {
      return cache.get(key)
    },
    set: (key: string, value: any) => {
      if (cache.size >= maxSize) {
        // Remove oldest item
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
      cache.set(key, value)
    },
    clear: () => {
      cache.clear()
    },
    size: () => cache.size
  }
}

// Performance monitoring
export const createPerformanceMonitor = () => {
  const metrics = new Map<string, number>()
  
  return {
    start: (name: string) => {
      metrics.set(name, performance.now())
    },
    end: (name: string) => {
      const start = metrics.get(name)
      if (start) {
        const duration = performance.now() - start
        metrics.set(name, duration)
        return duration
      }
      return 0
    },
    getMetric: (name: string) => {
      return metrics.get(name)
    },
    getAllMetrics: () => {
      return Object.fromEntries(metrics)
    },
    clear: () => {
      metrics.clear()
    }
  }
}

// Resource hints
export const addResourceHints = (resources: Array<{
  href: string
  as: 'script' | 'style' | 'image' | 'font' | 'fetch'
  rel: 'preload' | 'prefetch' | 'dns-prefetch' | 'preconnect'
}>) => {
  if (typeof window !== 'undefined') {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.href = resource.href
      link.as = resource.as
      link.rel = resource.rel
      document.head.appendChild(link)
    })
  }
}

// Critical resource preloading
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/fonts/inter.woff2', as: 'font', rel: 'preload' as const },
    { href: '/icons/sprite.svg', as: 'image', rel: 'preload' as const },
  ]
  
  addResourceHints(criticalResources)
}

// Bundle splitting strategy
export const createBundleSplitter = () => {
  const bundles = {
    vendor: ['react', 'react-dom', 'next'],
    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
    charts: ['recharts'],
    animations: ['framer-motion'],
    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
    utils: ['date-fns', 'clsx', 'tailwind-merge'],
  }
  
  return {
    getBundle: (dependency: string) => {
      for (const [bundleName, deps] of Object.entries(bundles)) {
        if (deps.some(dep => dependency.includes(dep))) {
          return bundleName
        }
      }
      return 'main'
    },
    getBundles: () => bundles
  }
}

// Tree shaking optimization
export const optimizeImports = (imports: Record<string, string[]>) => {
  const optimized = {}
  
  Object.entries(imports).forEach(([module, exports]) => {
    // Only import what's actually used
    optimized[module] = exports.filter(exp => {
      // This would be determined by static analysis in a real implementation
      return true
    })
  })
  
  return optimized
}

// Code splitting utilities
export const createCodeSplitter = () => {
  const splits = new Map<string, () => Promise<any>>()
  
  return {
    addSplit: (name: string, loader: () => Promise<any>) => {
      splits.set(name, loader)
    },
    loadSplit: async (name: string) => {
      const loader = splits.get(name)
      if (loader) {
        return await loader()
      }
      throw new Error(`Split "${name}" not found`)
    },
    preloadSplit: (name: string) => {
      const loader = splits.get(name)
      if (loader) {
        // Start loading but don't wait for it
        loader()
      }
    }
  }
}

// Compression utilities
export const createCompressor = () => {
  return {
    compress: (data: string) => {
      // Simple compression - in real implementation, use proper compression
      return data.replace(/\s+/g, ' ').trim()
    },
    decompress: (data: string) => {
      return data
    }
  }
}

// Cache optimization
export const createCacheOptimizer = () => {
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  return {
    set: (key: string, data: any, ttl: number = 300000) => { // 5 minutes default
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
    },
    get: (key: string) => {
      const item = cache.get(key)
      if (item) {
        if (Date.now() - item.timestamp > item.ttl) {
          cache.delete(key)
          return null
        }
        return item.data
      }
      return null
    },
    clear: () => {
      cache.clear()
    },
    cleanup: () => {
      const now = Date.now()
      for (const [key, item] of cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          cache.delete(key)
        }
      }
    }
  }
}

// Export all utilities
export const AssetOptimizer = {
  optimizeImage,
  createLazyImage,
  preloadImage,
  optimizeClasses,
  createChunkOptimizer,
  createMemoryOptimizer,
  createPerformanceMonitor,
  addResourceHints,
  preloadCriticalResources,
  createBundleSplitter,
  optimizeImports,
  createCodeSplitter,
  createCompressor,
  createCacheOptimizer
}

export default AssetOptimizer
