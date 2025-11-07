"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline"

interface CatalogItem {
  id: string
  categoryId: string
  componentId: string
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
  imageUrl: string | null
  category: {
    id: string
    name: string
  }
  component: {
    id: string
    name: string
  }
}

interface ComponentCategory {
  id: string
  name: string
  components: {
    id: string
    name: string
  }[]
}

interface CatalogItemSelectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogItems: CatalogItem[]
  selectedItemId: string | null
  onSelect: (itemId: string | null) => void
  onCatalogItemCreated?: () => void
  initialCategoryFilter?: string | null
}

export function CatalogItemSelectModal({
  open,
  onOpenChange,
  catalogItems,
  selectedItemId,
  onSelect,
  onCatalogItemCreated,
  initialCategoryFilter,
}: CatalogItemSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [componentFilter, setComponentFilter] = useState<string>("")
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("")

  // Set initial category filter when modal opens or when initialCategoryFilter changes
  useEffect(() => {
    if (open) {
      // Always reset filters when drawer opens or when initialCategoryFilter changes
      if (initialCategoryFilter) {
        setCategoryFilter(initialCategoryFilter)
      } else {
        setCategoryFilter("")
      }
      // Reset other filters
      setComponentFilter("")
      setManufacturerFilter("")
      setSearchTerm("")
    }
  }, [open, initialCategoryFilter])

  // Reset all filters when modal closes
  useEffect(() => {
    if (!open) {
      setCategoryFilter("")
      setComponentFilter("")
      setManufacturerFilter("")
      setSearchTerm("")
    }
  }, [open])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [categories, setCategories] = useState<ComponentCategory[]>([])
  const [availableComponents, setAvailableComponents] = useState<{ id: string; name: string }[]>([])
  const [creating, setCreating] = useState(false)
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

  // Fetch categories on mount
  useEffect(() => {
    if (createModalOpen) {
      fetchCategories()
    }
  }, [createModalOpen])

  // Update available components when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId)
      setAvailableComponents(category?.components || [])
      setFormData(prev => ({ ...prev, componentId: "" }))
    } else {
      setAvailableComponents([])
    }
  }, [formData.categoryId, categories])

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

  // Get unique categories, components, and manufacturers for filters
  const filterCategories = useMemo(() => {
    const unique = new Map<string, string>()
    catalogItems.forEach((item) => {
      if (!unique.has(item.category.id)) {
        unique.set(item.category.id, item.category.name)
      }
    })
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }))
  }, [catalogItems])

  const components = useMemo(() => {
    const unique = new Map<string, string>()
    catalogItems.forEach((item) => {
      if (!unique.has(item.component.id)) {
        unique.set(item.component.id, item.component.name)
      }
    })
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }))
  }, [catalogItems])

  const manufacturers = useMemo(() => {
    const unique = new Set<string>()
    catalogItems.forEach((item) => {
      if (item.manufacturer) {
        unique.add(item.manufacturer)
      }
    })
    return Array.from(unique).sort()
  }, [catalogItems])

  // Filter catalog items
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          item.category.name.toLowerCase().includes(search) ||
          item.component.name.toLowerCase().includes(search) ||
          (item.manufacturer && item.manufacturer.toLowerCase().includes(search)) ||
          (item.modelNumber && item.modelNumber.toLowerCase().includes(search)) ||
          (item.description && item.description.toLowerCase().includes(search)) ||
          (item.finish && item.finish.toLowerCase().includes(search)) ||
          (item.color && item.color.toLowerCase().includes(search))
        
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter && item.categoryId !== categoryFilter) {
        return false
      }

      // Component filter
      if (componentFilter && item.componentId !== componentFilter) {
        return false
      }

      // Manufacturer filter
      if (manufacturerFilter && item.manufacturer !== manufacturerFilter) {
        return false
      }

      return true
    })
  }, [catalogItems, searchTerm, categoryFilter, componentFilter, manufacturerFilter])

  const handleSelect = (itemId: string) => {
    onSelect(itemId)
    onOpenChange(false)
    // Don't reset filters here - let the useEffect handle it when modal closes
  }

  const handleClear = () => {
    onSelect(null)
    onOpenChange(false)
    // Don't reset filters here - let the useEffect handle it when modal closes
  }

  const handleCreateCatalogItem = async () => {
    if (!formData.categoryId || !formData.componentId) {
      alert("Category and Component are required")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create catalog item")
      }

      const newItem = await response.json()
      
      // Close create modal and reset form
      setCreateModalOpen(false)
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

      // Refresh catalog items
      if (onCatalogItemCreated) {
        onCatalogItemCreated()
      }

      // Automatically select the newly created item
      onSelect(newItem.id)
      onOpenChange(false)
      setSearchTerm("")
      setCategoryFilter("")
      setComponentFilter("")
      setManufacturerFilter("")
    } catch (error: any) {
      console.error("Error creating catalog item:", error)
      alert(error?.message || "Failed to create catalog item")
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] h-[90vh] p-0">
          <div className="w-full max-w-full flex flex-col h-full">
            <DrawerHeader className="px-6 pb-4 border-b">
              <DrawerTitle>Select Catalog Item</DrawerTitle>
              <DrawerDescription>
                Search and filter through catalog items to find the material you need
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-hidden flex flex-col gap-4 px-6 py-4">
              {/* Search and Filters */}
              <div className="space-y-4 flex-shrink-0">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by category, component, manufacturer, model, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(true)}
                    className="shrink-0"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={categoryFilter || undefined} 
                      onValueChange={(value) => setCategoryFilter(value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categoryFilter && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCategoryFilter("")}
                        className="h-6 text-xs"
                      >
                        Clear filter
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Component</Label>
                    <Select 
                      value={componentFilter || undefined} 
                      onValueChange={(value) => setComponentFilter(value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Components" />
                      </SelectTrigger>
                      <SelectContent>
                        {components.map((component) => (
                          <SelectItem key={component.id} value={component.id}>
                            {component.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {componentFilter && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setComponentFilter("")}
                        className="h-6 text-xs"
                      >
                        Clear filter
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Select 
                      value={manufacturerFilter || undefined} 
                      onValueChange={(value) => setManufacturerFilter(value || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Manufacturers" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map((manufacturer) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {manufacturerFilter && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setManufacturerFilter("")}
                        className="h-6 text-xs"
                      >
                        Clear filter
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-500">
                  Showing {filteredItems.length} of {catalogItems.length} items
                </div>
              </div>

              {/* Catalog Items Grid */}
              <div className="flex-1 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No catalog items found matching your criteria
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
                    {filteredItems.map((item) => {
                      const manufacturerModelFinish = [
                        item.manufacturer,
                        item.modelNumber,
                        item.finish,
                      ]
                        .filter(Boolean)
                        .join(" - ")

                      const headerText = item.description || manufacturerModelFinish || `${item.category.name} - ${item.component.name}`

                      const isSelected = item.id === selectedItemId

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item.id)}
                          className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                            isSelected 
                              ? "border-blue-500 bg-blue-50 shadow-md" 
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          {/* Image */}
                          <div className="aspect-square w-full mb-2 rounded overflow-hidden bg-gray-50 border border-gray-200">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={headerText}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="space-y-1">
                            <div className="font-medium text-xs text-gray-900 line-clamp-2">
                              {headerText}
                            </div>
                            {item.color && (
                              <div className="text-xs text-gray-600">Color: {item.color}</div>
                            )}
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {item.category.name} - {item.component.name}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter className="px-6 pt-4 border-t">
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                {selectedItemId && (
                  <Button variant="outline" onClick={handleClear} className="flex-1">
                    Clear Selection
                  </Button>
                )}
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create Catalog Item Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Catalog Item</DialogTitle>
            <DialogDescription>
              Create a new catalog item that will be available for selection
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-category" className="text-xs">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  setFormData({ ...formData, categoryId: value, componentId: "" })
                }}
              >
                <SelectTrigger id="new-category" className="h-8 text-xs">
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
              <Label htmlFor="new-component" className="text-xs">Component *</Label>
              <Select
                value={formData.componentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, componentId: value })
                }
                disabled={!formData.categoryId}
              >
                <SelectTrigger id="new-component" className="h-8 text-xs">
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
              <Label htmlFor="new-description" className="text-xs">Description</Label>
              <Textarea
                id="new-description"
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
                <Label htmlFor="new-modelNumber" className="text-xs">Model Number</Label>
                <Input
                  id="new-modelNumber"
                  value={formData.modelNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, modelNumber: e.target.value })
                  }
                  placeholder="Enter model number"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-manufacturer" className="text-xs">Manufacturer</Label>
                <Input
                  id="new-manufacturer"
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
                <Label htmlFor="new-finish" className="text-xs">Finish</Label>
                <Input
                  id="new-finish"
                  value={formData.finish}
                  onChange={(e) =>
                    setFormData({ ...formData, finish: e.target.value })
                  }
                  placeholder="Enter finish"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-color" className="text-xs">Color</Label>
                <Input
                  id="new-color"
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
              <Label htmlFor="new-imageUrl" className="text-xs">Image URL</Label>
              <Input
                id="new-imageUrl"
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
                setCreateModalOpen(false)
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
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCatalogItem}
              disabled={creating || !formData.categoryId || !formData.componentId}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
