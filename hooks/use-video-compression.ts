import { useState, useCallback } from 'react';
import { 
  compressVideo, 
  simpleCompress, 
  CompressionOptions, 
  CompressionResult,
  formatFileSize,
  needsCompression 
} from '@/lib/video-compression';

export interface UseCompressionState {
  isCompressing: boolean;
  progress: number;
  result: CompressionResult | null;
  error: string | null;
}

export interface UseCompressionReturn {
  state: UseCompressionState;
  compress: (file: File, options?: CompressionOptions) => Promise<CompressionResult>;
  reset: () => void;
  formatFileSize: (bytes: number) => string;
  needsCompression: (file: File, maxSizeMB?: number) => boolean;
}

/**
 * React hook for video/file compression
 */
export function useVideoCompression(): UseCompressionReturn {
  const [state, setState] = useState<UseCompressionState>({
    isCompressing: false,
    progress: 0,
    result: null,
    error: null
  });

  const compress = useCallback(async (
    file: File, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> => {
    setState({
      isCompressing: true,
      progress: 0,
      result: null,
      error: null
    });

    try {
      const result = await simpleCompress(file, {
        ...options,
        onProgress: (progress) => {
          setState(prev => ({
            ...prev,
            progress
          }));
        }
      });

      setState({
        isCompressing: false,
        progress: 100,
        result,
        error: result.error || null
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Compression failed';
      
      setState({
        isCompressing: false,
        progress: 0,
        result: null,
        error: errorMessage
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isCompressing: false,
      progress: 0,
      result: null,
      error: null
    });
  }, []);

  return {
    state,
    compress,
    reset,
    formatFileSize,
    needsCompression
  };
}
