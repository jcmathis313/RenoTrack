"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline"

interface Vendor {
  id: string
  name: string
  contact: string | null
  address: string | null
}

export function VendorSettings() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  
  // Add/Edit state
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [vendorForm, setVendorForm] = useState({
    name: "",
    contact: "",
    address: "",
  })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/settings/vendors")
      if (response.ok) {
        const data = await response.json()
        setVendors(data)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      setError("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorForm.name.trim()) {
      setError("Vendor name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/settings/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vendorForm.name.trim(),
          contact: vendorForm.contact.trim() || null,
          address: vendorForm.address.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add vendor")
      }

      const newVendor = await response.json()

      // Update local state instead of refetching
      setVendors([...vendors, newVendor])

      setVendorForm({ name: "", contact: "", address: "" })
      setAddDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleEditVendorStart = (vendor: Vendor) => {
    setEditingVendorId(vendor.id)
    setVendorForm({
      name: vendor.name,
      contact: vendor.contact || "",
      address: vendor.address || "",
    })
    setError("")
  }

  const handleEditVendorCancel = () => {
    setEditingVendorId(null)
    setVendorForm({ name: "", contact: "", address: "" })
    setError("")
  }

  const handleEditVendorSave = async (vendorId: string) => {
    if (!vendorForm.name.trim()) {
      setError("Vendor name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/settings/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vendorForm.name.trim(),
          contact: vendorForm.contact.trim() || null,
          address: vendorForm.address.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update vendor")
      }

      const updatedVendor = await response.json()

      // Update local state instead of refetching
      setVendors(vendors.map(vendor =>
        vendor.id === vendorId
          ? {
              ...vendor,
              name: updatedVendor.name,
              contact: updatedVendor.contact,
              address: updatedVendor.address,
            }
          : vendor
      ))

      setEditingVendorId(null)
      setVendorForm({ name: "", contact: "", address: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedVendor) return

    try {
      const response = await fetch(`/api/settings/vendors/${selectedVendor.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete vendor")
      }

      // Update local state instead of refetching
      setVendors(vendors.filter(vendor => vendor.id !== selectedVendor.id))

      setDeleteDialogOpen(false)
      setSelectedVendor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setDeleteDialogOpen(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/settings/vendors/export")
      if (!response.ok) {
        throw new Error("Failed to export vendors")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vendors-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV")
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/settings/vendors/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to import CSV")
      }

      const result = await response.json()
      alert(`Successfully imported ${result.count || 0} vendor(s)`)
      // Refetch vendors after import since we don't know which ones were added
      fetchVendors()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV")
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading vendors...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>
                Manage vendors that can be assigned to components in selections
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </Button>
              <label className="cursor-pointer">
                <Button
                  variant="outline"
                  asChild
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <span>
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Import CSV"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
              <Button onClick={() => setAddDialogOpen(true)}>Add Vendor</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {vendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vendors found. Add your first vendor to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    {editingVendorId === vendor.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={vendorForm.name}
                            onChange={(e) =>
                              setVendorForm({ ...vendorForm, name: e.target.value })
                            }
                            placeholder="Vendor Name"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={vendorForm.contact}
                            onChange={(e) =>
                              setVendorForm({ ...vendorForm, contact: e.target.value })
                            }
                            placeholder="Contact"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={vendorForm.address}
                            onChange={(e) =>
                              setVendorForm({ ...vendorForm, address: e.target.value })
                            }
                            placeholder="Address"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditVendorSave(vendor.id)}
                              disabled={saving}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleEditVendorCancel}
                              disabled={saving}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.contact || "—"}</TableCell>
                        <TableCell>{vendor.address || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditVendorStart(vendor)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteVendor(vendor)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>
              Enter the vendor information. Name is required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={vendorForm.name}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, name: e.target.value })
                }
                placeholder="Vendor Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                value={vendorForm.contact}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contact: e.target.value })
                }
                placeholder="Contact person or phone/email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={vendorForm.address}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, address: e.target.value })
                }
                placeholder="Vendor address"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false)
                  setVendorForm({ name: "", contact: "", address: "" })
                  setError("")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedVendor?.name}&quot;? This action cannot be undone.
              Components that have this vendor assigned will have their vendor cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

