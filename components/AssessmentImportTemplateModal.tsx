"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface TemplateComponent {
  id: string
  componentType: string
  componentName: string | null
}

interface TemplateRoom {
  id: string
  name: string
  type: string | null
  templateComponents: TemplateComponent[]
}

interface Template {
  id: string
  name: string
  templateRooms: TemplateRoom[]
}

interface AssessmentImportTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId: string
  onSuccess: () => void
}

export function AssessmentImportTemplateModal({
  open,
  onOpenChange,
  assessmentId,
  onSuccess,
}: AssessmentImportTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      fetchTemplates()
      setSelectedTemplateId("")
      setSelectedRoomIds(new Set())
      setSearchTerm("")
      setError("")
    }
  }, [open])

  const fetchTemplates = async () => {
    setLoading(true)
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const filteredTemplates = templates.filter((template) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return template.name.toLowerCase().includes(searchLower)
  })

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setSelectedRoomIds(new Set())
  }

  const handleRoomToggle = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

  const handleSelectAllRooms = () => {
    if (!selectedTemplate) return
    if (selectedRoomIds.size === selectedTemplate.templateRooms.length) {
      setSelectedRoomIds(new Set())
    } else {
      setSelectedRoomIds(new Set(selectedTemplate.templateRooms.map((r) => r.id)))
    }
  }

  const handleImport = async () => {
    if (!selectedTemplateId || selectedRoomIds.size === 0) {
      setError("Please select a template and at least one room")
      return
    }

    setImporting(true)
    setError("")

    try {
      const response = await fetch("/api/rooms/import-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          templateRoomIds: Array.from(selectedRoomIds),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to import template rooms")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Template</DialogTitle>
          <DialogDescription>
            Select a template and choose which rooms to import into this assessment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Select Template *</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 bg-white p-2 border-b">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-2 h-9 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {loading ? (
                  <div className="p-2 text-sm text-gray-500">Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    {searchTerm ? "No templates match your search" : "No templates available"}
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-gray-500">
                          {template.templateRooms.length} room
                          {template.templateRooms.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && selectedTemplate.templateRooms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Rooms to Import *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllRooms}
                >
                  {selectedRoomIds.size === selectedTemplate.templateRooms.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {selectedTemplate.templateRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <Checkbox
                      id={room.id}
                      checked={selectedRoomIds.has(room.id)}
                      onCheckedChange={() => handleRoomToggle(room.id)}
                    />
                    <label
                      htmlFor={room.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{room.name}</div>
                      <div className="text-xs text-gray-500">
                        {room.templateComponents.length} component
                        {room.templateComponents.length !== 1 ? "s" : ""}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !selectedTemplateId || selectedRoomIds.size === 0}
          >
            {importing ? "Importing..." : "Import Rooms"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}






