"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserData {
  id: string
  email: string
  name: string | null
  phone: string | null
  profilePictureUrl: string | null
  role: string
}

export default function AccountSettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    profilePictureUrl: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/account")
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          password: "",
          profilePictureUrl: data.profilePictureUrl || "",
        })
      } else {
        const error = await response.json().catch(() => ({}))
        console.error("Error fetching account data:", response.status, error)
        setMessage({ type: "error", text: error.error || "Failed to load account data" })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setMessage({ type: "error", text: "Failed to load account data" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPicture(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/account/upload-profile-picture", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const { imageUrl } = await response.json()
        setFormData((prev) => ({ ...prev, profilePictureUrl: imageUrl }))
        setUserData((prev) => prev ? { ...prev, profilePictureUrl: imageUrl } : null)
        setMessage({ type: "success", text: "Profile picture uploaded successfully" })
      } else {
        let errorMessage = "Failed to upload profile picture"
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
          console.error("Upload error response:", error)
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        setMessage({ type: "error", text: errorMessage })
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setMessage({ type: "error", text: "Failed to upload profile picture" })
    } finally {
      setUploadingPicture(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const updateData: any = {
        name: formData.name || null,
        phone: formData.phone || null,
        email: formData.email,
        // profilePictureUrl is updated separately via file upload
      }

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updated = await response.json()
        setUserData(updated)
        setFormData((prev) => ({ ...prev, password: "" })) // Clear password field
        setMessage({ type: "success", text: "Account updated successfully" })
      } else {
        let errorMessage = "Failed to update account"
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
          console.error("Update error response:", error)
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        setMessage({ type: "error", text: errorMessage })
      }
    } catch (error) {
      console.error("Error updating account:", error)
      setMessage({ type: "error", text: "Failed to update account" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your personal account information</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {formData.profilePictureUrl ? (
                  <img
                    src={formData.profilePictureUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-500">
                      {formData.name?.charAt(0).toUpperCase() || formData.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="profilePicture">Profile Picture</Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploadingPicture}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload a profile picture (JPEG, PNG, GIF, or WebP, max 5MB)
                  {uploadingPicture && <span className="ml-1 text-blue-600">Uploading...</span>}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only enter a password if you want to change it
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

