// Dynamic imports for heavy components to reduce initial bundle size
import dynamic from 'next/dynamic'

// Heavy UI Components
export const BulkCourseImport = dynamic(() => import('@/components/teacher/bulk-course-import'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const BulkCourseGenerator = dynamic(() => import('@/components/teacher/bulk-course-generator'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const AssignmentCreator = dynamic(() => import('@/components/teacher/assignment-creator'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Chart Components (Recharts is heavy)
export const PerformanceChart = dynamic(() => import('@/components/charts/performance-chart'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const AnalyticsChart = dynamic(() => import('@/components/charts/analytics-chart'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// LiveKit Components (Heavy video components)
export const LiveVideoPlayer = dynamic(() => import('@/components/live/live-video-player'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const LiveControls = dynamic(() => import('@/components/live/live-controls'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// File Upload Components
export const FileUpload = dynamic(() => import('@/components/shared/file-upload'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const VideoUpload = dynamic(() => import('@/components/shared/video-upload'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Document Viewers (Heavy PDF/Office viewers)
export const DocumentViewer = dynamic(() => import('@/components/shared/document-viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const PresentationViewer = dynamic(() => import('@/components/shared/presentation-viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Calendar Components (React Day Picker is heavy)
export const Calendar = dynamic(() => import('@/components/ui/calendar'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

export const DatePicker = dynamic(() => import('@/components/ui/date-picker'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Form Components (React Hook Form + Zod validation)
export const AdvancedForm = dynamic(() => import('@/components/forms/advanced-form'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Animation Components (Framer Motion is heavy)
export const AnimationWrapper = dynamic(() => import('@/components/shared/animation-wrapper').then(mod => ({ default: mod.AnimationWrapper })), {
  loading: () => <div className="opacity-0 animate-pulse">Loading...</div>,
  ssr: false
})

export const StaggeredAnimationWrapper = dynamic(() => import('@/components/shared/animation-wrapper').then(mod => ({ default: mod.StaggeredAnimationWrapper })), {
  loading: () => <div className="opacity-0 animate-pulse">Loading...</div>,
  ssr: false
})

// Data Table Components (Heavy table libraries)
export const DataTable = dynamic(() => import('@/components/ui/data-table'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Rich Text Editor (Heavy editor components)
export const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Code Editor (Monaco Editor is very heavy)
export const CodeEditor = dynamic(() => import('@/components/ui/code-editor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Map Components (Heavy map libraries)
export const MapViewer = dynamic(() => import('@/components/ui/map-viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// 3D Components (Three.js is very heavy)
export const ThreeDViewer = dynamic(() => import('@/components/ui/3d-viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Virtual Reality Components (Very heavy)
export const VRViewer = dynamic(() => import('@/components/ui/vr-viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Machine Learning Components (Heavy ML libraries)
export const MLPredictor = dynamic(() => import('@/components/ml/predictor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Blockchain Components (Heavy crypto libraries)
export const BlockchainViewer = dynamic(() => import('@/components/blockchain/viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// AI Components (Heavy AI libraries)
export const AIAssistant = dynamic(() => import('@/components/ai/assistant'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Game Components (Heavy game engines)
export const GameEngine = dynamic(() => import('@/components/games/engine'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Video Processing Components (Heavy video processing)
export const VideoProcessor = dynamic(() => import('@/components/video/processor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Audio Processing Components (Heavy audio processing)
export const AudioProcessor = dynamic(() => import('@/components/audio/processor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Image Processing Components (Heavy image processing)
export const ImageProcessor = dynamic(() => import('@/components/image/processor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Database Components (Heavy database tools)
export const DatabaseViewer = dynamic(() => import('@/components/database/viewer'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Network Components (Heavy network tools)
export const NetworkMonitor = dynamic(() => import('@/components/network/monitor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Security Components (Heavy security tools)
export const SecurityScanner = dynamic(() => import('@/components/security/scanner'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Performance Components (Heavy performance tools)
export const PerformanceMonitor = dynamic(() => import('@/components/performance/monitor'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Testing Components (Heavy testing tools)
export const TestRunner = dynamic(() => import('@/components/testing/runner'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Deployment Components (Heavy deployment tools)
export const DeploymentManager = dynamic(() => import('@/components/deployment/manager'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Monitoring Components (Heavy monitoring tools)
export const SystemMonitor = dynamic(() => import('@/components/monitoring/system'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Analytics Components (Heavy analytics tools)
export const AdvancedAnalytics = dynamic(() => import('@/components/analytics/advanced'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Reporting Components (Heavy reporting tools)
export const ReportGenerator = dynamic(() => import('@/components/reporting/generator'), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>,
  ssr: false
})

// Export all dynamic components
export const DynamicComponents = {
  BulkCourseImport,
  BulkCourseGenerator,
  AssignmentCreator,
  PerformanceChart,
  AnalyticsChart,
  LiveVideoPlayer,
  LiveControls,
  FileUpload,
  VideoUpload,
  DocumentViewer,
  PresentationViewer,
  Calendar,
  DatePicker,
  AdvancedForm,
  AnimationWrapper,
  StaggeredAnimationWrapper,
  DataTable,
  RichTextEditor,
  CodeEditor,
  MapViewer,
  ThreeDViewer,
  VRViewer,
  MLPredictor,
  BlockchainViewer,
  AIAssistant,
  GameEngine,
  VideoProcessor,
  AudioProcessor,
  ImageProcessor,
  DatabaseViewer,
  NetworkMonitor,
  SecurityScanner,
  PerformanceMonitor,
  TestRunner,
  DeploymentManager,
  SystemMonitor,
  AdvancedAnalytics,
  ReportGenerator
}

export default DynamicComponents
