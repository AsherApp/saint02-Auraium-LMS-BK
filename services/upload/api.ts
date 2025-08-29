import { http } from '../http'

export type UploadResponse = {
  success: boolean
  file: {
    url: string
    name: string
    size: number
    type: string
    filename: string
  }
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('video', file)
  
  const response = await fetch('http://localhost:4000/api/upload/video', {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload video')
  }
  
  return response.json()
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('http://localhost:4000/api/upload/file', {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file')
  }
  
  return response.json()
} 