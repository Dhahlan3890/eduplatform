"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { updateProfile, updatePassword } from "firebase/auth"
import { User, Camera } from "lucide-react"
import Image from "next/image"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userType: "student" | "teacher"
}

export default function EditProfileModal({ isOpen, onClose, userType }: EditProfileModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    bio: "",
    expertise: "", // For teachers
    photoURL: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: "",
        expertise: "",
        photoURL: user.photoURL || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setPhotoPreview(user.photoURL || "")
    }
  }, [isOpen, user])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Update display name and photo if changed
      const updates: any = {}
      
      if (formData.displayName !== user.displayName) {
        updates.displayName = formData.displayName
      }

      // Handle photo upload (convert to base64 for simplicity)
      if (photoFile) {
        const reader = new FileReader()
        reader.onload = async () => {
          updates.photoURL = reader.result as string
          await updateProfile(user, updates)
        }
        reader.readAsDataURL(photoFile)
      } else if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates)
      }

      // Update password if provided
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        await updatePassword(user, formData.newPassword)
      }

      // Save additional profile data to database
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          bio: formData.bio,
          expertise: userType === 'teacher' ? formData.expertise : undefined,
          userType
        })
      })

      alert('Profile updated successfully!')
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      displayName: "",
      email: "",
      bio: "",
      expertise: "",
      photoURL: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    setPhotoFile(null)
    setPhotoPreview("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your {userType} profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700"
              >
                <Camera className="h-3 w-3" />
              </label>
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder={`Tell us about yourself as a ${userType}...`}
              rows={3}
            />
          </div>

          {/* Expertise (Teachers only) */}
          {userType === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="expertise">Teaching Expertise</Label>
              <Input
                id="expertise"
                type="text"
                value={formData.expertise}
                onChange={(e) => setFormData(prev => ({ ...prev, expertise: e.target.value }))}
                placeholder="e.g., Mathematics, Programming, Art"
              />
            </div>
          )}

          {/* Password Change Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Change Password (Optional)</h4>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
              />
            </div>

            {formData.newPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
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
              disabled={loading || (!!formData.newPassword && formData.newPassword !== formData.confirmPassword)}
            >
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
