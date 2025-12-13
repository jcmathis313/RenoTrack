"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { ArrowLeftIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon, ArrowDownTrayIcon, ArrowPathIcon, PencilIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { AssessmentImportTemplateModal } from "@/components/AssessmentImportTemplateModal"

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
  projectId: string | null
  project?: {
    id: string
    name: string
  } | null
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
  const [importTemplateOpen, setImportTemplateOpen] = useState(false)
  const [addComponentOpen, setAddComponentOpen] = useState<string | null>(null)

  const [newRoomName, setNewRoomName] = useState("")
  const [filteredRooms, setFilteredRooms] = useState<RoomTemplate[]>([])
  const [showRoomDropdown, setShowRoomDropdown] = useState(false)
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(-1)
  const [addingRoom, setAddingRoom] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingRoomName, setEditingRoomName] = useState("")
  const [savingRoom, setSavingRoom] = useState(false)
  const [deleteRoomConfirmOpen, setDeleteRoomConfirmOpen] = useState<string | null>(null)
  const [deletingRoom, setDeletingRoom] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [savingProject, setSavingProject] = useState(false)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [notesComponentId, setNotesComponentId] = useState<string | null>(null)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingCondition, setUpdatingCondition] = useState<string | null>(null)
  const [editComponentDialogOpen, setEditComponentDialogOpen] = useState(false)
  const [editingNotesInline, setEditingNotesInline] = useState<string | null>(null)
  const [inlineNotesText, setInlineNotesText] = useState("")
  const [savingInlineNotes, setSavingInlineNotes] = useState(false)

  useEffect(() => {
    if (assessmentId) {
      fetchData()
    } else {
      setLoading(false)
      console.error("Assessment ID not found in params")
    }
  }, [assessmentId])

  useEffect(() => {
    // Expand all rooms by default when assessment loads
    if (assessment && assessment.rooms.length > 0) {
      setExpandedRooms(new Set(assessment.rooms.map(room => room.id)))
    }
  }, [assessment])

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

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
        setCurrentProjectId(assessmentData.projectId || null)
        
        // Fetch projects for this unit
        if (assessmentData.unit?.id) {
          const projectsResponse = await fetch(`/api/projects?unitId=${assessmentData.unit.id}`)
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
        }
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

  const handleConditionChange = async (componentId: string, condition: string) => {
    if (!assessment) return

    // Optimistically update the local state immediately for instant feedback
    const previousAssessment = JSON.parse(JSON.stringify(assessment)) // Deep copy for rollback
    
    setAssessment((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rooms: prev.rooms.map((room) => ({
          ...room,
          componentAssessments: room.componentAssessments.map((comp) =>
            comp.id === componentId ? { ...comp, condition } : comp
          ),
        })),
      }
    })

    setUpdatingCondition(componentId)
    
    try {
      const component = assessment.rooms
        .flatMap(room => room.componentAssessments)
        .find(comp => comp.id === componentId)

      if (!component) {
        throw new Error("Component not found")
      }

      const response = await fetch(`/api/component-assessments/${componentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          componentType: component.componentType,
          componentName: component.componentName,
          condition: condition,
          notes: component.notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update component condition")
      }

      const updatedComponent = await response.json()

      // Update local state with the actual response from server
      setAssessment((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          rooms: prev.rooms.map((room) => ({
            ...room,
            componentAssessments: room.componentAssessments.map((comp) =>
              comp.id === componentId ? { ...comp, condition: updatedComponent.condition } : comp
            ),
          })),
        }
      })
    } catch (error) {
      console.error("Error updating component condition:", error)
      // Rollback to previous state on error
      setAssessment(previousAssessment)
      alert("Failed to update component condition")
    } finally {
      setUpdatingCondition(null)
    }
  }

  const handleNotesClick = (componentId: string) => {
    const component = assessment?.rooms
      .flatMap(room => room.componentAssessments)
      .find(comp => comp.id === componentId)
    
    setNotesComponentId(componentId)
    setNotesText(component?.notes || "")
    setNotesModalOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!notesComponentId) return

    setSavingNotes(true)
    try {
      const component = assessment?.rooms
        .flatMap(room => room.componentAssessments)
        .find(comp => comp.id === notesComponentId)

      if (!component) {
        throw new Error("Component not found")
      }

      const response = await fetch(`/api/component-assessments/${notesComponentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          componentType: component.componentType,
          componentName: component.componentName,
          condition: component.condition,
          notes: notesText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save notes")
      }

      const updatedComponent = await response.json()

      // Update local state with new notes
      setAssessment((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          rooms: prev.rooms.map((room) => ({
            ...room,
            componentAssessments: room.componentAssessments.map((comp) =>
              comp.id === notesComponentId ? { ...comp, notes: updatedComponent.notes } : comp
            ),
          })),
        }
      })
      
      setNotesModalOpen(false)
      setNotesComponentId(null)
      setNotesText("")
    } catch (error) {
      console.error("Error saving notes:", error)
      alert("Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  const handleStartEditingNotesInline = (componentId: string) => {
    const component = assessment?.rooms
      .flatMap(room => room.componentAssessments)
      .find(comp => comp.id === componentId)
    
    setEditingNotesInline(componentId)
    setInlineNotesText(component?.notes || "")
  }

  const handleSaveInlineNotes = async (componentId: string) => {
    setSavingInlineNotes(true)
    try {
      const component = assessment?.rooms
        .flatMap(room => room.componentAssessments)
        .find(comp => comp.id === componentId)

      if (!component) {
        throw new Error("Component not found")
      }

      const response = await fetch(`/api/component-assessments/${componentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          componentType: component.componentType,
          componentName: component.componentName,
          condition: component.condition,
          notes: inlineNotesText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save notes")
      }

      const updatedComponent = await response.json()

      // Update local state with new notes
      setAssessment((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          rooms: prev.rooms.map((room) => ({
            ...room,
            componentAssessments: room.componentAssessments.map((comp) =>
              comp.id === componentId ? { ...comp, notes: updatedComponent.notes } : comp
            ),
          })),
        }
      })
      
      setEditingNotesInline(null)
      setInlineNotesText("")
    } catch (error) {
      console.error("Error saving notes:", error)
      alert("Failed to save notes")
    } finally {
      setSavingInlineNotes(false)
    }
  }

  const handleCancelInlineNotes = () => {
    setEditingNotesInline(null)
    setInlineNotesText("")
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

  const handleEditRoomSave = async (roomId: string) => {
    if (!editingRoomName.trim()) {
      return
    }

    setSavingRoom(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingRoomName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update room")
      }

      setEditingRoomId(null)
      setEditingRoomName("")
      fetchData()
    } catch (error) {
      console.error("Error updating room:", error)
      alert("Failed to update room")
    } finally {
      setSavingRoom(false)
    }
  }

  const handleEditRoomCancel = () => {
    setEditingRoomId(null)
    setEditingRoomName("")
  }

  const handleEditRoomStart = (room: Room) => {
    setEditingRoomId(room.id)
    setEditingRoomName(room.name)
  }

  const handleDeleteRoom = async (roomId: string) => {
    setDeletingRoom(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      setDeleteRoomConfirmOpen(null)
      fetchData()
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Failed to delete room")
    } finally {
      setDeletingRoom(false)
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

  const handleProjectChange = async (projectId: string) => {
    setSavingProject(true)
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectId || null }),
      })

      if (!response.ok) {
        throw new Error("Failed to update project association")
      }

      setCurrentProjectId(projectId || null)
      router.refresh()
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Failed to update project association")
    } finally {
      setSavingProject(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Assessment</h1>
          <p className="mt-1 text-xs md:text-sm text-gray-500 break-words">
            {assessment.unit.building.community.name} - {assessment.unit.building.name} - Unit {assessment.unit.number}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={exportingPDF}
          onClick={async () => {
            setExportingPDF(true)
            try {
              const response = await fetch(`/api/export-pdf?type=assessment&id=${assessmentId}`)
              const contentType = response.headers.get("content-type")
              if (!response.ok || !contentType?.includes("application/pdf")) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                  errorData.error ||
                    errorData.details ||
                    `Failed to generate PDF: ${response.status} ${response.statusText}`
                )
              }
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `assessment-${assessmentId}-${Date.now()}.pdf`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
            } catch (error: any) {
              console.error("Error exporting PDF:", error)
              alert(error?.message || "Failed to export PDF")
            } finally {
              setExportingPDF(false)
            }
          }}
        >
          {exportingPDF ? (
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          )}
          <span className="hidden sm:inline">{exportingPDF ? "Generating PDF..." : "Export PDF"}</span>
          <span className="sm:hidden">PDF</span>
        </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-2">
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
            <div>
              <Label className="text-gray-500 text-xs">Project</Label>
              <div className="mt-0.5">
                <Select
                  value={currentProjectId || undefined}
                  onValueChange={handleProjectChange}
                  disabled={savingProject || projects.length === 0}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 md:gap-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Rooms</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportTemplateOpen(true)}
              className="text-xs md:text-sm"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Import Template</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => setAddRoomOpen(true)}
              className="text-xs md:text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1 md:mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {assessment.rooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-12 text-center space-y-4 px-4">
              <p className="text-sm md:text-base text-gray-500">No rooms added yet. Import a template or add your first room to start assessing components.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <Button 
                  size="sm"
                  onClick={() => setImportTemplateOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Import Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAddRoomOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          assessment.rooms.map((room, roomIndex) => {
            const isExpanded = expandedRooms.has(room.id)
            return (
            <Card key={room.id} className="overflow-hidden">
              <CardHeader 
                className="bg-gray-50 pb-3 hover:bg-gray-100 transition-colors px-3 md:px-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 md:gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => toggleRoom(room.id)}
                      className="flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500 shrink-0" />
                      )}
                    </button>
                    {editingRoomId === room.id ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Input
                          value={editingRoomName}
                          onChange={(e) => setEditingRoomName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditRoomSave(room.id)
                            } else if (e.key === "Escape") {
                              handleEditRoomCancel()
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm font-semibold"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditRoomSave(room.id)
                          }}
                          disabled={savingRoom}
                        >
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditRoomCancel()
                          }}
                          disabled={savingRoom}
                        >
                          <XMarkIcon className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-sm md:text-base font-semibold truncate">{room.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditRoomStart(room)
                          }}
                          title="Edit room name"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
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
                        className="h-7 w-7 p-0"
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
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteRoomConfirmOpen(room.id)
                      }}
                      title="Delete room"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddComponentOpen(room.id)
                      }}
                      className="text-xs md:text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Add Component</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {room.componentAssessments.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No components assessed yet. Add components to this room.
                    </div>
                  ) : (
                    room.componentAssessments.map((component) => {
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
                        <div
                          key={component.id}
                          className={cn(
                            "flex flex-col md:grid md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 p-3 md:p-4 hover:bg-gray-50 transition-colors",
                            colorClasses[color as keyof typeof colorClasses]?.replace("text-", "bg-").replace("-700", "-50/50") || "bg-gray-50/50"
                          )}
                        >
                          {/* Column 1: Title and Breadcrumbs */}
                          <div className="flex-1 min-w-0">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <span>{room.name}</span>
                              <ChevronRightIcon className="h-3 w-3" />
                              <span>{component.componentType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm md:text-base">
                                {component.componentType}
                                {component.componentName && component.componentName !== component.componentType && (
                                  <span className="text-gray-500 ml-1 font-normal">- {component.componentName}</span>
                                )}
                              </div>
                              {/* Edit icon - visible on md and up */}
                              <button
                                onClick={() => {
                                  setEditingComponentId(component.id)
                                  setEditingComponent({
                                    componentType: component.componentType,
                                    condition: component.condition,
                                    notes: component.notes || "",
                                  })
                                  setEditComponentDialogOpen(true)
                                }}
                                className="hidden md:flex items-center justify-center h-6 w-6 rounded hover:bg-gray-100 transition-colors"
                                title="Edit component"
                              >
                                <PencilIcon className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                            {/* Delete icon - below title */}
                            <div className="mt-1">
                              <button
                                onClick={() => setDeleteConfirmOpen(component.id)}
                                disabled={deletingComponent}
                                className="flex items-center justify-center h-6 w-6 rounded hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                                title="Delete component"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {/* Mobile: Show action buttons below title */}
                            <div className="flex flex-col gap-2 mt-2 md:hidden">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs font-semibold w-full min-w-[100px]"
                                onClick={() => handleNotesClick(component.id)}
                              >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Notes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs font-semibold w-full min-w-[100px]"
                                onClick={() => {
                                  setEditingComponentId(component.id)
                                  setEditingComponent({
                                    componentType: component.componentType,
                                    condition: component.condition,
                                    notes: component.notes || "",
                                  })
                                  setEditComponentDialogOpen(true)
                                }}
                              >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                            {/* Mobile: Show notes below title */}
                            <div className="mt-2 md:hidden">
                              {component.notes && !editingNotesInline && (
                                <div className="p-2 bg-gray-50 rounded border border-gray-200 w-full">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {component.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column 2: Notes Section (Desktop only) */}
                          <div className="hidden md:flex md:flex-col md:justify-start">
                            {editingNotesInline === component.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={inlineNotesText}
                                  onChange={(e) => setInlineNotesText(e.target.value)}
                                  placeholder="Add notes..."
                                  rows={3}
                                  className="text-sm"
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelInlineNotes}
                                    disabled={savingInlineNotes}
                                    className="h-8 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveInlineNotes(component.id)}
                                    disabled={savingInlineNotes}
                                    className="h-8 text-xs"
                                  >
                                    {savingInlineNotes ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="p-2 bg-gray-50 rounded border border-gray-200 w-full cursor-text hover:bg-gray-100 transition-colors min-h-[60px]"
                                onClick={() => handleStartEditingNotesInline(component.id)}
                              >
                                {component.notes ? (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {component.notes}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">
                                    Click to add notes...
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Column 3: Assessment Condition */}
                          <div className="flex flex-col gap-2 md:justify-start">
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {componentStatuses.map((statusOption) => {
                                const isSelected = component.condition === statusOption.name
                                const statusColor = statusOption.color || "gray"
                                const buttonColorClasses = {
                                  green: isSelected ? "bg-green-600 hover:bg-green-700 text-white" : "border-green-300 text-green-700 hover:bg-green-50",
                                  orange: isSelected ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-orange-300 text-orange-700 hover:bg-orange-50",
                                  blue: isSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-300 text-blue-700 hover:bg-blue-50",
                                  red: isSelected ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-300 text-red-700 hover:bg-red-50",
                                  gray: isSelected ? "bg-gray-600 hover:bg-gray-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
                                  yellow: isSelected ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "border-yellow-300 text-yellow-700 hover:bg-yellow-50",
                                  purple: isSelected ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-purple-300 text-purple-700 hover:bg-purple-50",
                                }
                                return (
                                  <Button
                                    key={statusOption.id}
                                    size="sm"
                                    variant={isSelected ? "default" : "outline"}
                                    className={cn(
                                      "min-w-[50px] sm:min-w-[60px] md:min-w-[80px] h-8 sm:h-9 md:h-10 text-xs font-semibold px-2 md:px-3",
                                      buttonColorClasses[statusColor as keyof typeof buttonColorClasses] || buttonColorClasses.gray
                                    )}
                                    onClick={() => handleConditionChange(component.id, statusOption.name)}
                                    disabled={updatingCondition === component.id}
                                  >
                                    {updatingCondition === component.id && isSelected ? "..." : statusOption.name}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
              )}
            </Card>
            )
          })
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
                      No matching rooms. Press Enter to create &quot;{newRoomName}&quot;
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

      {/* Delete Room Confirmation Dialog */}
      <Dialog
        open={deleteRoomConfirmOpen !== null}
        onOpenChange={(open) => !open && setDeleteRoomConfirmOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room? All components in this room will also be deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteRoomConfirmOpen(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteRoomConfirmOpen && handleDeleteRoom(deleteRoomConfirmOpen)}
              disabled={deletingRoom}
            >
              {deletingRoom ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Template Modal */}
      <AssessmentImportTemplateModal
        open={importTemplateOpen}
        onOpenChange={setImportTemplateOpen}
        assessmentId={assessmentId}
        onSuccess={fetchData}
      />

      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add notes for this component assessment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs">Notes</Label>
              <Textarea
                id="notes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter notes..."
                rows={6}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNotesModalOpen(false)
                setNotesComponentId(null)
                setNotesText("")
              }}
              disabled={savingNotes}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Component Dialog */}
      {editingComponentId && editingComponent && (
        <Dialog 
          open={editComponentDialogOpen} 
          onOpenChange={(open) => {
            setEditComponentDialogOpen(open)
            if (!open) {
              setEditingComponentId(null)
              setEditingComponent(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
              <DialogDescription>
                Update component assessment details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`edit-componentType-${editingComponentId}`} className="text-xs">
                    Component Type *
                  </Label>
                  <Input
                    id={`edit-componentType-${editingComponentId}`}
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
                  <Label htmlFor={`edit-condition-${editingComponentId}`} className="text-xs">
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
                    <SelectTrigger id={`edit-condition-${editingComponentId}`} className="h-8 text-xs">
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
                <Label htmlFor={`edit-notes-${editingComponentId}`} className="text-xs">
                  Notes
                </Label>
                <Textarea
                  id={`edit-notes-${editingComponentId}`}
                  value={editingComponent.notes}
                  onChange={(e) =>
                    setEditingComponent({
                      ...editingComponent,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Optional notes..."
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingComponentId(null)
                  setEditingComponent(null)
                }}
                disabled={savingComponent}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveComponent(editingComponentId)}
                disabled={
                  savingComponent ||
                  !editingComponent.componentType ||
                  !editingComponent.condition
                }
              >
                {savingComponent ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
