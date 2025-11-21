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
import { CopyRoomsToTemplateModal } from "@/components/CopyRoomsToTemplateModal"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface ComponentStatus {
  id: string
  name: string
  color?: string
}

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

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [componentCategories, setComponentCategories] = useState<ComponentCategory[]>([])
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([])
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  
  const [copyRoomsOpen, setCopyRoomsOpen] = useState(false)
  const [editingRoomName, setEditingRoomName] = useState("")
  const [editingRoomType, setEditingRoomType] = useState("")
  const [savingRoom, setSavingRoom] = useState(false)
  const [editingComponent, setEditingComponent] = useState<{
    componentType: string
    condition: string
    materialId: string
    vendorId: string | null
    notes: string
    quantity: number
    unitCost: number
  } | null>(null)
  const [savingComponent, setSavingComponent] = useState(false)
  
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
    selectedComponents: [] as Array<{ categoryId: string; categoryName: string; componentId: string; componentName: string }>,
    notes: "",
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [componentSearchTerm, setComponentSearchTerm] = useState("")
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

  const toggleComponentSelection = (
    categoryId: string,
    categoryName: string,
    componentId: string,
    componentName: string
  ) => {
    const isSelected = isComponentSelected(categoryId, componentId)
    if (isSelected) {
      setNewComponent({
        ...newComponent,
        selectedComponents: newComponent.selectedComponents.filter(
          (c) => !(c.categoryId === categoryId && c.componentId === componentId)
        ),
      })
    } else {
      setNewComponent({
        ...newComponent,
        selectedComponents: [
          ...newComponent.selectedComponents,
          { categoryId, categoryName, componentId, componentName },
        ],
      })
    }
  }

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const [templateRes, categoriesRes, statusesRes, roomTemplatesRes, vendorsRes, catalogRes] = await Promise.all([
        fetch(`/api/settings/templates/${templateId}`),
        fetch("/api/settings/component-category"),
        fetch("/api/settings/component-status"),
        fetch("/api/settings/room-template"),
        fetch("/api/settings/vendors"),
        fetch("/api/catalog"),
      ])

      if (templateRes.ok) {
        const data = await templateRes.json()
        setTemplate(data)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setComponentCategories(data)
      }

      if (statusesRes.ok) {
        const data = await statusesRes.json()
        setComponentStatuses(data)
      }

      if (roomTemplatesRes.ok) {
        const data = await roomTemplatesRes.json()
        setRoomTemplates(data)
      }

      if (vendorsRes.ok) {
        const data = await vendorsRes.json()
        setVendors(data)
      }

      if (catalogRes.ok) {
        const data = await catalogRes.json()
        setCatalogItems(data)
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

  const handleAddComponent = async (e: React.FormEvent, roomId: string) => {
    e.preventDefault()
    if (newComponent.selectedComponents.length === 0) return

    setAddingComponent(true)
    try {
      // Add all selected components at once
      const responses = await Promise.all(
        newComponent.selectedComponents.map((selected) =>
          fetch(`/api/settings/templates/${templateId}/rooms/${roomId}/components`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              componentType: selected.componentName,
              componentName: selected.componentName || null,
              condition: null,
              materialId: null,
              vendorId: null,
              quantity: 1,
              unitCost: 0,
              notes: newComponent.notes || null,
            }),
          })
        )
      )

      const errors = responses.filter((r) => !r.ok)
      if (errors.length > 0) {
        throw new Error("Failed to add some components")
      }

      setNewComponent({
        selectedComponents: [],
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

  const handleEditRoom = (room: TemplateRoom) => {
    setEditingRoomId(room.id)
    setEditingRoomName(room.name)
    setEditingRoomType(room.type || "")
  }

  const handleSaveRoom = async () => {
    if (!editingRoomId || !editingRoomName.trim()) return

    setSavingRoom(true)
    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms/${editingRoomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingRoomName.trim(),
          type: editingRoomType || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update room")
      }

      setEditingRoomId(null)
      setEditingRoomName("")
      setEditingRoomType("")
      fetchData()
    } catch (error) {
      console.error("Error updating room:", error)
      alert("Failed to update room")
    } finally {
      setSavingRoom(false)
    }
  }

  const handleEditComponent = (component: TemplateComponent) => {
    setEditingComponentId(component.id)
    setEditingComponent({
      componentType: component.componentType,
      condition: component.condition || "",
      materialId: component.materialId || "",
      vendorId: component.vendorId || null,
      notes: component.notes || "",
      quantity: component.quantity || 1,
      unitCost: component.unitCost || 0,
    })
  }

  const handleSaveComponent = async () => {
    if (!editingComponentId || !editingComponent) return

    // Find the room for this component
    const room = template?.templateRooms.find(r => 
      r.templateComponents.some(c => c.id === editingComponentId)
    )
    if (!room) return

    setSavingComponent(true)
    try {
      const response = await fetch(`/api/settings/templates/${templateId}/rooms/${room.id}/components/${editingComponentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: editingComponent.componentType || "",
          condition: editingComponent.condition?.trim() || null,
          materialId: editingComponent.materialId?.trim() || null,
          vendorId: editingComponent.vendorId?.trim() || null,
          notes: editingComponent.notes?.trim() || null,
          quantity: editingComponent.quantity || 1,
          unitCost: editingComponent.unitCost || 0,
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

  const getCategoryIdForComponent = (componentType: string): string | null => {
    for (const category of componentCategories) {
      if (category.components.some((comp) => comp.name === componentType)) {
        return category.id
      }
    }
    return null
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAddRoomOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Room
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCopyRoomsOpen(true)}>
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Copy from Selection/Assessment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <div className="flex-1">
                      {editingRoomId === room.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingRoomName}
                            onChange={(e) => setEditingRoomName(e.target.value)}
                            className="text-sm font-semibold h-8"
                            placeholder="Room name"
                          />
                          <Input
                            value={editingRoomType}
                            onChange={(e) => setEditingRoomType(e.target.value)}
                            className="text-xs h-8"
                            placeholder="Room type (optional)"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveRoom}
                            disabled={savingRoom || !editingRoomName.trim()}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRoomId(null)
                              setEditingRoomName("")
                              setEditingRoomType("")
                            }}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-sm">{room.name}</h3>
                          {room.type && <p className="text-xs text-gray-500">{room.type}</p>}
                        </div>
                      )}
                    </div>
                    {editingRoomId !== room.id && (
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
                          onClick={() => handleEditRoom(room)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {room.templateComponents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component / Type</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Catalog Item</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>QTY / Price</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {room.templateComponents.map((component) => (
                          <TableRow 
                            key={component.id}
                            className={cn(
                              "cursor-pointer",
                              editingComponentId === component.id && "bg-gray-50"
                            )}
                            onClick={() => editingComponentId !== component.id && handleEditComponent(component)}
                          >
                            <TableCell className="font-medium">
                              {editingComponentId === component.id ? (
                                <Input
                                  value={editingComponent?.componentType || ""}
                                  onChange={(e) => editingComponent && setEditingComponent({ ...editingComponent, componentType: e.target.value })}
                                  className="text-xs h-8"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                component.componentName || component.componentType
                              )}
                            </TableCell>
                            <TableCell>
                              {editingComponentId === component.id ? (
                                <Select
                                  value={editingComponent?.condition || undefined}
                                  onValueChange={(value) => editingComponent && setEditingComponent({ ...editingComponent, condition: value })}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
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
                                            <div className={cn("w-3 h-3 rounded-full", colorClasses[color as keyof typeof colorClasses] || colorClasses.gray)} />
                                            <span>{status.name}</span>
                                          </div>
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              ) : (
                                component.condition ? (
                                  (() => {
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
                                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colorClasses[color as keyof typeof colorClasses] || colorClasses.gray)}>
                                        {component.condition}
                                      </span>
                                    )
                                  })()
                                ) : "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {editingComponentId === component.id ? (
                                <div className="space-y-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCatalogModalOpen(true)
                                    }}
                                    className="flex-1 justify-start text-xs h-8"
                                  >
                                    {editingComponent?.materialId ? (
                                      (() => {
                                        const catalogItem = catalogItems.find(item => item.id === editingComponent?.materialId)
                                        if (catalogItem) {
                                          const manufacturerModelFinish = [
                                            catalogItem.manufacturer,
                                            catalogItem.modelNumber,
                                            catalogItem.finish,
                                          ].filter(Boolean).join(" - ")
                                          const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                          return (
                                            <div className="flex items-center gap-2">
                                              {catalogItem.imageUrl && (
                                                <img src={catalogItem.imageUrl} alt="" className="h-4 w-4 object-cover rounded" />
                                              )}
                                              <span className="truncate text-xs">{headerText}</span>
                                            </div>
                                          )
                                        }
                                        return "Select catalog item"
                                      })()
                                    ) : "Select catalog item"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-xs">
                                  {(() => {
                                    const catalogItem = catalogItems.find(item => item.id === component.materialId)
                                    if (!catalogItem) return "—"
                                    const manufacturerModelFinish = [
                                      catalogItem.manufacturer,
                                      catalogItem.modelNumber,
                                      catalogItem.finish,
                                    ].filter(Boolean).join(" - ")
                                    const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                    return (
                                      <div className="flex items-center gap-2">
                                        {catalogItem.imageUrl && (
                                          <img src={catalogItem.imageUrl} alt={headerText} className="h-6 w-6 object-cover rounded border border-gray-200" onError={(e) => { e.currentTarget.style.display = "none" }} />
                                        )}
                                        <span className="truncate">{headerText}</span>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingComponentId === component.id ? (
                                <Select
                                  value={editingComponent?.vendorId || undefined}
                                  onValueChange={(value) => editingComponent && setEditingComponent({ ...editingComponent, vendorId: value === "__none__" ? null : value || null })}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Vendor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {vendors.map((vendor) => (
                                      <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="text-xs">
                                  {(() => {
                                    const vendor = vendors.find(v => v.id === component.vendorId)
                                    return vendor ? vendor.name : "—"
                                  })()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingComponentId === component.id ? (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    value={editingComponent?.quantity || 1}
                                    onChange={(e) => editingComponent && setEditingComponent({ ...editingComponent, quantity: parseFloat(e.target.value) || 1 })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="0"
                                    step="0.01"
                                    placeholder="QTY"
                                  />
                                  <Input
                                    type="number"
                                    value={editingComponent?.unitCost || 0}
                                    onChange={(e) => editingComponent && setEditingComponent({ ...editingComponent, unitCost: parseFloat(e.target.value) || 0 })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col text-xs space-y-1">
                                  <div>{component.quantity || 1}</div>
                                  <div className="text-gray-600">${(component.unitCost || 0).toFixed(2)}</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingComponentId === component.id ? (
                                <Textarea
                                  value={editingComponent?.notes || ""}
                                  onChange={(e) => editingComponent && setEditingComponent({ ...editingComponent, notes: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      setEditingComponentId(null)
                                      setEditingComponent(null)
                                    }
                                    e.stopPropagation()
                                  }}
                                  className="min-h-[60px] text-xs"
                                />
                              ) : (
                                <div className="text-xs">{component.notes || "—"}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingComponentId === component.id ? (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingComponentId(null)
                                      setEditingComponent(null)
                                    }}
                                    className="text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteComponent(room.id, component.id)
                                      setEditingComponentId(null)
                                      setEditingComponent(null)
                                    }}
                                    className="text-xs"
                                  >
                                    <TrashIcon className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveComponent()
                                    }}
                                    disabled={savingComponent}
                                    className="text-xs"
                                  >
                                    {savingComponent ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteComponent(room.id, component.id)
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              )}
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
        <Dialog open={!!addComponentOpen} onOpenChange={() => setAddComponentOpen(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Components</DialogTitle>
              <DialogDescription>
                Select components to add to this room
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => addComponentOpen && handleAddComponent(e, addComponentOpen)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Search Components</Label>
                  <Input
                    value={componentSearchTerm}
                    onChange={(e) => setComponentSearchTerm(e.target.value)}
                    placeholder="Search components..."
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center gap-2 w-full text-left font-medium text-sm hover:text-blue-600"
                      >
                        {expandedCategories.has(category.id) ? (
                          <span className="text-xs">▼</span>
                        ) : (
                          <span className="text-xs">▶</span>
                        )}
                        {category.name}
                      </button>
                      {expandedCategories.has(category.id) && (
                        <div className="ml-4 space-y-1">
                          {category.components.map((component) => (
                            <label
                              key={component.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isComponentSelected(category.id, component.id)}
                                onChange={() =>
                                  toggleComponentSelection(
                                    category.id,
                                    category.name,
                                    component.id,
                                    component.name
                                  )
                                }
                                className="rounded"
                              />
                              <span className="text-sm">{component.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {newComponent.selectedComponents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Components ({newComponent.selectedComponents.length})</Label>
                    <div className="border rounded-md p-3 space-y-1 max-h-32 overflow-y-auto">
                      {newComponent.selectedComponents.map((selected, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{selected.categoryName}</span>: {selected.componentName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newComponent.notes}
                    onChange={(e) =>
                      setNewComponent({ ...newComponent, notes: e.target.value })
                    }
                    placeholder="Add notes (optional) - will be applied to all selected components"
                    rows={3}
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
                      notes: "",
                    })
                    setExpandedCategories(new Set())
                    setComponentSearchTerm("")
                  }}
                  disabled={addingComponent}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addingComponent || newComponent.selectedComponents.length === 0}
                >
                  {addingComponent ? "Adding..." : `Add ${newComponent.selectedComponents.length} Component${newComponent.selectedComponents.length !== 1 ? "s" : ""}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Copy Rooms Modal */}
      <CopyRoomsToTemplateModal
        open={copyRoomsOpen}
        onOpenChange={setCopyRoomsOpen}
        templateId={templateId}
        onSuccess={fetchData}
      />

      {/* Catalog Item Selection Modal */}
      {editingComponentId && editingComponent && (
        <CatalogItemSelectModal
          key={editingComponentId}
          open={catalogModalOpen}
          onOpenChange={setCatalogModalOpen}
          catalogItems={catalogItems}
          selectedItemId={editingComponent.materialId || null}
          initialCategoryFilter={getCategoryIdForComponent(editingComponent.componentType)}
          onSelect={(itemId) => {
            if (editingComponent) {
              setEditingComponent({
                ...editingComponent,
                materialId: itemId || "",
              })
            }
          }}
          onCatalogItemCreated={async () => {
            try {
              const response = await fetch("/api/catalog")
              if (response.ok) {
                const data = await response.json()
                setCatalogItems(data)
              }
            } catch (error) {
              console.error("Error refreshing catalog items:", error)
            }
          }}
        />
      )}
    </div>
  )
}

