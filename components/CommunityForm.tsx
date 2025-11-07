"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CommunityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  community?: {
    id: string
    name: string
    address: string | null
    logoUrl: string | null
  }
}

export function CommunityForm({ open, onOpenChange, community }: CommunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const isEditing = !!community

  const [formData, setFormData] = useState({
    name: community?.name || "",
    address: community?.address || "",
    logoUrl: community?.logoUrl || "",
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(community?.logoUrl || null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Update form data when community prop changes (for edit mode)
  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || "",
        address: community.address || "",
        logoUrl: community.logoUrl || "",
      })
      setLogoPreview(community.logoUrl || null)
    } else {
      setFormData({ name: "", address: "", logoUrl: "" })
      setLogoPreview(null)
    }
  }, [community])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setError("Please select a file")
      return
    }

    if (!community?.id) {
      setError("Community ID is required. Please save the community first.")
      return
    }

    setUploadingLogo(true)
    setError("")
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/communities/${community.id}/logo`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to upload logo"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const { logoUrl } = await response.json()
      setLogoPreview(logoUrl)
      // Update formData state if it exists (for editing)
      setFormData((prev) => ({ ...prev, logoUrl: logoUrl || null }))
    } catch (err) {
      console.error("Logo upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = isEditing
        ? `/api/communities/${community.id}`
        : "/api/communities"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save community")
      }

      router.refresh()
      onOpenChange(false)
      setFormData({ name: "", address: "", logoUrl: "" })
      setLogoPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Community" : "New Community"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the community information below."
                : "Create a new community by filling in the details below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Sunset Villas"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="123 Main Street, City, State 12345"
              />
            </div>
            {isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="relative w-20 h-20 border rounded-md overflow-hidden bg-gray-50">
                      <img
                        src={logoPreview}
                        alt="Community logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a logo image (JPEG, PNG, GIF, or WebP, max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
