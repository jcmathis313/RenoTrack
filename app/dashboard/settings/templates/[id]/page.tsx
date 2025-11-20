"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import Link from "next/link"
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline"
import { CatalogItemSelectModal } from "@/components/CatalogItemSelectModal"

interface TemplateComponent {
  id: string
  componentType: string
  componentName: string | null
  condition: string | null
  materialId: string | null
  vendorId: string | null
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

interface ComponentCategory {
  id: string
  name: string
  components: {
    id: string
    name: string
  }[]
}

interface RoomTemplate {
  id: string
  name: string
}

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [componentCategories, setComponentCategories] = useState<ComponentCategory[]>([])
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([])
  
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [addComponentOpen, setAddComponentOpen] = useState<string | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomType, setNewRoomType] = useState("")
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(-1)
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [filteredRooms, setFilteredRooms] = useState<RoomTemplate[]>([])
  const [addingRoom, setAddingRoom] = useState(false)
  
  const [newComponent, setNewComponent] = useState({
    selectedComponents: [] as string[],
    componentType: "",
    componentName: "",
    condition: "",
    materialId: "",
    quantity: 1,
    unitCost: 0,
    notes: "",
  })
  const [addingComponent, setAddingComponent] = useState(false)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [currentRoomForCatalog, setCurrentRoomForCatalog] = useState<string | null>(null)

  useEffect(() => {
    if (templateId) {
      fetchData()
    }
  }, [templateId])

  useEffect(() => {
    if (newRoomName) {
      const filtered = roomTemplates.filter((room) =>
        room.name.toLowerCase().includes(newRoomName.toLowerCase())
      )
      setFilteredRooms(filtered)
    } else {
      setFilteredRooms([])
    }
  }, [newRoomName, roomTemplates])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [templateRes, categoriesRes, roomTemplatesRes, vendorsRes] = await Promise.all([
        fetch(`/api/settings/templates/${templateId}`),
        fetch("/api/settings/component-category"),
        fetch("/api/settings/room-template"),
        fetch("/api/settings/vendors"),
      ])

      if (templateRes.ok) {
        const data = await templateRes.json()
        setTemplate(data)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setComponentCategories(data)
      }

      if (roomTemplatesRes.ok) {
        const data = await roomTemplatesRes.json()
        setRoomTemplates(data)
      }

      if (vendorsRes.ok) {
        const data = await vendorsRes.json()
        setVendors(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim() || !templateId) return

    setAddingRoom(true)
    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          type: newRoomType || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add room")
      }

      setNewRoomName("")
      setNewRoomType("")
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

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room and all its components?")) {
      return
    }

    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      fetchData()
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Failed to delete room")
    }
  }

  const handleAddComponent = async (roomId: string) => {
    if (!newComponent.componentType) return

    setAddingComponent(true)
    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms/${roomId}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: newComponent.componentType,
          componentName: newComponent.componentName || null,
          condition: newComponent.condition || null,
          materialId: newComponent.materialId || null,
          vendorId: null,
          quantity: newComponent.quantity || 1,
          unitCost: newComponent.unitCost || 0,
          notes: newComponent.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add component")
      }

      setNewComponent({
        selectedComponents: [],
        componentType: "",
        componentName: "",
        condition: "",
        materialId: "",
        quantity: 1,
        unitCost: 0,
        notes: "",
      })
      setAddComponentOpen(null)
      fetchData()
    } catch (error) {
      console.error("Error adding component:", error)
      alert("Failed to add component")
    } finally {
      setAddingComponent(false)
    }
  }

  const handleDeleteComponent = async (roomId: string, componentId: string) => {
    if (!confirm("Are you sure you want to delete this component?")) {
      return
    }

    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms/${roomId}/components/${componentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete component")
      }

      fetchData()
    } catch (error) {
      console.error("Error deleting component:", error)
      alert("Failed to delete component")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading template...</div>
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Template not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">Back to Settings</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Template Editor</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Rooms</CardTitle>
            <Button onClick={() => setAddRoomOpen(true)} size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {template.templateRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rooms yet. Add your first room to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {template.templateRooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{room.name}</h3>
                      {room.type && <p className="text-xs text-gray-500">{room.type}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddComponentOpen(room.id)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Component
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {room.templateComponents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>QTY</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {room.templateComponents.map((component) => (
                          <TableRow key={component.id}>
                            <TableCell className="font-medium">
                              {component.componentName || component.componentType}
                            </TableCell>
                            <TableCell>{component.condition || "—"}</TableCell>
                            <TableCell>{component.quantity}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(component.unitCost)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteComponent(room.id, component.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">No components in this room</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Add a room to this template
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoom}>
            <div className="space-y-4 py-4">
              <div className="space-y-2 relative">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Type to search or add new room"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddRoomOpen(false)
                  setNewRoomName("")
                }}
                disabled={addingRoom}
              >
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
      {addComponentOpen && (
        <Dialog open={!!addComponentOpen} onOpenChange={(open) => !open && setAddComponentOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Component</DialogTitle>
              <DialogDescription>
                Add a component to this room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="componentType">Component Type *</Label>
                <Input
                  id="componentType"
                  value={newComponent.componentType}
                  onChange={(e) =>
                    setNewComponent({ ...newComponent, componentType: e.target.value })
                  }
                  placeholder="Component type"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="componentName">Component Name</Label>
                <Input
                  id="componentName"
                  value={newComponent.componentName}
                  onChange={(e) =>
                    setNewComponent({ ...newComponent, componentName: e.target.value })
                  }
                  placeholder="Component name (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newComponent.quantity}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, quantity: parseFloat(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newComponent.unitCost}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, unitCost: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
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
                    componentType: "",
                    componentName: "",
                    condition: "",
                    materialId: "",
                    quantity: 1,
                    unitCost: 0,
                    notes: "",
                  })
                }}
                disabled={addingComponent}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addComponentOpen && handleAddComponent(addComponentOpen)}
                disabled={addingComponent || !newComponent.componentType}
              >
                {addingComponent ? "Adding..." : "Add Component"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

