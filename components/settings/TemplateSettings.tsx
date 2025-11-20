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
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline"

interface TemplateComponent {
  id: string
  componentType: string
  componentName: string | null
  condition: string | null
  quantity: number
  unitCost: number
  notes: string | null
}

interface TemplateRoom {
  id: string
  name: string
  type: string | null
  order: number
  templateComponents: TemplateComponent[]
}

interface Template {
  id: string
  name: string
  createdAt: string
  templateRooms: TemplateRoom[]
}

export function TemplateSettings() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  
  // Add/Edit state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: "",
  })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/settings/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      setError("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateForm.name.trim()) {
      setError("Template name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/settings/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add template")
      }

      setTemplateForm({ name: "" })
      setAddDialogOpen(false)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleEditTemplateStart = (template: Template) => {
    setEditingTemplateId(template.id)
    setTemplateForm({
      name: template.name,
    })
    setError("")
  }

  const handleEditTemplateCancel = () => {
    setEditingTemplateId(null)
    setTemplateForm({ name: "" })
    setError("")
  }

  const handleEditTemplateSave = async (templateId: string) => {
    if (!templateForm.name.trim()) {
      setError("Template name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/settings/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update template")
      }

      setEditingTemplateId(null)
      setTemplateForm({ name: "" })
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      const response = await fetch(`/api/settings/templates/${selectedTemplate.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      setDeleteDialogOpen(false)
      setSelectedTemplate(null)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading templates...</div>
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
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Create and manage templates for quick room and component setup in assessments and selections
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>Create Template</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates found. Create your first template to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const totalComponents = template.templateRooms.reduce(
                    (sum, room) => sum + room.templateComponents.length,
                    0
                  )
                  
                  return (
                    <TableRow key={template.id}>
                      {editingTemplateId === template.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={templateForm.name}
                              onChange={(e) =>
                                setTemplateForm({ ...templateForm, name: e.target.value })
                              }
                              placeholder="Template Name"
                              className="h-8"
                              autoFocus
                            />
                          </TableCell>
                          <TableCell colSpan={3} />
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTemplateSave(template.id)}
                                disabled={saving}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleEditTemplateCancel}
                                disabled={saving}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>{template.templateRooms.length}</TableCell>
                          <TableCell>{totalComponents}</TableCell>
                          <TableCell>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.href = `/dashboard/settings/templates/${template.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditTemplateStart(template)}
                              >
                                <PencilIcon className="h-4 w-4" title="Rename" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTemplate(template)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Enter a name for the template. You&apos;ll be able to add rooms and components after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
                placeholder="Template Name"
                required
                autoFocus
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
                  setTemplateForm({ name: "" })
                  setError("")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedTemplate?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

