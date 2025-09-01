# 🌊 Fluid Tabs Component Guide

## Overview
The new Fluid Tabs component provides a professional, animated tab navigation system with glassmorphism design that matches the reference image you provided.

## Features
- ✨ **Fluid animations** with spring physics
- 🎨 **Glassmorphism styling** with subtle borders
- 📱 **Responsive design** across all screen sizes
- 🎯 **Professional appearance** with perfect radius
- 🔧 **Badge support** for notification counts
- 🎨 **Icon integration** for enhanced UX
- ⚡ **Optimized performance** with minimal re-renders

## Usage

### Basic Example
```tsx
import { FluidTabs, useFluidTabs } from "@/components/ui/fluid-tabs"

export function MyComponent() {
  const tabs = useFluidTabs("dashboard")
  
  return (
    <FluidTabs
      tabs={[
        { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
        { id: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'subscription', label: 'Subscription', icon: <Target className="h-4 w-4" />, badge: '12' },
      ]}
      activeTab={tabs.activeTab}
      onTabChange={tabs.handleTabChange}
      variant="default"
    />
  )
}
```

### With Badges
```tsx
<FluidTabs
  tabs={[
    { id: 'all', label: 'All', badge: 24 },
    { id: 'pending', label: 'Pending', badge: 8 },
    { id: 'completed', label: 'Completed', badge: 16 },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="compact"
/>
```

## Variants

### Size Variants
- `compact` - Smaller padding and text (px-3 py-1.5 text-sm)
- `default` - Standard size (px-4 py-2 text-base)
- `large` - Larger size (px-6 py-3 text-lg)

### Examples
```tsx
{/* Compact for mobile/secondary navigation */}
<FluidTabs variant="compact" ... />

{/* Default for main navigation */}
<FluidTabs variant="default" ... />

{/* Large for hero sections */}
<FluidTabs variant="large" ... />
```

## Design System

### Glassmorphism Styling
- **Container**: `bg-black/20 backdrop-blur-lg border border-white/10`
- **Active Tab**: `bg-gradient-to-r from-blue-600/80 to-purple-600/80`
- **Inactive Tab**: `text-slate-300 hover:text-white hover:bg-white/5`
- **Border Radius**: `rounded-lg` (subtle, not too much)

### Animation Features
- **Fluid transitions** between tabs
- **Smooth hover effects** with scale and glow
- **Spring animations** for natural movement
- **Touch feedback** for mobile devices

## Live Examples

Visit these pages to see Fluid Tabs in action:

1. **Demo Page**: `/dev/fluid-tabs-demo`
   - Comprehensive showcase of all variants
   - Live examples with different configurations
   - Performance metrics and testing

2. **Teacher Assignments**: `/teacher/assignments`
   - Main navigation: Assignments vs Submissions
   - Filter tabs: All, Pending, Graded, Overdue

3. **Student Assignments**: `/student/assignments`
   - Main navigation: Assignments vs Progress
   - Dynamic badge counts

4. **Teacher Course**: `/teacher/course/[id]`
   - Course navigation: Overview, Curriculum, Students, etc.
   - Badge counts for each section

## Integration Tips

### State Management
```tsx
// Use the provided hook for simple state management
const tabs = useFluidTabs("initialTab")

// Or manage state manually
const [activeTab, setActiveTab] = useState("dashboard")
```

### Dynamic Badges
```tsx
// Calculate badges dynamically
const tabs = [
  { id: 'pending', label: 'Pending', badge: assignments.filter(a => !a.graded).length },
  { id: 'graded', label: 'Graded', badge: assignments.filter(a => a.graded).length },
]
```

### Responsive Usage
```tsx
// Use different variants for different screen sizes
<div className="hidden sm:block">
  <FluidTabs variant="default" ... />
</div>
<div className="block sm:hidden">
  <FluidTabs variant="compact" ... />
</div>
```

## Customization

### Custom Styling
```tsx
<FluidTabs
  className="custom-tabs-container"
  tabs={tabs}
  ...
/>
```

### Custom Colors
The component uses your existing design tokens and respects the glassmorphism theme. Colors automatically adapt to your brand palette.

## Performance

- **Optimized animations** using Framer Motion
- **Minimal re-renders** with proper memoization
- **Tree-shakeable** components
- **TypeScript support** for better DX

## Accessibility

- **Keyboard navigation** support
- **Focus visible** indicators
- **ARIA labels** for screen readers
- **Touch-friendly** minimum sizes (44px)

---

**The Fluid Tabs component perfectly matches your reference design while maintaining professional standards and excellent performance!**
