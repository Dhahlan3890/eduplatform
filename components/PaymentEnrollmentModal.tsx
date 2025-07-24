"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, CreditCard, AlertCircle } from "lucide-react"
import Image from "next/image"

interface PaymentEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  course: any
  bankDetails: any
  onSubmit: (receiptData: string, bankDetails: any) => Promise<void>
  isLoading: boolean
}

export default function PaymentEnrollmentModal({
  isOpen,
  onClose,
  course,
  bankDetails,
  onSubmit,
  isLoading
}: PaymentEnrollmentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a payment receipt image")
      return
    }

    setUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string
        await onSubmit(base64Data, bankDetails)
        setSelectedFile(null)
        setPreview(null)
        onClose()
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error("Error uploading receipt:", error)
      alert("Failed to upload receipt. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enroll in Course
          </DialogTitle>
          <DialogDescription>
            Complete payment and upload receipt to enroll in "{course?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{course?.title}</CardTitle>
              <CardDescription className="text-2xl font-bold text-green-600">
                LKR {course?.price || 0}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
              <CardDescription>
                Please transfer the course fee to the following account:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">Bank Name:</Label>
                  <p>{bankDetails?.bankName || "Loading..."}</p>
                </div>
                <div>
                  <Label className="font-semibold">Account Number:</Label>
                  <p className="font-mono">{bankDetails?.accountNumber || "Loading..."}</p>
                </div>
                <div>
                  <Label className="font-semibold">Account Holder:</Label>
                  <p>{bankDetails?.accountHolderName || "Loading..."}</p>
                </div>
                <div>
                  <Label className="font-semibold">Branch:</Label>
                  <p>{bankDetails?.branchName || "Loading..."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Receipt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Payment Receipt</CardTitle>
              <CardDescription>
                Upload a clear photo of your payment receipt or bank transfer confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                {preview ? (
                  <div className="w-full">
                    <Image
                      src={preview}
                      alt="Receipt preview"
                      width={200}
                      height={200}
                      className="mx-auto rounded-lg max-h-48 object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreview(null)
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <Label
                      htmlFor="receipt-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-500"
                    >
                      Click to upload receipt
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Important:</p>
              <p>Your enrollment will be reviewed by the teacher after payment verification. You'll receive an email confirmation once approved.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading || isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedFile || uploading || isLoading}
            className="relative"
          >
            {uploading || isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Enrollment Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
