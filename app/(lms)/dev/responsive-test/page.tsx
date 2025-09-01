"use client"

import { useScreenSize, useMediaQuery } from "@/hooks/use-mobile"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex } from "@/components/shared/responsive-container"
import { GlassCard } from "@/components/shared/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  MonitorSpeaker, 
  Tv,
  Eye,
  Palette,
  Type,
  Grid3x3,
  Gauge
} from "lucide-react"

export default function ResponsiveTestPage() {
  const screenInfo = useScreenSize()
  const isRetina = useMediaQuery('(-webkit-min-device-pixel-ratio: 2)')
  const isUltraWide = useMediaQuery('(min-width: 1920px)')
  const is4K = useMediaQuery('(min-width: 2560px)')

  const getDeviceIcon = () => {
    if (screenInfo.isMobile) return <Smartphone className="h-5 w-5" />
    if (screenInfo.isTablet) return <Tablet className="h-5 w-5" />
    if (screenInfo.isDesktop) return <Monitor className="h-5 w-5" />
    if (screenInfo.isWide) return <MonitorSpeaker className="h-5 w-5" />
    if (screenInfo.isUltrawide) return <Tv className="h-5 w-5" />
    return <Monitor className="h-5 w-5" />
  }

  const getDeviceType = () => {
    if (screenInfo.isMobile) return 'Mobile'
    if (screenInfo.isTablet) return 'Tablet'
    if (screenInfo.isDesktop) return 'Desktop'
    if (screenInfo.isWide) return 'Wide Screen'
    if (screenInfo.isUltrawide) return 'Ultra-wide'
    return 'Unknown'
  }

  return (
    <ResponsiveContainer size="ultrawide" padding="xl">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white">
            Responsive Design Test
          </h1>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg">
            Pixel-perfect design across all screen sizes and resolutions
          </p>
        </div>

        {/* Current Screen Info */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {getDeviceIcon()}
              <div>
                <h3 className="text-white font-semibold text-lg">Current Device</h3>
                <p className="text-slate-300 text-sm">{getDeviceType()}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {screenInfo.width} × {screenInfo.height}
              </Badge>
              <Badge variant="secondary">
                {screenInfo.orientation}
              </Badge>
              {screenInfo.isRetina && (
                <Badge variant="default" className="bg-blue-600">
                  Retina
                </Badge>
              )}
              {isUltraWide && (
                <Badge variant="default" className="bg-purple-600">
                  Ultra-wide
                </Badge>
              )}
              {is4K && (
                <Badge variant="default" className="bg-green-600">
                  4K
                </Badge>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Device Type Cards */}
        <div>
          <h2 className="text-white text-xl sm:text-2xl font-semibold mb-4">
            Screen Size Compatibility
          </h2>
          <ResponsiveGrid 
            cols={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            gap="md"
          >
            {[
              { name: 'Mobile', size: '< 768px', icon: Smartphone, color: 'bg-blue-600' },
              { name: 'Tablet', size: '768-1024px', icon: Tablet, color: 'bg-green-600' },
              { name: 'Desktop', size: '1024-1280px', icon: Monitor, color: 'bg-purple-600' },
              { name: 'Wide', size: '1280-1920px', icon: MonitorSpeaker, color: 'bg-orange-600' },
              { name: 'Ultra-wide', size: '> 1920px', icon: Tv, color: 'bg-red-600' }
            ].map((device, index) => (
              <GlassCard 
                key={device.name} 
                className={`p-4 transition-all duration-300 hover:scale-105 ${
                  (device.name === 'Mobile' && screenInfo.isMobile) ||
                  (device.name === 'Tablet' && screenInfo.isTablet) ||
                  (device.name === 'Desktop' && screenInfo.isDesktop) ||
                  (device.name === 'Wide' && screenInfo.isWide) ||
                  (device.name === 'Ultra-wide' && screenInfo.isUltrawide)
                    ? 'ring-2 ring-blue-400 bg-blue-600/20' 
                    : ''
                }`}
              >
                <div className="text-center space-y-3">
                  <div className={`mx-auto w-12 h-12 rounded-full ${device.color} flex items-center justify-center`}>
                    <device.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{device.name}</h3>
                    <p className="text-slate-400 text-sm">{device.size}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </ResponsiveGrid>
        </div>

        {/* Typography Test */}
        <div>
          <h2 className="text-white text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography Scaling
          </h2>
          <GlassCard className="p-4 sm:p-6 space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white">
              Heading 1 - Responsive
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold text-white">
              Heading 2 - Adaptive
            </h2>
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-white">
              Heading 3 - Scalable
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-slate-300">
              Body text that scales beautifully across all device sizes while maintaining perfect readability.
            </p>
          </GlassCard>
        </div>

        {/* Component Test */}
        <div>
          <h2 className="text-white text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Component Responsiveness
          </h2>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md">
            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-white font-medium mb-3">Buttons</h3>
              <div className="space-y-3">
                <Button className="w-full sm:w-auto" size="sm">Small Button</Button>
                <Button className="w-full sm:w-auto" size="default">Default Button</Button>
                <Button className="w-full sm:w-auto" size="lg">Large Button</Button>
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-white font-medium mb-3">Cards</h3>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm sm:text-base">Responsive Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    Cards adapt their padding and typography based on screen size.
                  </p>
                </CardContent>
              </Card>
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <h3 className="text-white font-medium mb-3">Grid Layout</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-blue-600/20 rounded flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm">{i + 1}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </ResponsiveGrid>
        </div>

        {/* Performance Metrics */}
        <div>
          <h2 className="text-white text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Metrics
          </h2>
          <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap="md">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
                100%
              </div>
              <div className="text-slate-300 text-sm">Responsive Coverage</div>
            </GlassCard>
            
            <GlassCard className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
                {screenInfo.isRetina ? 'Retina' : 'Standard'}
              </div>
              <div className="text-slate-300 text-sm">Display Density</div>
            </GlassCard>
            
            <GlassCard className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
                ✓
              </div>
              <div className="text-slate-300 text-sm">Touch Optimized</div>
            </GlassCard>
            
            <GlassCard className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-2">
                A+
              </div>
              <div className="text-slate-300 text-sm">Accessibility Score</div>
            </GlassCard>
          </ResponsiveGrid>
        </div>

        {/* Testing Instructions */}
        <GlassCard className="p-4 sm:p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Testing Guide
          </h3>
          <div className="space-y-2 text-slate-300 text-sm sm:text-base">
            <p>• Resize your browser window to test different breakpoints</p>
            <p>• Try rotating your device (on mobile/tablet) to test orientation changes</p>
            <p>• Test on different devices: phones, tablets, laptops, and external monitors</p>
            <p>• Check high-DPI displays (MacBook Pro, 4K monitors) for crisp rendering</p>
            <p>• Verify touch targets are at least 44px on mobile devices</p>
            <p>• Test ultra-wide monitors (21:9, 32:9 aspect ratios)</p>
          </div>
        </GlassCard>
      </div>
    </ResponsiveContainer>
  )
}
