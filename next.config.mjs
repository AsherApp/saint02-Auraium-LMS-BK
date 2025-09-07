/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    webpackMemoryOptimizations: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Optimizations
  webpack: (config, { isServer, dev }) => {
    // Tree shaking optimization
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
    
    // Code splitting optimization
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        ui: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 20,
        },
        icons: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'icons',
          chunks: 'all',
          priority: 15,
        },
        charts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 15,
        },
        animations: {
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          name: 'animations',
          chunks: 'all',
          priority: 15,
        },
        forms: {
          test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
          name: 'forms',
          chunks: 'all',
          priority: 15,
        },
        utils: {
          test: /[\\/]node_modules[\\/](date-fns|clsx|tailwind-merge)[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 15,
        },
      },
    }
    
    return config
  },
  // Compression
  compress: true,
  // Enable experimental features
  poweredByHeader: false,
  // Enable static optimization
  trailingSlash: false,
}

export default nextConfig
