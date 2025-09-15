"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Trophy, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CongratulationBalloonProps {
  isVisible: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'module' | 'course' | 'exam'
  score?: number
  autoCloseDelay?: number
}

export function CongratulationBalloon({
  isVisible,
  onClose,
  title,
  message,
  type = 'module',
  score,
  autoCloseDelay = 5000
}: CongratulationBalloonProps) {
  const [isClosing, setIsClosing] = useState(false)

  // Auto-close after delay
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoCloseDelay])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'course':
        return <Trophy className="h-8 w-8 text-yellow-400" />
      case 'exam':
        return <CheckCircle className="h-8 w-8 text-green-400" />
      default:
        return <Star className="h-8 w-8 text-blue-400" />
    }
  }

  const getBackgroundGradient = () => {
    switch (type) {
      case 'course':
        return 'from-yellow-500/20 to-orange-500/20'
      case 'exam':
        return 'from-green-500/20 to-emerald-500/20'
      default:
        return 'from-blue-500/20 to-purple-500/20'
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'course':
        return 'border-yellow-400/30'
      case 'exam':
        return 'border-green-400/30'
      default:
        return 'border-blue-400/30'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && !isClosing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5
          }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className={`
            relative bg-gradient-to-br ${getBackgroundGradient()} 
            backdrop-blur-lg border ${getBorderColor()} 
            rounded-2xl p-6 shadow-2xl
            border-white/10
          `}>
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Content */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex-shrink-0"
              >
                {getIcon()}
              </motion.div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <motion.h3
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg font-bold text-white mb-1"
                >
                  {title}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-sm leading-relaxed"
                >
                  {message}
                </motion.p>

                {/* Score display for exams */}
                {type === 'exam' && score !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <div className="bg-white/10 rounded-full px-3 py-1">
                      <span className="text-white font-semibold text-sm">
                        Score: {score}%
                      </span>
                    </div>
                    {score >= 80 && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-xs font-medium">Excellent!</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Progress bar for auto-close */}
            {autoCloseDelay > 0 && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-2xl"
              />
            )}

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 100 - 50
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    y: [0, -50, -100]
                  }}
                  transition={{ 
                    delay: 0.5 + i * 0.1,
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
