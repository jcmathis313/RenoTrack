"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowLeftIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface ComponentCategory {
  id: string
  name: string
  components: {
    id: string
    name: string
  }[]
}

interface ComponentStatus {
  id: string
  name: string
  color?: string
}

interface RoomTemplate {
  id: string
  name: string
}

interface Room {
  id: string
  name: string
  type: string | null
  order: number
  componentAssessments: ComponentAssessment[]
}

interface ComponentAssessment {
  id: string
  componentType: string
  componentName: string | null
  condition: string
  notes: string | null
}

interface Assessment {
  id: string
  assessedBy: string | null
  assessedAt: string
  unit: {
    id: string
    number: string
    building: {
      name: string
      community: {
        id: string
        name: string
        logoUrl: string | null
      }
    }
  }
  rooms: Room[]
}

export default function AssessmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params?.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [componentCategories, setComponentCategories] = useState<ComponentCategory[]>([])
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([])
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [addComponentOpen, setAddComponentOpen] = useState<string | null>(null)

  const [newRoomName, setNewRoomName] = useState("")
  const [filteredRooms, setFilteredRooms] = useState<RoomTemplate[]>([])
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(-1)
  const [addingRoom, setAddingRoom] = useState(false)

  const [newComponent, setNewComponent] = useState({
    selectedComponents: [] as Array<{ categoryId: string; categoryName: string; componentId: string; componentName: string }>,
    condition: "",
    notes: "",
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [componentSearchTerm, setComponentSearchTerm] = useState("")
  const [addingComponent, setAddingComponent] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  const [editingComponent, setEditingComponent] = useState<{
    componentType: string
    condition: string
    notes: string
  } | null>(null)
  const [reorderingRooms, setReorderingRooms] = useState(false)
  const [savingComponent, setSavingComponent] = useState(false)
  const [deletingComponent, setDeletingComponent] = useState(false)

  useEffect(() => {
    if (assessmentId) {
      fetchData()
    } else {
      setLoading(false)
      console.error("Assessment ID not found in params")
    }
  }, [assessmentId])

  const fetchData = async () => {
    if (!assessmentId) {
      console.error("Cannot fetch data: assessmentId is missing")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log("Fetching assessment with ID:", assessmentId)
      const [assessmentRes, categoriesRes, statusesRes, roomTemplatesRes] = await Promise.all([
        fetch(`/api/assessments/${assessmentId}`),
        fetch("/api/settings/component-category"),
        fetch("/api/settings/component-status"),
        fetch("/api/settings/room-template"),
      ])

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json()
        setAssessment(assessmentData)
      } else {
        // Handle error response
        const errorData = await assessmentRes.json().catch(() => ({}))
        console.error("Error fetching assessment:", assessmentRes.status, errorData)
        setAssessment(null)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setComponentCategories(categoriesData)
      }

      if (statusesRes.ok) {
        const statusesData = await statusesRes.json()
        setComponentStatuses(statusesData)
      }

      if (roomTemplatesRes.ok) {
        const roomTemplatesData = await roomTemplatesRes.json()
        setRoomTemplates(roomTemplatesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoomInputChange = (value: string) => {
    setNewRoomName(value)
    if (value.trim()) {
      const filtered = roomTemplates.filter((room) =>
        room.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredRooms(filtered)
      setShowRoomDropdown(true)
      setSelectedRoomIndex(-1)
    } else {
      setFilteredRooms([])
      setShowRoomDropdown(false)
    }
  }

  const handleRoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedRoomIndex((prev) =>
        prev < filteredRooms.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedRoomIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedRoomIndex >= 0 && filteredRooms[selectedRoomIndex]) {
        // Select the highlighted room
        handleSelectRoom(filteredRooms[selectedRoomIndex].name)
      } else if (newRoomName.trim()) {
        // Create new room (will be handled in handleAddRoom)
        handleAddRoom(e)
      }
    } else if (e.key === "Escape") {
      setShowRoomDropdown(false)
    }
  }

  const handleSelectRoom = (roomName: string) => {
    setNewRoomName(roomName)
    setShowRoomDropdown(false)
    setSelectedRoomIndex(-1)
  }

  const handleCreateRoomTemplate = async (roomName: string) => {
    try {
      const response = await fetch("/api/settings/room-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim(),
          order: roomTemplates.length,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create room template")
      }

      const newTemplate = await response.json()
      setRoomTemplates((prev) => [...prev, newTemplate])
      return newTemplate
    } catch (error) {
      console.error("Error creating room template:", error)
      throw error
    }
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    setAddingRoom(true)
    try {
      const roomName = newRoomName.trim()

      // Check if room template exists, if not create it
      const existingTemplate = roomTemplates.find(
        (rt) => rt.name.toLowerCase() === roomName.toLowerCase()
      )

      if (!existingTemplate) {
        // Create new room template first
        await handleCreateRoomTemplate(roomName)
      }

      // Create room in assessment
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          name: roomName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add room")
      }

      setNewRoomName("")
      setShowRoomDropdown(false)
      setSelectedRoomIndex(-1)
      setAddRoomOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error adding room:", error)
      alert("Failed to add room")
    } finally {
      setAddingRoom(false)
    }
  }

  const handleAddComponent = async (e: React.FormEvent, roomId: string) => {
    e.preventDefault()
    if (newComponent.selectedComponents.length === 0 || !newComponent.condition) {
      return
    }

    setAddingComponent(true)
    try {
      // Create all component assessments in parallel
      const promises = newComponent.selectedComponents.map((selected) =>
        fetch("/api/component-assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            componentType: selected.componentName,
            componentName: null,
            condition: newComponent.condition,
            notes: newComponent.notes || null,
          }),
        })
      )

      const responses = await Promise.all(promises)
      const failed = responses.find((r) => !r.ok)

      if (failed) {
        throw new Error("Failed to add one or more components")
      }

      // Reset form
      setNewComponent({
        selectedComponents: [],
        condition: "",
        notes: "",
      })
      setExpandedCategories(new Set())
      setComponentSearchTerm("")
      setAddComponentOpen(null)
      fetchData()
    } catch (error) {
      console.error("Error adding components:", error)
      alert("Failed to add components")
    } finally {
      setAddingComponent(false)
    }
  }

  const toggleComponentSelection = (
    categoryId: string,
    categoryName: string,
    componentId: string,
    componentName: string
  ) => {
    setNewComponent((prev) => {
      const exists = prev.selectedComponents.some(
        (c) => c.categoryId === categoryId && c.componentId === componentId
      )

      if (exists) {
        return {
          ...prev,
          selectedComponents: prev.selectedComponents.filter(
            (c) => !(c.categoryId === categoryId && c.componentId === componentId)
          ),
        }
      } else {
        return {
          ...prev,
          selectedComponents: [
            ...prev.selectedComponents,
            { categoryId, categoryName, componentId, componentName },
          ],
        }
      }
    })
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

  const isComponentSelected = (categoryId: string, componentId: string) => {
    return newComponent.selectedComponents.some(
      (c) => c.categoryId === categoryId && c.componentId === componentId
    )
  }

  // Filter categories and components based on search term
  const filteredCategories = componentSearchTerm
    ? componentCategories
        .map((category) => ({
          ...category,
          components: category.components.filter((component) =>
            component.name.toLowerCase().includes(componentSearchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.components.length > 0)
    : componentCategories

  const handleRowClick = (component: ComponentAssessment) => {
    if (editingComponentId === component.id) {
      // Clicking the same row closes it
      setEditingComponentId(null)
      setEditingComponent(null)
    } else {
      // Open this row for editing
      setEditingComponentId(component.id)
      setEditingComponent({
        componentType: component.componentType,
        condition: component.condition,
        notes: component.notes || "",
      })
    }
  }

  const handleMoveRoom = async (roomId: string, direction: "up" | "down") => {
    if (!assessment || reorderingRooms) return

    // Sort rooms by current order
    const rooms = [...assessment.rooms].sort((a, b) => a.order - b.order)
    const currentIndex = rooms.findIndex((r) => r.id === roomId)
    
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= rooms.length) return

    // Move the room in the array
    const [movedRoom] = rooms.splice(currentIndex, 1)
    rooms.splice(newIndex, 0, movedRoom)

    // Reassign sequential order values (0, 1, 2, ...) to all rooms
    const updates = rooms.map((room, index) => ({
      id: room.id,
      order: index,
    }))

    // Update all rooms with their new order
    setReorderingRooms(true)
    try {
      await Promise.all(
        updates.map(({ id, order }) =>
          fetch(`/api/rooms/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order }),
          })
        )
      )

      // Refresh data to get the updated order
      await fetchData()
    } catch (error) {
      console.error("Error reordering rooms:", error)
      alert("Failed to reorder rooms")
    } finally {
      setReorderingRooms(false)
    }
  }

  const handleSaveComponent = async (componentId: string) => {
    if (!editingComponent) return

    setSavingComponent(true)
    try {
      const response = await fetch(`/api/component-assessments/${componentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: editingComponent.componentType,
          componentName: null,
          condition: editingComponent.condition,
          notes: editingComponent.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update component")
      }

      setEditingComponentId(null)
      setEditingComponent(null)
      fetchData()
    } catch (error) {
      console.error("Error updating component:", error)
      alert("Failed to update component")
    } finally {
      setSavingComponent(false)
    }
  }

  const handleDeleteComponent = async (componentId: string) => {
    setDeletingComponent(true)
    try {
      const response = await fetch(`/api/component-assessments/${componentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete component")
      }

      setDeleteConfirmOpen(null)
      setEditingComponentId(null)
      setEditingComponent(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting component:", error)
      alert("Failed to delete component")
    } finally {
      setDeletingComponent(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading assessment...</div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Assessment not found</div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/assessments">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assessments
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/assessments">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment</h1>
            <p className="mt-1 text-sm text-gray-500">
              {assessment.unit.building.community.name} - {assessment.unit.building.name} - Unit {assessment.unit.number}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">Assessment Details</CardTitle>
            {assessment.unit.building.community.logoUrl && (
              <div className="h-8 w-8 relative">
                <img
                  src={assessment.unit.building.community.logoUrl}
                  alt={`${assessment.unit.building.community.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2">
            <div>
              <Label className="text-gray-500 text-xs">Community</Label>
              <p className="text-xs font-medium mt-0.5">{assessment.unit.building.community.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Building</Label>
              <p className="text-xs font-medium mt-0.5">{assessment.unit.building.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Unit</Label>
              <p className="text-xs font-medium mt-0.5">Unit {assessment.unit.number}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Assessment Date</Label>
              <p className="text-xs font-medium mt-0.5">
                {new Date(assessment.assessedAt).toLocaleDateString()}
              </p>
            </div>
            {assessment.assessedBy && (
              <div>
                <Label className="text-gray-500 text-xs">Assessed By</Label>
                <p className="text-xs font-medium mt-0.5">{assessment.assessedBy}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <Button onClick={() => setAddRoomOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {assessment.rooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-500">
              No rooms added yet. Add a room to start assessing components.
            </CardContent>
          </Card>
        ) : (
          assessment.rooms.map((room, roomIndex) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{room.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveRoom(room.id, "up")
                        }}
                        disabled={roomIndex === 0 || reorderingRooms}
                        title="Move up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveRoom(room.id, "down")
                        }}
                        disabled={roomIndex === assessment.rooms.length - 1 || reorderingRooms}
                        title="Move down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddComponentOpen(room.id)}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {room.componentAssessments.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    No components assessed yet. Add components to this room.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Component Type</TableHead>
                          <TableHead className="w-1/4">Condition</TableHead>
                          <TableHead className="w-1/2">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {room.componentAssessments.map((component) => (
                          <React.Fragment key={component.id}>
                            <TableRow
                              className={`cursor-pointer hover:bg-gray-50 ${
                                editingComponentId === component.id ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleRowClick(component)}
                            >
                              <TableCell className="w-1/4">
                                <span className="text-xs font-medium">{component.componentType}</span>
                              </TableCell>
                              <TableCell className="w-1/4">
                                {(() => {
                                  const status = componentStatuses.find(s => s.name === component.condition)
                                  const color = status?.color || "gray"
                                  const colorClasses = {
                                    green: "bg-green-50 text-green-700",
                                    orange: "bg-orange-50 text-orange-700",
                                    blue: "bg-blue-50 text-blue-700",
                                    red: "bg-red-50 text-red-700",
                                    gray: "bg-gray-50 text-gray-700",
                                    yellow: "bg-yellow-50 text-yellow-700",
                                    purple: "bg-purple-50 text-purple-700",
                                  }
                                  return (
                                    <span className={cn(
                                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                      colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
                                    )}>
                                      {component.condition}
                                    </span>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="w-1/2">
                                {component.notes ? (
                                  <span className="text-xs whitespace-pre-wrap">{component.notes}</span>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                            {editingComponentId === component.id && editingComponent && (
                              <TableRow className="bg-blue-50">
                                <TableCell colSpan={3} className="p-4">
                                  <div
                                    className="space-y-4"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`edit-componentType-${component.id}`} className="text-xs">
                                          Component Type *
                                        </Label>
                                        <Input
                                          id={`edit-componentType-${component.id}`}
                                          value={editingComponent.componentType}
                                          onChange={(e) =>
                                            setEditingComponent({
                                              ...editingComponent,
                                              componentType: e.target.value,
                                            })
                                          }
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`edit-condition-${component.id}`} className="text-xs">
                                          Condition *
                                        </Label>
                                        <Select
                                          value={editingComponent.condition}
                                          onValueChange={(value) =>
                                            setEditingComponent({
                                              ...editingComponent,
                                              condition: value,
                                            })
                                          }
                                        >
                                          <SelectTrigger id={`edit-condition-${component.id}`} className="h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {componentStatuses.map((status) => {
                                              const color = status.color || "gray"
                                              const colorClasses = {
                                                green: "bg-green-500",
                                                orange: "bg-orange-500",
                                                blue: "bg-blue-500",
                                                red: "bg-red-500",
                                                gray: "bg-gray-500",
                                                yellow: "bg-yellow-500",
                                                purple: "bg-purple-500",
                                              }
                                              return (
                                                <SelectItem key={status.id} value={status.name}>
                                                  <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                      "w-3 h-3 rounded-full border border-gray-300",
                                                      colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
                                                    )} />
                                                    <span>{status.name}</span>
                                                  </div>
                                                </SelectItem>
                                              )
                                            })}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`edit-notes-${component.id}`} className="text-xs">
                                        Notes
                                      </Label>
                                      <textarea
                                        id={`edit-notes-${component.id}`}
                                        value={editingComponent.notes}
                                        onChange={(e) =>
                                          setEditingComponent({
                                            ...editingComponent,
                                            notes: e.target.value,
                                          })
                                        }
                                        placeholder="Optional notes..."
                                        rows={4}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteConfirmOpen(component.id)}
                                        disabled={deletingComponent}
                                      >
                                        Delete
                                      </Button>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingComponentId(null)
                                            setEditingComponent(null)
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => handleSaveComponent(component.id)}
                                          disabled={
                                            savingComponent ||
                                            !editingComponent.componentType ||
                                            !editingComponent.condition
                                          }
                                        >
                                          {savingComponent ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={(open) => {
        setAddRoomOpen(open)
        if (!open) {
          setNewRoomName("")
          setShowRoomDropdown(false)
          setSelectedRoomIndex(-1)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Type to search existing rooms or press Enter to create a new one
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoom}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName" className="text-xs">Room Name *</Label>
                <div className="relative">
                  <Input
                    id="roomName"
                    value={newRoomName}
                    onChange={(e) => handleRoomInputChange(e.target.value)}
                    onKeyDown={handleRoomInputKeyDown}
                    className="h-8 text-xs"
                    onFocus={() => {
                      if (newRoomName.trim() && filteredRooms.length > 0) {
                        setShowRoomDropdown(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setShowRoomDropdown(false), 200)
                    }}
                    placeholder="Type to search rooms (e.g., Kitchen, Living Room)"
                    required
                    autoComplete="off"
                  />
                  {showRoomDropdown && filteredRooms.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredRooms.map((room, index) => (
                        <div
                          key={room.id}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                            index === selectedRoomIndex ? "bg-gray-100" : ""
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectRoom(room.name)
                          }}
                        >
                          {room.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {showRoomDropdown && newRoomName.trim() && filteredRooms.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500">
                      No matching rooms. Press Enter to create "{newRoomName}"
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {newRoomName.trim() && filteredRooms.length === 0
                    ? "Press Enter to create this room and add it to your room templates"
                    : "Use arrow keys to navigate, Enter to select or create"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddRoomOpen(false)
                setNewRoomName("")
                setShowRoomDropdown(false)
                setSelectedRoomIndex(-1)
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingRoom || !newRoomName.trim()}>
                {addingRoom ? "Adding..." : "Add Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog
        open={addComponentOpen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddComponentOpen(null)
            setNewComponent({
              selectedComponents: [],
              condition: "",
              notes: "",
            })
            setExpandedCategories(new Set())
            setComponentSearchTerm("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Components</DialogTitle>
            <DialogDescription>
              Select multiple components to add to this room. All selected components will share the same condition.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => handleAddComponent(e, addComponentOpen!)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="space-y-4 py-4 flex-1 min-h-0 flex flex-col">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="componentSearch" className="text-xs">Search Components</Label>
                <Input
                  id="componentSearch"
                  value={componentSearchTerm}
                  onChange={(e) => {
                    setComponentSearchTerm(e.target.value)
                    // Auto-expand categories when searching
                    if (e.target.value.trim()) {
                      setExpandedCategories(new Set(componentCategories.map((c) => c.id)))
                    }
                  }}
                  placeholder="Type to search components..."
                  autoComplete="off"
                  className="h-8 text-xs"
                />
              </div>

              {/* Selected Components Summary */}
              {newComponent.selectedComponents.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    {newComponent.selectedComponents.length} component
                    {newComponent.selectedComponents.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {newComponent.selectedComponents.map((selected, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        {selected.componentName}
                        <button
                          type="button"
                          onClick={() => toggleComponentSelection(
                            selected.categoryId,
                            selected.categoryName,
                            selected.componentId,
                            selected.componentName
                          )}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Component List */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No components found
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-2 w-full text-left font-medium text-sm hover:bg-gray-50 p-2 rounded"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                        {category.name}
                        <span className="text-xs text-gray-500">
                          ({category.components.length})
                        </span>
                      </button>
                      {expandedCategories.has(category.id) && (
                        <div className="ml-6 space-y-1">
                          {category.components.map((component) => {
                            const selected = isComponentSelected(category.id, component.id)
                            return (
                              <label
                                key={component.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    toggleComponentSelection(
                                      category.id,
                                      category.name,
                                      component.id,
                                      component.name
                                    )
                                  }
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{component.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-xs">Condition *</Label>
                <Select
                  value={newComponent.condition}
                  onValueChange={(value) =>
                    setNewComponent({ ...newComponent, condition: value })
                  }
                >
                  <SelectTrigger id="condition" className="h-8 text-xs">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentStatuses.map((status) => {
                      const color = status.color || "gray"
                      const colorClasses = {
                        green: "bg-green-500",
                        orange: "bg-orange-500",
                        blue: "bg-blue-500",
                        red: "bg-red-500",
                        gray: "bg-gray-500",
                        yellow: "bg-yellow-500",
                        purple: "bg-purple-500",
                      }
                      return (
                        <SelectItem key={status.id} value={status.name}>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full border border-gray-300",
                              colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
                            )} />
                            <span>{status.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  value={newComponent.notes}
                  onChange={(e) =>
                    setNewComponent({ ...newComponent, notes: e.target.value })
                  }
                  placeholder="Additional notes (applies to all selected components)..."
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddComponentOpen(null)
                  setNewComponent({
                    selectedComponents: [],
                    condition: "",
                    notes: "",
                  })
                  setExpandedCategories(new Set())
                  setComponentSearchTerm("")
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  addingComponent ||
                  newComponent.selectedComponents.length === 0 ||
                  !newComponent.condition
                }
              >
                {addingComponent
                  ? `Adding ${newComponent.selectedComponents.length} component${newComponent.selectedComponents.length !== 1 ? "s" : ""}...`
                  : newComponent.selectedComponents.length > 0
                    ? `Add ${newComponent.selectedComponents.length} Component${newComponent.selectedComponents.length !== 1 ? "s" : ""}`
                    : "Add Components"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen !== null}
        onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this component assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(null)}
              disabled={deletingComponent}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteConfirmOpen && handleDeleteComponent(deleteConfirmOpen)}
              disabled={deletingComponent}
            >
              {deletingComponent ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
