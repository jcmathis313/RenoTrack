"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface Component {
  id: string
  name: string
  order: number
  isDefault: boolean
  categoryId: string
}

interface ComponentCategory {
  id: string
  name: string
  order: number
  isDefault: boolean
  components: Component[]
}

export function ComponentSettings() {
  const [categories, setCategories] = useState<ComponentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"category" | "component">("category")
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null)
  
  // Category state
  const [newCategoryName, setNewCategoryName] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")
  
  // Component state
  const [newComponentName, setNewComponentName] = useState("")
  const [addingComponentCategoryId, setAddingComponentCategoryId] = useState<string | null>(null)
  const [addingComponent, setAddingComponent] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [editingComponentName, setEditingComponentName] = useState("")
  
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/settings/component-category")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        // Expand all categories by default
        setExpandedCategories(new Set(data.map((cat: ComponentCategory) => cat.id)))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setAddingCategory(true)
    setError("")

    try {
      const response = await fetch("/api/settings/component-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          order: categories.length,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add category")
      }

      setNewCategoryName("")
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setAddingCategory(false)
    }
  }

  const handleEditCategoryStart = (category: ComponentCategory) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
    setError("")
  }

  const handleEditCategoryCancel = () => {
    setEditingCategoryId(null)
    setEditingCategoryName("")
    setError("")
  }

  const handleEditCategorySave = async (categoryId: string) => {
    if (!editingCategoryName.trim()) return

    setError("")

    try {
      const response = await fetch(`/api/settings/component-category/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategoryName.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update category")
      }

      setEditingCategoryId(null)
      setEditingCategoryName("")
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleDeleteCategory = (category: ComponentCategory) => {
    setDeleteType("category")
    setSelectedItem({ id: category.id, name: category.name })
    setDeleteDialogOpen(true)
  }

  const handleAddComponent = async (e: React.FormEvent, categoryId: string) => {
    e.preventDefault()
    if (!newComponentName.trim()) return

    setAddingComponent(true)
    setError("")

    try {
      const category = categories.find((c) => c.id === categoryId)
      const componentCount = category?.components.length ?? 0

      const response = await fetch("/api/settings/component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newComponentName.trim(),
          categoryId,
          order: componentCount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add component")
      }

      setNewComponentName("")
      setAddingComponentCategoryId(null)
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setAddingComponent(false)
    }
  }

  const handleEditComponentStart = (component: Component) => {
    setEditingComponentId(component.id)
    setEditingComponentName(component.name)
    setError("")
  }

  const handleEditComponentCancel = () => {
    setEditingComponentId(null)
    setEditingComponentName("")
    setError("")
  }

  const handleEditComponentSave = async (componentId: string) => {
    if (!editingComponentName.trim()) return

    setError("")

    try {
      const response = await fetch(`/api/settings/component/${componentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingComponentName.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update component")
      }

      setEditingComponentId(null)
      setEditingComponentName("")
      fetchCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleDeleteComponent = (component: Component) => {
    setDeleteType("component")
    setSelectedItem({ id: component.id, name: component.name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedItem) return

    try {
      const endpoint = deleteType === "category"
        ? `/api/settings/component-category/${selectedItem.id}`
        : `/api/settings/component/${selectedItem.id}`

      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete")
      }

      setDeleteDialogOpen(false)
      setSelectedItem(null)
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading components...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Components</CardTitle>
          <CardDescription>
            Manage component categories and their associated components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-sm text-gray-500">
                        No categories found. Add one below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <React.Fragment key={category.id}>
                        {/* Category Row */}
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategory(category.id)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedCategories.has(category.id) ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {editingCategoryId === category.id ? (
                              <Input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="w-full max-w-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditCategorySave(category.id)
                                  } else if (e.key === "Escape") {
                                    handleEditCategoryCancel()
                                  }
                                }}
                              />
                            ) : (
                              <span className="font-semibold">{category.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {category.isDefault ? "Default" : "Custom"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editingCategoryId === category.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategorySave(category.id)}
                                  >
                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEditCategoryCancel}
                                  >
                                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategoryStart(category)}
                                    disabled={category.isDefault}
                                  >
                                    <PencilIcon
                                      className={cn(
                                        "h-4 w-4",
                                        category.isDefault ? "text-gray-300" : ""
                                      )}
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                    disabled={category.isDefault}
                                  >
                                    <TrashIcon
                                      className={cn(
                                        "h-4 w-4",
                                        category.isDefault ? "text-gray-300" : "text-destructive"
                                      )}
                                    />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setAddingComponentCategoryId(category.id)
                                      setExpandedCategories(new Set([...expandedCategories, category.id]))
                                    }}
                                  >
                                    <span className="text-xs">+ Component</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Component Rows */}
                        {expandedCategories.has(category.id) && (
                          <>
                            {category.components.map((component) => (
                              <TableRow key={component.id} className="bg-gray-50">
                                <TableCell></TableCell>
                                <TableCell className="pl-8">
                                  {editingComponentId === component.id ? (
                                    <Input
                                      value={editingComponentName}
                                      onChange={(e) => setEditingComponentName(e.target.value)}
                                      className="w-full max-w-xs"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleEditComponentSave(component.id)
                                        } else if (e.key === "Escape") {
                                          handleEditComponentCancel()
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-sm">— {component.name}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-gray-400">
                                    {component.isDefault ? "Default" : "Custom"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {editingComponentId === component.id ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditComponentSave(component.id)}
                                        >
                                          <CheckIcon className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleEditComponentCancel}
                                        >
                                          <XMarkIcon className="h-4 w-4 text-gray-500" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditComponentStart(component)}
                                          disabled={component.isDefault}
                                        >
                                          <PencilIcon
                                            className={cn(
                                              "h-4 w-4",
                                              component.isDefault ? "text-gray-300" : ""
                                            )}
                                          />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteComponent(component)}
                                          disabled={component.isDefault}
                                        >
                                          <TrashIcon
                                            className={cn(
                                              "h-4 w-4",
                                              component.isDefault ? "text-gray-300" : "text-destructive"
                                            )}
                                          />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Add Component Form */}
                            {addingComponentCategoryId === category.id && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={4}>
                                  <form
                                    onSubmit={(e) => handleAddComponent(e, category.id)}
                                    className="flex items-center gap-2 pl-8"
                                  >
                                    <Input
                                      value={newComponentName}
                                      onChange={(e) => {
                                        setNewComponentName(e.target.value)
                                        setError("")
                                      }}
                                      placeholder="Add new component"
                                      className="flex-1 max-w-xs"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          setAddingComponentCategoryId(null)
                                          setNewComponentName("")
                                        }
                                      }}
                                    />
                                    <Button type="submit" disabled={addingComponent || !newComponentName.trim()} size="sm">
                                      {addingComponent ? "Adding..." : "Add"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setAddingComponentCategoryId(null)
                                        setNewComponentName("")
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </form>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className={cn(
              "flex items-center gap-2",
              categories.length > 0 && "pt-2 border-t"
            )}>
              <Input
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value)
                  setError("")
                }}
                placeholder="Add new component category"
                className="flex-1 max-w-xs"
              />
              <Button type="submit" disabled={addingCategory || !newCategoryName.trim()}>
                {addingCategory ? "Adding..." : "Add Category"}
              </Button>
            </form>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteType === "category" ? "Category" : "Component"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
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
    </>
  )
}
