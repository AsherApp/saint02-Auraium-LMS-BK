"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Award, Loader2 } from "lucide-react"
import { http } from "@/services/http"
import { useToast } from "@/hooks/use-toast"

interface CertificateDownloadProps {
  courseId: string
  studentId: string
  courseTitle?: string
  studentName?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showText?: boolean
}

export function CertificateDownload({
  courseId,
  studentId,
  courseTitle,
  studentName,
  variant = "outline",
  size = "default",
  className = "",
  showText = true
}: CertificateDownloadProps) {
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setDownloading(true)
    
    try {
      // First, try to get existing certificate
      const response = await http<any>(`/api/certificates/${courseId}/${studentId}`)
      
      if (response.certificateUrl) {
        // Certificate exists, download it
        window.open(response.certificateUrl, '_blank')
        toast({
          title: "Certificate Downloaded",
          description: "Your certificate has been opened in a new tab.",
        })
      } else {
        // Certificate doesn't exist, generate it
        const generateResponse = await http<any>(`/api/certificates/generate`, {
          method: 'POST',
          body: JSON.stringify({ courseId, studentId })
        })
        
        if (generateResponse.certificateUrl) {
          window.open(generateResponse.certificateUrl, '_blank')
          toast({
            title: "Certificate Generated",
            description: "Your certificate has been generated and opened in a new tab.",
          })
        } else {
          throw new Error('Failed to generate certificate')
        }
      }
    } catch (error) {
      console.error('Certificate download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={downloading}
      variant={variant}
      size={size}
      className={className}
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {showText && "Generating..."}
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {showText && "Download Certificate"}
        </>
      )}
    </Button>
  )
}

// Certificate status component
interface CertificateStatusProps {
  courseId: string
  studentId: string
  className?: string
}

export function CertificateStatus({ courseId, studentId, className = "" }: CertificateStatusProps) {
  const [hasCertificate, setHasCertificate] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)

  // Check if certificate exists
  const checkCertificate = async () => {
    try {
      const response = await http<any>(`/api/certificates/${courseId}/${studentId}`)
      setHasCertificate(!!response.certificateUrl)
    } catch (error) {
      setHasCertificate(false)
    } finally {
      setChecking(false)
    }
  }

  // Check on mount
  useEffect(() => {
    checkCertificate()
  }, [courseId, studentId])

  if (checking) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking certificate...</span>
      </div>
    )
  }

  if (hasCertificate) {
    return (
      <div className={`flex items-center gap-2 text-green-400 ${className}`}>
        <Award className="h-4 w-4" />
        <span className="text-sm">Certificate Available</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
      <Award className="h-4 w-4" />
      <span className="text-sm">No Certificate Yet</span>
    </div>
  )
}
