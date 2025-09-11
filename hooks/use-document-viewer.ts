"use client"

import { useState, useCallback } from "react"

interface DocumentFile {
  id: string
  name: string
  url: string
  type: string
  size?: number
  uploadedAt?: string
}

interface DocumentViewerState {
  isOpen: boolean
  file: DocumentFile | null
  title?: string
  showDownload?: boolean
  showMaximize?: boolean
}

export function useDocumentViewer() {
  const [state, setState] = useState<DocumentViewerState>({
    isOpen: false,
    file: null,
    title: undefined,
    showDownload: true,
    showMaximize: true
  })

  const openDocument = useCallback((
    file: DocumentFile,
    options?: {
      title?: string
      showDownload?: boolean
      showMaximize?: boolean
    }
  ) => {
    setState({
      isOpen: true,
      file,
      title: options?.title,
      showDownload: options?.showDownload ?? true,
      showMaximize: options?.showMaximize ?? true
    })
  }, [])

  const closeDocument = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      file: null
    }))
  }, [])

  return {
    ...state,
    openDocument,
    closeDocument
  }
}
