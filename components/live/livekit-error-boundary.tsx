"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Error } from "@/components/shared/error"
import { isParticipantArrayError, getLiveKitErrorMessage } from "@/utils/livekit-utils"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class LiveKitErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Only show error boundary for non-participant array errors
    if (isParticipantArrayError(error) || 
        error.message?.includes('camera_placeholder') ||
        error.message?.includes('not part of the array')) {
      console.warn('LiveKit participant/camera error (ignored):', error.message)
      return { hasError: false }
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LiveKit Error Boundary caught an error:', error, errorInfo)
    
    // Don't log participant array errors as they're expected
    if (!isParticipantArrayError(error) && 
        !error.message?.includes('camera_placeholder') &&
        !error.message?.includes('not part of the array')) {
      console.error('LiveKit component error:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

        return (
          <Error
            title="LiveKit Component Error"
            message={this.state.error ? getLiveKitErrorMessage(this.state.error) : "An error occurred in the live video component"}
            onRetry={() => {
              this.setState({ hasError: false, error: undefined })
            }}
          />
        )
    }

    return this.props.children
  }
}
