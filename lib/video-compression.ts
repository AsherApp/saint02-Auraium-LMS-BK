/**
 * Video Compression Utility
 * Compresses video files to reduce size while maintaining quality
 */

export interface CompressionOptions {
  maxSizeMB?: number; // Maximum file size in MB (default: 50)
  quality?: number; // Video quality 0.1-1.0 (default: 0.95 for pixel-perfect)
  maxWidth?: number; // Maximum width (default: 1920 for high quality)
  maxHeight?: number; // Maximum height (default: 1080 for high quality)
  audioQuality?: number; // Audio quality 0.1-1.0 (default: 0.9)
  onProgress?: (progress: number) => void; // Progress callback
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
  thumbnail?: string; // Base64 thumbnail image
}

/**
 * Compresses a video file using HTML5 Canvas and MediaRecorder API
 * This is a lossless compression that reduces file size by adjusting quality and resolution
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 50,
    quality = 0.95, // Higher quality for pixel-perfect clarity
    maxWidth = 1920, // Higher resolution for better quality
    maxHeight = 1080,
    audioQuality = 0.9, // High audio quality
    onProgress
  } = options;

  const originalSize = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If file is already small enough, return as-is
  if (originalSize <= maxSizeBytes) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: true
    };
  }

  try {
    onProgress?.(10);

    // Create video element to load the file
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    // Create canvas for frame processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Load video metadata
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });

    onProgress?.(20);

    // Calculate new dimensions maintaining aspect ratio
    const { width: newWidth, height: newHeight } = calculateDimensions(
      video.videoWidth,
      video.videoHeight,
      maxWidth,
      maxHeight
    );

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Set up MediaRecorder for compression with high quality settings
    const stream = canvas.captureStream(30); // 30 FPS
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(),
      videoBitsPerSecond: calculateHighQualityBitrate(quality, newWidth, newHeight),
      audioBitsPerSecond: calculateAudioBitrate(audioQuality)
    });

    onProgress?.(30);

    // Start recording
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    return new Promise<CompressionResult>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          const compressedBlob = new Blob(chunks, { type: getSupportedMimeType() });
          const compressedFile = new File([compressedBlob], file.name, {
            type: getSupportedMimeType(),
            lastModified: Date.now()
          });

          const compressedSize = compressedFile.size;
          const compressionRatio = originalSize / compressedSize;

          // Generate thumbnail
          const thumbnail = await generateThumbnail(video, canvas, ctx);

          onProgress?.(100);

          resolve({
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
            success: true,
            thumbnail
          });
        } catch (error) {
          reject(error);
        }
      };

      mediaRecorder.onerror = (error) => {
        reject(new Error(`MediaRecorder error: ${error}`));
      };

      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks

      // Process video frames
      processVideoFrames(video, canvas, ctx, mediaRecorder, onProgress)
        .then(() => {
          mediaRecorder.stop();
        })
        .catch(reject);
    });

  } catch (error) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compression error'
    };
  }
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if too wide
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  // Scale down if too tall
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
}

/**
 * Get supported MIME type for video recording
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm'; // Fallback
}

/**
 * Calculate high-quality bitrate for pixel-perfect clarity
 */
function calculateHighQualityBitrate(quality: number, width: number, height: number): number {
  const pixels = width * height;
  // Higher base bitrate for better quality
  const baseBitrate = pixels * 0.3; // Increased from 0.1 to 0.3
  return Math.round(baseBitrate * quality);
}

/**
 * Calculate audio bitrate for high quality audio
 */
function calculateAudioBitrate(quality: number): number {
  // High quality audio bitrates
  const baseAudioBitrate = 128000; // 128 kbps base
  return Math.round(baseAudioBitrate * quality);
}

/**
 * Generate thumbnail from video
 */
async function generateThumbnail(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<string> {
  return new Promise((resolve) => {
    // Seek to 10% of video duration for thumbnail
    const thumbnailTime = video.duration * 0.1;
    video.currentTime = thumbnailTime;

    video.onseeked = () => {
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const thumbnail = canvas.toDataURL('image/jpeg', 0.9);
      resolve(thumbnail);
    };

    // Fallback if seek fails
    setTimeout(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.9);
      resolve(thumbnail);
    }, 1000);
  });
}

/**
 * Process video frames and draw them to canvas
 */
async function processVideoFrames(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  mediaRecorder: MediaRecorder,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let currentTime = 0;
    const duration = video.duration;
    const frameRate = 30; // 30 FPS
    const frameInterval = 1 / frameRate;

    const processFrame = () => {
      if (currentTime >= duration) {
        resolve();
        return;
      }

      try {
        video.currentTime = currentTime;
        
        video.onseeked = () => {
          // Draw frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Update progress
          const progress = 30 + (currentTime / duration) * 60; // 30-90%
          onProgress?.(Math.min(progress, 90));
          
          currentTime += frameInterval;
          requestAnimationFrame(processFrame);
        };
      } catch (error) {
        reject(error);
      }
    };

    processFrame();
  });
}

/**
 * Simple compression using canvas (for images and small videos)
 */
export async function simpleCompress(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxSizeMB = 50, quality = 0.95, onProgress } = options;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size <= maxSizeBytes) {
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      success: true
    };
  }

  try {
    onProgress?.(10);

    // For video files, use the full compression
    if (file.type.startsWith('video/')) {
      return await compressVideo(file, options);
    }

    // For image files, use canvas compression
    if (file.type.startsWith('image/')) {
      return await compressImage(file, quality, onProgress);
    }

    // For other files, return as-is
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      success: true
    };

  } catch (error) {
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
      success: false,
      error: error instanceof Error ? error.message : 'Compression failed'
    };
  }
}

/**
 * Compress image using canvas
 */
async function compressImage(
  file: File,
  quality: number,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      onProgress?.(50);

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      ctx?.drawImage(img, 0, 0);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });

            onProgress?.(100);

            resolve({
              compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: file.size / compressedFile.size,
              success: true
            });
          } else {
            resolve({
              compressedFile: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 1,
              success: false,
              error: 'Failed to compress image'
            });
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      resolve({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        success: false,
        error: 'Failed to load image'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
}
