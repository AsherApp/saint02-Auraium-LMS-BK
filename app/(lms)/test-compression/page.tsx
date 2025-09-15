"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVideoCompression } from '@/hooks/use-video-compression'
// Removed CompressionProgress import - using simple progress bar instead
import { formatFileSize, needsCompression } from '@/lib/video-compression'
import { Upload, FileVideo, Download, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function TestCompressionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { state, compress, reset } = useVideoCompression()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      reset()
    }
  }

  const handleCompress = async () => {
    if (!selectedFile) return

    try {
      await compress(selectedFile, {
        maxSizeMB: 50,
        quality: 0.95, // Pixel-perfect clarity
        maxWidth: 1920, // Higher resolution
        maxHeight: 1080,
        audioQuality: 0.9 // High audio quality
      })
    } catch (error) {
      console.error('Compression failed:', error)
    }
  }

  const handleDownload = () => {
    if (state.result?.compressedFile) {
      const url = URL.createObjectURL(state.result.compressedFile)
      const a = document.createElement('a')
      a.href = url
      a.download = `compressed_${state.result.compressedFile.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Video Compression Test</h1>
          <p className="text-gray-600">
            Test the video compression functionality before uploading to the LMS
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              File Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">Choose a video file</Label>
              <Input
                id="file-input"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Selected File:</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                  <p><strong>Type:</strong> {selectedFile.type}</p>
                  <p><strong>Needs Compression:</strong> {
                    needsCompression(selectedFile, 50) ? (
                      <span className="text-orange-600 font-medium">Yes (exceeds 50MB limit)</span>
                    ) : (
                      <span className="text-green-600 font-medium">No (within 50MB limit)</span>
                    )
                  }</p>
                </div>
              </div>
            )}

            {selectedFile && (
              <Button 
                onClick={handleCompress}
                disabled={state.isCompressing}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {state.isCompressing ? 'Compressing...' : 'Compress Video'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Simple Compression Progress */}
        {selectedFile && (state.isCompressing || state.result || state.error) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {state.isCompressing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                ) : state.error ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {state.isCompressing ? 'Compressing video...' : 
                     state.error ? 'Compression failed' : 
                     'Compression completed'}
                  </p>
                  {state.isCompressing && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {state.isCompressing && (
                  <span className="text-xs text-gray-500">
                    {Math.round(state.progress)}%
                  </span>
                )}
              </div>
              {state.error && (
                <p className="text-sm text-red-600 mt-2">{state.error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {state.result?.success && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Compression Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thumbnail Preview */}
              {state.result.thumbnail && (
                <div className="text-center">
                  <p className="font-medium text-gray-600 mb-2">Generated Thumbnail</p>
                  <img
                    src={state.result.thumbnail}
                    alt="Video thumbnail"
                    className="max-w-full h-32 object-cover rounded-lg mx-auto border"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Original Size</p>
                  <p className="text-lg">{formatFileSize(state.result.originalSize)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Compressed Size</p>
                  <p className="text-lg">{formatFileSize(state.result.compressedSize)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Compression Ratio</p>
                  <p className="text-lg">
                    {state.result.compressionRatio > 1 
                      ? `${state.result.compressionRatio.toFixed(1)}x smaller`
                      : 'No compression'
                    }
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Size Reduction</p>
                  <p className="text-lg text-green-600">
                    {Math.round((1 - state.result.compressedSize / state.result.originalSize) * 100)}%
                  </p>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Compressed File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Automatic Compression:</h4>
              <p className="text-gray-600">
                Files larger than 50MB are automatically compressed to fit within the upload limit.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Quality Settings:</h4>
              <p className="text-gray-600">
                Videos are compressed with 95% quality and maximum resolution of 1920x1080 for pixel-perfect clarity, with 90% audio quality for crystal-clear sound.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Supported Formats:</h4>
              <p className="text-gray-600">
                MP4, WebM, and other video formats. The compression maintains the original format when possible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
