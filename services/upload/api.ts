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

export type SignedUploadResponse = {
  signedUrl: string
  path: string
  token: string
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('video', file)
  
  const response = await http<UploadResponse>('/api/upload/video', {
    method: 'POST',
    body: formData,
  })
  
  return response
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await http<UploadResponse>('/api/upload/file', {
    method: 'POST',
    body: formData,
  })
  
  return response
}

// Alternative method using signed URLs for direct Supabase upload
export async function getSignedUploadUrl(fileName: string, fileType: string, bucket = 'Files'): Promise<SignedUploadResponse> {
  const response = await http<SignedUploadResponse>('/api/storage/sign-upload', {
    method: 'POST',
    body: { fileName, fileType, bucket }
  })
  
  return response
}

export async function uploadToSignedUrl(signedUrl: string, file: File): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload file to signed URL')
  }
}

export async function getPublicUrl(fileName: string, bucket = 'Files'): Promise<{ publicUrl: string }> {
  const response = await http<{ publicUrl: string }>(`/api/storage/public-url?fileName=${encodeURIComponent(fileName)}&bucket=${bucket}`)
  
  return response
}

export async function deleteFile(fileName: string, bucket = 'Files'): Promise<{ success: boolean }> {
  const response = await http<{ success: boolean }>('/api/storage/delete', {
    method: 'DELETE',
    body: { fileName, bucket }
  })
  
  return response
} 