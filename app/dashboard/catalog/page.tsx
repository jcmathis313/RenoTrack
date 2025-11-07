"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface CatalogItem {
  id: string
  category: {
    id: string
    name: string
  }
  component: {
    id: string
    name: string
  }
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
  imageUrl: string | null
}

interface ComponentCategory {
  id: string
  name: string
  components: {
    id: string
    name: string
  }[]
}

export default function CatalogPage() {
  const router = useRouter()
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [categories, setCategories] = useState<ComponentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    imported: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const [formData, setFormData] = useState({
    categoryId: "",
    componentId: "",
    description: "",
    modelNumber: "",
    manufacturer: "",
    finish: "",
    color: "",
    imageUrl: "",
  })

  useEffect(() => {
    fetchCatalogItems()
    fetchCategories()
  }, [])

  const fetchCatalogItems = async () => {
    try {
      const response = await fetch("/api/catalog")
      if (response.ok) {
        const data = await response.json()
        setCatalogItems(data)
      }
    } catch (error) {
      console.error("Error fetching catalog items:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/settings/component-category")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const filteredItems = catalogItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.category.name.toLowerCase().includes(searchLower) ||
      item.component.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      (item.modelNumber && item.modelNumber.toLowerCase().includes(searchLower)) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchLower)) ||
      (item.finish && item.finish.toLowerCase().includes(searchLower)) ||
      (item.color && item.color.toLowerCase().includes(searchLower))
    )
  })

  const handleCreate = () => {
    setFormData({
      categoryId: "",
      componentId: "",
      description: "",
      modelNumber: "",
      manufacturer: "",
      finish: "",
      color: "",
      imageUrl: "",
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item)
    setFormData({
      categoryId: item.category.id,
      componentId: item.component.id,
      description: item.description || "",
      modelNumber: item.modelNumber || "",
      manufacturer: item.manufacturer || "",
      finish: item.finish || "",
      color: item.color || "",
      imageUrl: item.imageUrl || "",
    })
    setIsCreateOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editingItem
        ? `/api/catalog/${editingItem.id}`
        : "/api/catalog"
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("API error response:", data)
        throw new Error(data.error || "Failed to save catalog item")
      }

      setIsCreateOpen(false)
      setEditingItem(null)
      fetchCatalogItems()
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      alert(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/catalog/${selectedItem.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete catalog item")
      }

      setDeleteOpen(false)
      setSelectedItem(null)
      fetchCatalogItems()
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch("/api/catalog/export")
      if (!response.ok) {
        throw new Error("Failed to export catalog")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `catalog-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading CSV:", error)
      alert("Failed to download catalog. Please try again.")
    }
  }

  const handleUploadCSV = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload")
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)

      const response = await fetch("/api/catalog/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to import catalog")
      }

      const result = await response.json()
      setUploadResult(result)

      if (result.errors.length === 0) {
        // All items imported successfully
        setUploadFile(null)
        fetchCatalogItems()
        setTimeout(() => {
          setUploadOpen(false)
          setUploadResult(null)
        }, 2000)
      } else {
        // Some errors occurred, but may have imported some items
        fetchCatalogItems()
      }
    } catch (error) {
      console.error("Error uploading CSV:", error)
      alert(error instanceof Error ? error.message : "Failed to upload catalog")
    } finally {
      setUploading(false)
    }
  }

  const selectedCategory = categories.find((cat) => cat.id === formData.categoryId)
  const availableComponents = selectedCategory?.components || []

  if (loading) {
    return (
      <div className="text-center py-8">Loading catalog...</div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Catalog</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage finishes and materials for design assignments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadCSV}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button onClick={handleCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Catalog Item
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search catalog items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? "No catalog items match your search."
                    : "No catalog items yet. Create your first one!"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Category / Component</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[200px]">Model Number / Manufacturer</TableHead>
                      <TableHead className="w-[180px]">Finish / Color</TableHead>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{item.category.name}</div>
                            <div className="text-xs text-gray-500">{item.component.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-xs">{item.description || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{item.modelNumber || "—"}</div>
                            <div className="text-xs text-gray-500">{item.manufacturer || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{item.finish || "—"}</div>
                            <div className="text-xs text-gray-500">{item.color || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={`${item.category.name} ${item.component.name}`}
                              className="h-12 w-12 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No image</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item)
                                setDeleteOpen(true)
                              }}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            setEditingItem(null)
            setFormData({
              categoryId: "",
              componentId: "",
              description: "",
              modelNumber: "",
              manufacturer: "",
              finish: "",
              color: "",
              imageUrl: "",
            })
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Catalog Item" : "Create Catalog Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the catalog item details."
                : "Add a new finish or material to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-xs">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  setFormData({ ...formData, categoryId: value, componentId: "" })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="component" className="text-xs">Component *</Label>
              <Select
                value={formData.componentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, componentId: value })
                }
                disabled={!formData.categoryId}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  {availableComponents.map((component) => (
                    <SelectItem key={component.id} value={component.id}>
                      {component.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="modelNumber" className="text-xs">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={formData.modelNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, modelNumber: e.target.value })
                  }
                  placeholder="Enter model number"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manufacturer" className="text-xs">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="Enter manufacturer"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="finish" className="text-xs">Finish</Label>
                <Input
                  id="finish"
                  value={formData.finish}
                  onChange={(e) =>
                    setFormData({ ...formData, finish: e.target.value })
                  }
                  placeholder="Enter finish"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color" className="text-xs">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="Enter color"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl" className="text-xs">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                className="h-8 text-xs"
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="Enter image URL (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                setEditingItem(null)
                setFormData({
                  categoryId: "",
                  componentId: "",
                  description: "",
                  modelNumber: "",
                  manufacturer: "",
                  finish: "",
                  color: "",
                  imageUrl: "",
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.categoryId || !formData.componentId}
            >
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Catalog Item"
        description={`Are you sure you want to delete this catalog item? This action cannot be undone.`}
      />

      {/* Upload CSV Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Catalog CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import catalog items. The CSV must include columns:
              Category, Component, Description, Model Number, Manufacturer, Finish, Color, Image URL.
              Download the current catalog to see the format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setUploadFile(file)
                    setUploadResult(null)
                  }
                }}
              />
            </div>

            {uploadResult && (
              <div className="space-y-2">
                <div className="rounded-md bg-green-50 border border-green-200 p-3">
                  <p className="text-sm text-green-800">
                    Successfully imported {uploadResult.imported} item(s)
                  </p>
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Errors ({uploadResult.errors.length}):
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false)
                setUploadFile(null)
                setUploadResult(null)
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadCSV}
              disabled={!uploadFile || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
