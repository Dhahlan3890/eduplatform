"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Edit, Plus } from "lucide-react"

interface BankDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  teacherId: string
  onSave: (bankDetails: any) => void
}

interface BankDetails {
  bankName: string
  accountNumber: string
  accountHolderName: string
  branchCode: string
  branchName: string
}

export default function BankDetailsModal({ isOpen, onClose, teacherId, onSave }: BankDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BankDetails>({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branchCode: "",
    branchName: ""
  })

  // Load existing bank details when modal opens
  useEffect(() => {
    if (isOpen && teacherId) {
      loadBankDetails()
    }
  }, [isOpen, teacherId])

  const loadBankDetails = async () => {
    try {
      const res = await fetch(`/api/teacher/bank-details?teacherId=${teacherId}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.bankName) {
          setFormData(data)
        }
      }
    } catch (error) {
      console.error('Error loading bank details:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId) return

    setLoading(true)
    try {
      const res = await fetch('/api/teacher/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          bankDetails: formData
        })
      })

      if (res.ok) {
        const savedData = await res.json()
        onSave(formData)
        alert('Bank details saved successfully!')
        onClose()
      } else {
        throw new Error('Failed to save bank details')
      }
    } catch (error: any) {
      console.error('Error saving bank details:', error)
      alert('Failed to save bank details: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      branchCode: "",
      branchName: ""
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Details</DialogTitle>
          <DialogDescription>
            Add or update your bank details for student payments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
              placeholder="e.g., Commercial Bank of Ceylon"
              required
            />
          </div>

          {/* Account Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name *</Label>
            <Input
              id="accountHolderName"
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
              placeholder="Full name as per bank account"
              required
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="e.g., 8001234567890"
              required
            />
          </div>

          {/* Branch Code */}
          <div className="space-y-2">
            <Label htmlFor="branchCode">Branch Code</Label>
            <Input
              id="branchCode"
              type="text"
              value={formData.branchCode}
              onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value }))}
              placeholder="e.g., 001"
            />
          </div>

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              type="text"
              value={formData.branchName}
              onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
              placeholder="e.g., Colombo Branch"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Component to display bank details in dashboard
interface BankDetailsDisplayProps {
  teacherId: string
  onEdit: () => void
}

export function BankDetailsDisplay({ teacherId, onEdit }: BankDetailsDisplayProps) {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBankDetails()
  }, [teacherId])

  const loadBankDetails = async () => {
    if (!teacherId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/bank-details?teacherId=${teacherId}`)
      if (res.ok) {
        const data = await res.json()
        setBankDetails(data)
      }
    } catch (error) {
      console.error('Error loading bank details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading bank details...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Your bank account information for student payments
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            {bankDetails?.bankName ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {bankDetails?.bankName ? "Edit" : "Add"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {bankDetails?.bankName ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Bank Name</Label>
                <div className="font-medium">{bankDetails.bankName}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Account Holder</Label>
                <div className="font-medium">{bankDetails.accountHolderName}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Account Number</Label>
                <div className="font-mono">{bankDetails.accountNumber}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Branch</Label>
                <div>{bankDetails.branchName} {bankDetails.branchCode && `(${bankDetails.branchCode})`}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No bank details added yet</p>
            <p className="text-sm">Add your bank details to receive payments from students</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
