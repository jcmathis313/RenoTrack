"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ArrowLeftIcon, PlusIcon, TrashIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { CatalogItemSelectModal } from "@/components/CatalogItemSelectModal"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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

interface DesignRoom {
  id: string
  name: string
  type: string | null
  designComponents: DesignComponent[]
}

interface DesignComponent {
  id: string
  componentType: string
  componentName: string | null
  condition: string | null
  materialId: string | null
  vendorId: string | null
  quantity: number
  unitCost: number
  totalCost: number
  notes: string | null
  residentUpgrade?: boolean | null
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

interface ComponentStatus {
  id: string
  name: string
  color?: string
}

interface Selection {
  id: string
  name: string
  status: string | null
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
  assessment: {
    id: string
    assessedAt: string
    assessedBy: string | null
  } | null
  designRooms: DesignRoom[]
}

export default function SelectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const selectionId = params?.id as string

  const [selection, setSelection] = useState<Selection | null>(null)
  const [componentCategories, setComponentCategories] = useState<ComponentCategory[]>([])
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([])
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
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
    notes: "",
  })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [componentSearchTerm, setComponentSearchTerm] = useState("")
  const [addingComponent, setAddingComponent] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<{
    componentType: string
    condition: string
    materialId: string
    notes: string
    residentUpgrade: string
    quantity: number
    unitCost: number
  } | null>(null)
  const [savingComponent, setSavingComponent] = useState(false)
  const [deletingComponent, setDeletingComponent] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [viewMode, setViewMode] = useState<"rooms" | "category" | "upgrade" | "condition">("rooms")
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(new Set())
  const actionToastIdRef = React.useRef<string | number | null>(null)

  useEffect(() => {
    if (selectionId) {
      fetchData()
    } else {
      setLoading(false)
      console.error("Selection ID not found in params")
    }
  }, [selectionId])

  const fetchData = async () => {
    if (!selectionId) {
      console.error("Cannot fetch data: selectionId is missing")
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [selectionRes, categoriesRes, statusesRes, roomTemplatesRes, catalogRes] = await Promise.all([
        fetch(`/api/selections/${selectionId}`),
        fetch("/api/settings/component-category"),
        fetch("/api/settings/component-status"),
        fetch("/api/settings/room-template"),
        fetch("/api/catalog"),
      ])

      if (!selectionRes.ok) {
        if (selectionRes.status === 404) {
          setLoading(false)
          return
        }
        throw new Error("Failed to fetch selection")
      }

      const selectionData = await selectionRes.json()
      setSelection(selectionData)

      const categoriesData = await categoriesRes.json()
      setComponentCategories(categoriesData)

      const statusesData = await statusesRes.json()
      setComponentStatuses(statusesData)

      const templatesData = await roomTemplatesRes.json()
      setRoomTemplates(templatesData)

      const catalogData = await catalogRes.json()
      setCatalogItems(catalogData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (newRoomName.trim()) {
      const filtered = roomTemplates.filter((rt) =>
        rt.name.toLowerCase().includes(newRoomName.toLowerCase())
      )
      setFilteredRooms(filtered)
      setShowRoomDropdown(true)
    } else {
      setFilteredRooms([])
      setShowRoomDropdown(false)
    }
    setSelectedRoomIndex(-1)
  }, [newRoomName, roomTemplates])

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
        handleSelectRoom(filteredRooms[selectedRoomIndex].name)
      } else if (newRoomName.trim()) {
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
    if (!newRoomName.trim() || !selectionId) return

    setAddingRoom(true)
    try {
      const roomName = newRoomName.trim()

      // Check if room template exists, if not create it
      const existingTemplate = roomTemplates.find(
        (rt) => rt.name.toLowerCase() === roomName.toLowerCase()
      )

      if (!existingTemplate) {
        await handleCreateRoomTemplate(roomName)
      }

      const response = await fetch("/api/design-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designProjectId: selectionId,
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
    if (newComponent.selectedComponents.length === 0) {
      return
    }

    setAddingComponent(true)
    try {
      const componentsToCreate = newComponent.selectedComponents.map((selected) => ({
        componentType: selected.componentName,
        componentName: null,
        notes: newComponent.notes || null,
      }))

      const response = await fetch("/api/design-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designRoomId: roomId,
          components: componentsToCreate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add components")
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

  const handleEditComponent = (component: DesignComponent) => {
    setEditingComponentId(component.id)
    setEditingComponent({
      componentType: component.componentType,
      condition: component.condition || "",
      materialId: component.materialId || "",
      notes: component.notes || "",
      residentUpgrade: component.residentUpgrade === true ? "upgrade" : component.residentUpgrade === false ? "included" : "",
      quantity: component.quantity || 1,
      unitCost: component.unitCost || 0,
    })
  }

  const handleSaveComponent = async () => {
    if (!editingComponentId || !editingComponent) return

    setSavingComponent(true)
    try {
      const response = await fetch(`/api/design-components/${editingComponentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: editingComponent.componentType,
          condition: editingComponent.condition?.trim() || null,
          materialId: editingComponent.materialId?.trim() || null,
          notes: editingComponent.notes?.trim() || null,
          residentUpgrade: editingComponent.residentUpgrade === "upgrade" ? true : editingComponent.residentUpgrade === "included" ? false : null,
          quantity: editingComponent.quantity || 1,
          unitCost: editingComponent.unitCost || 0,
          totalCost: (editingComponent.quantity || 1) * (editingComponent.unitCost || 0),
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

  const handleDeleteComponent = async () => {
    if (!deleteConfirmOpen) return

    setDeletingComponent(true)
    try {
      const response = await fetch(`/api/design-components/${deleteConfirmOpen}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete component")
      }

      setDeleteConfirmOpen(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting component:", error)
      alert("Failed to delete component")
    } finally {
      setDeletingComponent(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectionId) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/selections/${selectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const updatedSelection = await response.json()
      setSelection(updatedSelection)
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Helper function to get all components flattened with room info
  const getAllComponents = () => {
    if (!selection) return []
    return selection.designRooms.flatMap((room) =>
      room.designComponents.map((comp) => ({ ...comp, roomName: room.name, roomId: room.id }))
    )
  }

  // Helper to get category name from component type
  const getCategoryForComponent = (componentType: string) => {
    for (const category of componentCategories) {
      if (category.components.some((comp) => comp.name === componentType)) {
        return category.name
      }
    }
    return "Other"
  }

  // Helper to get category ID from component type
  const getCategoryIdForComponent = (componentType: string): string | null => {
    for (const category of componentCategories) {
      if (category.components.some((comp) => comp.name === componentType)) {
        // Return the category ID directly
        return category.id
      }
    }
    return null
  }

  // Organize components by view mode
  const getOrganizedComponents = () => {
    const allComponents = getAllComponents()

    if (viewMode === "rooms") {
      return selection?.designRooms.map((room) => ({
        groupKey: room.name,
        groupLabel: room.name,
        components: room.designComponents.map((comp) => ({ ...comp, roomName: room.name, roomId: room.id })),
      })) || []
    } else if (viewMode === "category") {
      const grouped = new Map<string, typeof allComponents>()
      allComponents.forEach((comp) => {
        const category = getCategoryForComponent(comp.componentType)
        if (!grouped.has(category)) {
          grouped.set(category, [])
        }
        grouped.get(category)!.push(comp)
      })
      return Array.from(grouped.entries()).map(([category, comps]) => ({
        groupKey: category,
        groupLabel: category,
        components: comps,
      }))
    } else if (viewMode === "upgrade") {
      const upgrade = allComponents.filter((comp) => comp.residentUpgrade === true)
      const included = allComponents.filter((comp) => comp.residentUpgrade === false)
      const unspecified = allComponents.filter((comp) => comp.residentUpgrade === null || comp.residentUpgrade === undefined)
      return [
        { groupKey: "upgrade", groupLabel: "Upgrades", components: upgrade },
        { groupKey: "included", groupLabel: "Included", components: included },
        { groupKey: "unspecified", groupLabel: "Unspecified", components: unspecified },
      ].filter((group) => group.components.length > 0)
    } else if (viewMode === "condition") {
      // Sort by condition status order
      const statusOrder = componentStatuses.map((s) => s.name)
      const grouped = new Map<string, typeof allComponents>()
      allComponents.forEach((comp) => {
        const condition = comp.condition || "No Condition"
        if (!grouped.has(condition)) {
          grouped.set(condition, [])
        }
        grouped.get(condition)!.push(comp)
      })
      return Array.from(grouped.entries())
        .sort(([a], [b]) => {
          const aIndex = statusOrder.indexOf(a)
          const bIndex = statusOrder.indexOf(b)
          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
        .map(([condition, comps]) => ({
          groupKey: condition,
          groupLabel: condition,
          components: comps,
        }))
    }
    return []
  }

  const toggleComponentCheckbox = (componentId: string) => {
    setSelectedComponentIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(componentId)) {
        newSet.delete(componentId)
      } else {
        newSet.add(componentId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">Loading selection...</div>
    )
  }

  if (!selection) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Selection not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/selections">Back to Selections</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/selections">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selection.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Selection Meeting Details
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          disabled={exportingPDF}
          onClick={async () => {
            setExportingPDF(true)
            try {
              console.log("Starting PDF export...")
              const response = await fetch(`/api/export-pdf?type=selection&id=${selectionId}`)
              
              console.log("Response status:", response.status)
              console.log("Response headers:", Object.fromEntries(response.headers.entries()))
              
              // Check if response is JSON (error) or PDF
              const contentType = response.headers.get("content-type")
              console.log("Content type:", contentType)
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error("Error response:", errorData)
                throw new Error(errorData.error || errorData.details || `Failed to generate PDF: ${response.status} ${response.statusText}`)
              }
              
              if (!contentType?.includes("application/pdf")) {
                const errorData = await response.json().catch(() => ({}))
                console.error("Non-PDF response:", errorData)
                throw new Error(errorData.error || errorData.details || "Server did not return a PDF")
              }
              
              const blob = await response.blob()
              console.log("Blob received:", blob.type, blob.size, "bytes")
              
              // Verify it's actually a PDF
              if (blob.type !== "application/pdf") {
                const text = await blob.text()
                console.error("Non-PDF blob content:", text.substring(0, 200))
                try {
                  const errorJson = JSON.parse(text)
                  throw new Error(errorJson.error || errorJson.details || "Failed to generate PDF")
                } catch {
                  throw new Error("Server returned non-PDF response")
                }
              }
              
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `selection-${selection.name}-${Date.now()}.pdf`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
              console.log("PDF downloaded successfully")
            } catch (error: any) {
              console.error("Error exporting PDF:", error)
              alert(`Failed to export PDF: ${error?.message || "Unknown error"}\n\nCheck the browser console for more details.`)
            } finally {
              setExportingPDF(false)
            }
          }}
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {exportingPDF ? "Generating PDF..." : "Export PDF"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Selection Details</CardTitle>
            {selection.unit.building.community.logoUrl && (
              <div className="h-8 w-8 relative">
                <img
                  src={selection.unit.building.community.logoUrl}
                  alt={`${selection.unit.building.community.name} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            <div>
              <Label className="text-gray-500 text-xs">Community</Label>
              <p className="text-xs font-medium mt-0.5">{selection.unit.building.community.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Building</Label>
              <p className="text-xs font-medium mt-0.5">{selection.unit.building.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Unit</Label>
              <p className="text-xs font-medium mt-0.5">Unit {selection.unit.number}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Status</Label>
              <Select
                value={selection.status || "draft"}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full h-7 text-xs mt-0.5">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending approval">Pending Approval</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selection.assessment && (
              <div>
                <Label className="text-gray-500 text-xs">Based On Assessment</Label>
                <div className="mt-0.5">
                  <Link
                    href={`/dashboard/assessments/${selection.assessment.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatDate(selection.assessment.assessedAt)}
                  </Link>
                </div>
              </div>
            )}
            <div>
              <Label className="text-gray-500 text-xs">Statistics</Label>
              <div className="mt-0.5 space-y-0.5">
                <p className="text-xs font-medium">
                  {selection.designRooms.length} {selection.designRooms.length === 1 ? "Room" : "Rooms"}
                </p>
                <p className="text-xs font-medium">
                  {selection.designRooms.reduce((sum, room) => sum + room.designComponents.length, 0)} Components
                </p>
                <p className="text-xs font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    selection.designRooms.reduce(
                      (sum, room) =>
                        sum +
                        room.designComponents.reduce((roomSum, comp) => roomSum + (comp.totalCost || 0), 0),
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 border rounded-md p-1">
            {(["rooms", "category", "upgrade", "condition"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setViewMode(mode)
                  setSelectedComponentIds(new Set())
                }}
                className={cn(
                  "capitalize",
                  viewMode === mode ? "bg-gray-900 text-white hover:bg-gray-800" : ""
                )}
              >
                {mode === "rooms" ? "Rooms" : mode === "category" ? "Category" : mode === "upgrade" ? "Upgrade" : "Condition"}
              </Button>
            ))}
          </div>
        </div>
        {viewMode === "rooms" && (
          <Button onClick={() => setAddRoomOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        )}
      </div>

      {selection.designRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No rooms yet. Add your first room to get started.</p>
          </CardContent>
        </Card>
      ) : (
        getOrganizedComponents().map((group) => {
          if (viewMode === "rooms") {
            const room = selection.designRooms.find((r) => r.name === group.groupKey)
            if (!room) return null
            return (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{room.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddComponentOpen(room.id)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {room.designComponents.length === 0 ? (
                <p className="text-sm text-gray-500">No components yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <input
                            type="checkbox"
                            checked={group.components.length > 0 && group.components.every((c) => selectedComponentIds.has(c.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                group.components.forEach((c) => setSelectedComponentIds((prev) => new Set([...prev, c.id])))
                              } else {
                                group.components.forEach((c) =>
                                  setSelectedComponentIds((prev) => {
                                    const newSet = new Set(prev)
                                    newSet.delete(c.id)
                                    return newSet
                                  })
                                )
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableHead>
                        {viewMode !== "rooms" && <TableHead className="w-[120px]">Room</TableHead>}
                        <TableHead className="w-[120px]">
                          <div className="flex flex-col">
                            <span>Component</span>
                            <span>/ Type</span>
                          </div>
                        </TableHead>
                        <TableHead className="w-[280px]">Catalog Item</TableHead>
                        <TableHead className="w-[100px] text-center">Upgrade</TableHead>
                        <TableHead className="w-[100px]">
                          <div className="flex flex-col">
                            <span>Quantity</span>
                            <span>/ Price</span>
                          </div>
                        </TableHead>
                        <TableHead className="flex-1">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.components.map((component) => (
                        <TableRow
                          key={component.id}
                          className={cn(
                            "cursor-pointer",
                            editingComponentId === component.id && "bg-gray-50",
                            component.residentUpgrade === true && "bg-green-50"
                          )}
                          onClick={() => handleEditComponent(component)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedComponentIds.has(component.id)}
                              onChange={() => toggleComponentCheckbox(component.id)}
                            />
                          </TableCell>
                          {viewMode !== "rooms" && (
                            <TableCell className="text-xs">{component.roomName || "—"}</TableCell>
                          )}
                          {/* Component Type / Condition Column */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-xs font-medium">{component.componentType}</div>
                              {component.condition && (
                                <div>
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
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                        colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
                                      )}>
                                        {component.condition}
                                      </span>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                            {editingComponentId === component.id && (
                              <div className="mt-2 space-y-2">
                                <Label className="text-xs">Condition</Label>
                                <Select
                                  value={editingComponent.condition || undefined}
                                  onValueChange={(value) =>
                                    setEditingComponent({
                                      ...editingComponent!,
                                      condition: value,
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectTrigger onClick={(e) => e.stopPropagation()} className="h-8 text-xs">
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
                            )}
                          </TableCell>
                          
                          {/* Catalog Item Column */}
                          <TableCell>
                            {editingComponentId === component.id ? (
                              <div className="space-y-2">
                                <Label className="text-xs">Catalog Item</Label>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCatalogModalOpen(true)
                                    }}
                                    className="flex-1 justify-start text-xs h-8"
                                  >
                                    {editingComponent.materialId ? (
                                      (() => {
                                        const catalogItem = catalogItems.find(
                                          (item) => item.id === editingComponent.materialId
                                        )
                                        if (catalogItem) {
                                          const manufacturerModelFinish = [
                                            catalogItem.manufacturer,
                                            catalogItem.modelNumber,
                                            catalogItem.finish,
                                          ]
                                            .filter(Boolean)
                                            .join(" - ")
                                          
                                          const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                          
                                          return (
                                            <div className="flex items-center gap-2">
                                              {catalogItem.imageUrl && (
                                                <img
                                                  src={catalogItem.imageUrl}
                                                  alt=""
                                                  className="h-4 w-4 object-cover rounded"
                                                />
                                              )}
                                              <span className="truncate text-xs">
                                                {headerText}
                                              </span>
                                            </div>
                                          )
                                        }
                                        return "Select catalog item"
                                      })()
                                    ) : (
                                      "Select catalog item"
                                    )}
                                  </Button>
                                  {editingComponent.materialId && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingComponent({
                                          ...editingComponent!,
                                          materialId: "",
                                        })
                                      }}
                                      className="text-xs h-8"
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm">
                                {(() => {
                                  const catalogItem = catalogItems.find(item => item.id === component.materialId)
                                  if (!catalogItem) {
                                    return (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingComponentId(component.id)
                                          setEditingComponent({
                                            componentType: component.componentType,
                                            condition: component.condition || "",
                                            materialId: component.materialId || "",
                                            notes: component.notes || "",
                                            residentUpgrade: component.residentUpgrade === true ? "upgrade" : component.residentUpgrade === false ? "included" : "",
                                            quantity: component.quantity || 1,
                                            unitCost: component.unitCost || 0,
                                          })
                                          setCatalogModalOpen(true)
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        Select catalog item
                                      </Button>
                                    )
                                  }
                                  
                                  const manufacturerModelFinish = [
                                    catalogItem.manufacturer,
                                    catalogItem.modelNumber,
                                    catalogItem.finish,
                                  ]
                                    .filter(Boolean)
                                    .join(" - ")

                                  const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                  
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Close drawer first if open, then open with new component
                                        if (catalogModalOpen) {
                                          setCatalogModalOpen(false)
                                          setTimeout(() => {
                                            setEditingComponentId(component.id)
                                            setEditingComponent({
                                              componentType: component.componentType,
                                              condition: component.condition || "",
                                              materialId: component.materialId || "",
                                              notes: component.notes || "",
                                              residentUpgrade: component.residentUpgrade === true ? "upgrade" : component.residentUpgrade === false ? "included" : "",
                                              quantity: component.quantity || 1,
                                              unitCost: component.unitCost || 0,
                                            })
                                            setCatalogModalOpen(true)
                                          }, 100)
                                        } else {
                                          setEditingComponentId(component.id)
                                          setEditingComponent({
                                            componentType: component.componentType,
                                            condition: component.condition || "",
                                            materialId: component.materialId || "",
                                            notes: component.notes || "",
                                            residentUpgrade: component.residentUpgrade === true ? "upgrade" : component.residentUpgrade === false ? "included" : "",
                                            quantity: component.quantity || 1,
                                            unitCost: component.unitCost || 0,
                                          })
                                          setCatalogModalOpen(true)
                                        }
                                      }}
                                      className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded -m-2"
                                    >
                                      {catalogItem.imageUrl && (
                                        <img
                                          src={catalogItem.imageUrl}
                                          alt={headerText}
                                          className="h-8 w-8 object-cover rounded border border-gray-200 flex-shrink-0"
                                          onError={(e) => { e.currentTarget.style.display = "none" }}
                                        />
                                      )}
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-medium text-xs">{headerText}</span>
                                        {catalogItem.description && manufacturerModelFinish && (
                                          <span className="text-xs text-gray-500 truncate">{manufacturerModelFinish}</span>
                                        )}
                                        {catalogItem.color && (
                                          <span className="text-xs text-gray-500 truncate">Color: {catalogItem.color}</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })()}
                              </div>
                            )}
                          </TableCell>
                          
                          {/* Resident Upgrade Column */}
                          <TableCell className="text-center">
                            {editingComponentId === component.id ? (
                              <RadioGroup
                                value={editingComponent.residentUpgrade || undefined}
                                onValueChange={(value) =>
                                  setEditingComponent({
                                    ...editingComponent!,
                                    residentUpgrade: value,
                                  })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="space-y-1"
                              >
                                <div className="flex items-center justify-center space-x-2">
                                  <RadioGroupItem value="upgrade" id={`upgrade-yes-${component.id}`} onClick={(e) => e.stopPropagation()} />
                                  <Label htmlFor={`upgrade-yes-${component.id}`} className="font-normal text-xs cursor-pointer" onClick={(e) => e.stopPropagation()}>Upgrade</Label>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <RadioGroupItem value="included" id={`upgrade-no-${component.id}`} onClick={(e) => e.stopPropagation()} />
                                  <Label htmlFor={`upgrade-no-${component.id}`} className="font-normal text-xs cursor-pointer" onClick={(e) => e.stopPropagation()}>Included</Label>
                                </div>
                              </RadioGroup>
                            ) : (
                              <div className="text-xs">
                                {component.residentUpgrade === true ? (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                                    Upgrade
                                  </span>
                                ) : component.residentUpgrade === false ? (
                                  <span className="text-gray-500">Included</span>
                                ) : (
                                  "—"
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          {/* Quantity / Price Column */}
                          <TableCell>
                            {editingComponentId === component.id ? (
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    value={editingComponent.quantity || 1}
                                    onChange={(e) =>
                                      setEditingComponent({
                                        ...editingComponent!,
                                        quantity: parseFloat(e.target.value) || 1,
                                      })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Price</Label>
                                  <Input
                                    type="number"
                                    value={editingComponent.unitCost || 0}
                                    onChange={(e) =>
                                      setEditingComponent({
                                        ...editingComponent!,
                                        unitCost: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col text-xs space-y-1">
                                <div>{component.quantity || 1}</div>
                                <div className="text-gray-600">${(component.unitCost || 0).toFixed(2)}</div>
                              </div>
                            )}
                          </TableCell>
                          
                          {/* Notes Column */}
                          <TableCell>
                            {editingComponentId === component.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingComponent?.notes || ""}
                                  onChange={(e) =>
                                    setEditingComponent({
                                      ...editingComponent!,
                                      notes: e.target.value,
                                    })
                                  }
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
                                      setDeleteConfirmOpen(component.id)
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
                              </div>
                            ) : (
                              <div className="text-xs">
                                {component.notes || "—"}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
            )
          } else {
            // For other views (category, upgrade, condition)
            return (
              <Card key={group.groupKey}>
                <CardHeader>
                  <CardTitle>{group.groupLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  {group.components.length === 0 ? (
                    <p className="text-sm text-gray-500">No components yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <input
                                type="checkbox"
                                checked={group.components.length > 0 && group.components.every((c) => selectedComponentIds.has(c.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    group.components.forEach((c) => setSelectedComponentIds((prev) => new Set([...prev, c.id])))
                                  } else {
                                    group.components.forEach((c) =>
                                      setSelectedComponentIds((prev) => {
                                        const newSet = new Set(prev)
                                        newSet.delete(c.id)
                                        return newSet
                                      })
                                    )
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableHead>
                            <TableHead className="w-[120px]">Room</TableHead>
                            <TableHead className="w-[120px]">
                              <div className="flex flex-col">
                                <span>Component</span>
                                <span>/ Type</span>
                              </div>
                            </TableHead>
                            <TableHead className="w-[280px]">Catalog Item</TableHead>
                            <TableHead className="w-[100px] text-center">Upgrade</TableHead>
                            <TableHead className="w-[100px]">
                              <div className="flex flex-col">
                                <span>Quantity</span>
                                <span>/ Price</span>
                              </div>
                            </TableHead>
                            <TableHead className="flex-1">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.components.map((component) => (
                            <TableRow
                              key={component.id}
                              className={cn(
                                "cursor-pointer",
                                editingComponentId === component.id && "bg-gray-50",
                                component.residentUpgrade === true && "bg-green-50"
                              )}
                              onClick={() => handleEditComponent(component)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedComponentIds.has(component.id)}
                                  onChange={() => toggleComponentCheckbox(component.id)}
                                />
                              </TableCell>
                              <TableCell className="text-xs">{component.roomName || "—"}</TableCell>
                              {/* Component Type / Condition Column */}
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-xs font-medium">{component.componentType}</div>
                                  {component.condition && (
                                    <div>
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
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                            colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
                                          )}>
                                            {component.condition}
                                          </span>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                                {editingComponentId === component.id && (
                                  <div className="mt-2 space-y-2">
                                    <Label className="text-xs">Condition</Label>
                                    <Select
                                      value={editingComponent?.condition || undefined}
                                      onValueChange={(value) =>
                                        setEditingComponent({
                                          ...editingComponent!,
                                          condition: value,
                                        })
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <SelectTrigger onClick={(e) => e.stopPropagation()} className="h-8 text-xs">
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
                                )}
                              </TableCell>
                              
                              {/* Catalog Item Column - same as rooms view */}
                              <TableCell>
                                {editingComponentId === component.id ? (
                                  <div className="space-y-2">
                                    <Label className="text-xs">Catalog Item</Label>
                                    <div className="flex gap-2">
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
                                            const catalogItem = catalogItems.find(
                                              (item) => item.id === editingComponent.materialId
                                            )
                                            if (catalogItem) {
                                              const manufacturerModelFinish = [
                                                catalogItem.manufacturer,
                                                catalogItem.modelNumber,
                                                catalogItem.finish,
                                              ]
                                                .filter(Boolean)
                                                .join(" - ")
                                              
                                              const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                              
                                              return (
                                                <div className="flex items-center gap-2">
                                                  {catalogItem.imageUrl && (
                                                    <img
                                                      src={catalogItem.imageUrl}
                                                      alt=""
                                                      className="h-4 w-4 object-cover rounded"
                                                    />
                                                  )}
                                                  <span className="truncate text-xs">
                                                    {headerText}
                                                  </span>
                                                </div>
                                              )
                                            }
                                            return "Select catalog item"
                                          })()
                                        ) : (
                                          "Select catalog item"
                                        )}
                                      </Button>
                                      {editingComponent?.materialId && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingComponent({
                                              ...editingComponent!,
                                              materialId: "",
                                            })
                                          }}
                                          className="text-xs h-8"
                                        >
                                          Clear
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs">
                                    {(() => {
                                      const catalogItem = catalogItems.find(item => item.id === component.materialId)
                                      if (!catalogItem) {
                                        return (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditComponent(component)
                                              setCatalogModalOpen(true)
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                          >
                                            Select catalog item
                                          </Button>
                                        )
                                      }
                                      
                                      const manufacturerModelFinish = [
                                        catalogItem.manufacturer,
                                        catalogItem.modelNumber,
                                        catalogItem.finish,
                                      ]
                                        .filter(Boolean)
                                        .join(" - ")

                                      const headerText = catalogItem.description || manufacturerModelFinish || `${catalogItem.category.name} - ${catalogItem.component.name}`
                                      
                                      return (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditComponent(component)
                                            setCatalogModalOpen(true)
                                          }}
                                          className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded -m-2"
                                        >
                                          {catalogItem.imageUrl && (
                                            <img
                                              src={catalogItem.imageUrl}
                                              alt={headerText}
                                              className="h-8 w-8 object-cover rounded border border-gray-200 flex-shrink-0"
                                              onError={(e) => { e.currentTarget.style.display = "none" }}
                                            />
                                          )}
                                          <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-medium text-xs">{headerText}</span>
                                            {catalogItem.description && manufacturerModelFinish && (
                                              <span className="text-xs text-gray-500 truncate">{manufacturerModelFinish}</span>
                                            )}
                                            {catalogItem.color && (
                                              <span className="text-xs text-gray-500 truncate">Color: {catalogItem.color}</span>
                                            )}
                                          </div>
                                        </button>
                                      )
                                    })()}
                                  </div>
                                )}
                              </TableCell>
                              
                              {/* Resident Upgrade Column */}
                              <TableCell className="text-center">
                                {editingComponentId === component.id ? (
                                  <RadioGroup
                                    value={editingComponent?.residentUpgrade || undefined}
                                    onValueChange={(value) =>
                                      setEditingComponent({
                                        ...editingComponent!,
                                        residentUpgrade: value,
                                      })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="space-y-1"
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <RadioGroupItem value="upgrade" id={`upgrade-yes-${component.id}`} onClick={(e) => e.stopPropagation()} />
                                      <Label htmlFor={`upgrade-yes-${component.id}`} className="font-normal text-xs cursor-pointer" onClick={(e) => e.stopPropagation()}>Upgrade</Label>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                      <RadioGroupItem value="included" id={`upgrade-no-${component.id}`} onClick={(e) => e.stopPropagation()} />
                                      <Label htmlFor={`upgrade-no-${component.id}`} className="font-normal text-xs cursor-pointer" onClick={(e) => e.stopPropagation()}>Included</Label>
                                    </div>
                                  </RadioGroup>
                                ) : (
                                  <div className="text-xs">
                                    {component.residentUpgrade === true ? (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                                        Upgrade
                                      </span>
                                    ) : component.residentUpgrade === false ? (
                                      <span className="text-gray-500">Included</span>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              
                              {/* Quantity / Price Column */}
                              <TableCell>
                                {editingComponentId === component.id ? (
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        type="number"
                                        value={editingComponent?.quantity || 1}
                                        onChange={(e) =>
                                          setEditingComponent({
                                            ...editingComponent!,
                                            quantity: parseFloat(e.target.value) || 1,
                                          })
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        step="0.01"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Price</Label>
                                      <Input
                                        type="number"
                                        value={editingComponent?.unitCost || 0}
                                        onChange={(e) =>
                                          setEditingComponent({
                                            ...editingComponent!,
                                            unitCost: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        min="0"
                                        step="0.01"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col text-xs space-y-1">
                                    <div>{component.quantity || 1}</div>
                                    <div className="text-gray-600">${(component.unitCost || 0).toFixed(2)}</div>
                                  </div>
                                )}
                              </TableCell>
                              
                              {/* Notes Column */}
                              <TableCell>
                                {editingComponentId === component.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editingComponent?.notes || ""}
                                      onChange={(e) =>
                                        setEditingComponent({
                                          ...editingComponent!,
                                          notes: e.target.value,
                                        })
                                      }
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
                                          setDeleteConfirmOpen(component.id)
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
                                  </div>
                                ) : (
                                  <div className="text-xs">
                                    {component.notes || "—"}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }
        })
      )}

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Add a room to this selection meeting
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
                  onKeyDown={handleRoomInputKeyDown}
                  onFocus={() => setShowRoomDropdown(true)}
                  placeholder="Type to search or add new room"
                />
                {showRoomDropdown && filteredRooms.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredRooms.map((room, index) => (
                      <div
                        key={room.id}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                          index === selectedRoomIndex ? "bg-gray-100" : ""
                        }`}
                        onClick={() => handleSelectRoom(room.name)}
                      >
                        {room.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddRoomOpen(false)
                  setNewRoomName("")
                  setShowRoomDropdown(false)
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
            <form onSubmit={(e) => handleAddComponent(e, addComponentOpen)}>
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
                    placeholder="Add notes (optional)"
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
                  {addingComponent ? "Adding..." : "Add Components"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmOpen} onOpenChange={() => setDeleteConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this component? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(null)}
              disabled={deletingComponent}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComponent} disabled={deletingComponent}>
              {deletingComponent ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Catalog Item Selection Modal */}
      {editingComponentId && (
        <CatalogItemSelectModal
          key={editingComponentId}
          open={catalogModalOpen}
          onOpenChange={setCatalogModalOpen}
          catalogItems={catalogItems}
          selectedItemId={editingComponent?.materialId || null}
          initialCategoryFilter={editingComponent ? getCategoryIdForComponent(editingComponent.componentType) : null}
          onSelect={(itemId) => {
            if (editingComponent) {
              setEditingComponent({
                ...editingComponent,
                materialId: itemId || "",
              })
            }
          }}
          onCatalogItemCreated={async () => {
            // Refresh catalog items
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
