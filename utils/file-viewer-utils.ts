/**
 * Utility functions for determining file types and appropriate viewers
 */

export interface FileInfo {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt?: string
}

export type ViewerType = 'document' | 'presentation' | 'video' | 'image' | 'none'

/**
 * Determines the appropriate viewer type based on file type and name
 */
export function getViewerType(file: FileInfo): ViewerType {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()

  // Document files
  if (
    mimeType === 'application/pdf' ||
    fileName.endsWith('.pdf') ||
    mimeType.startsWith('text/') ||
    fileName.match(/\.(txt|md|doc|docx|rtf)$/)
  ) {
    return 'document'
  }

  // Presentation files
  if (
    fileName.match(/\.(ppt|pptx|key|odp)$/) ||
    mimeType.includes('presentation') ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'presentation'
  }

  // Image files
  if (
    mimeType.startsWith('image/') ||
    fileName.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i)
  ) {
    return 'document' // Images can be viewed in document viewer
  }

  // Video files
  if (
    mimeType.startsWith('video/') ||
    fileName.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
  ) {
    return 'video'
  }

  return 'none'
}

/**
 * Checks if a file can be previewed in a modal
 */
export function canPreviewFile(file: FileInfo): boolean {
  return getViewerType(file) !== 'none'
}

/**
 * Gets the appropriate icon class for a file type
 */
export function getFileIcon(file: FileInfo): string {
  const viewerType = getViewerType(file)
  
  switch (viewerType) {
    case 'document':
      return 'FileText'
    case 'presentation':
      return 'Presentation'
    case 'video':
      return 'Video'
    case 'image':
      return 'Image'
    default:
      return 'File'
  }
}

/**
 * Converts lesson content or any content with file reference to FileInfo format
 */
export function contentToFileInfo(content: any): FileInfo | null {
  if (!content) return null

  // Handle different content structure formats
  if (content.url && content.name) {
    return {
      id: content.id || crypto.randomUUID(),
      name: content.name,
      type: content.type || content.mimeType || '',
      size: content.size || 0,
      url: content.url,
      uploadedAt: content.uploadedAt || content.created_at
    }
  }

  // Handle file content type
  if (content.type === 'file' && content.content) {
    const fileContent = typeof content.content === 'string' 
      ? JSON.parse(content.content) 
      : content.content

    if (fileContent.url && fileContent.filename) {
      return {
        id: content.id || crypto.randomUUID(),
        name: fileContent.filename,
        type: fileContent.mimeType || '',
        size: fileContent.size || 0,
        url: fileContent.url,
        uploadedAt: content.updated_at || content.created_at
      }
    }
  }

  return null
}

/**
 * Gets preview button text based on file type
 */
export function getPreviewButtonText(file: FileInfo): string {
  const viewerType = getViewerType(file)
  
  switch (viewerType) {
    case 'document':
      return 'Preview Document'
    case 'presentation':
      return 'View Presentation'
    case 'video':
      return 'Play Video'
    case 'image':
      return 'View Image'
    default:
      return 'Preview'
  }
}