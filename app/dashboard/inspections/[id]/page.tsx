"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, CameraIcon, PencilIcon, ArrowDownTrayIcon, ArrowPathIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface CatalogItem {
  id: string
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
  category: {
    id: string
    name: string
  }
  component: {
    id: string
    name: string
  }
}

interface InspectionComponent {
  id: string
  componentType: string
  componentName: string | null
  status: string | null // "pass" | "fail" | null
  notes: string | null
  imageUrl: string | null
  designComponent: {
    condition: string | null
    materialId: string | null
    catalogItem: CatalogItem | null
    quantity: number
    unitCost: number
    totalCost: number
    residentUpgrade: boolean | null
    notes: string | null
  } | null
}

interface InspectionRoom {
  id: string
  name: string
  type: string | null
  status: string | null
  order: number
  inspectionComponents: InspectionComponent[]
}

interface Inspection {
  id: string
  inspectedBy: string | null
  inspectedAt: string
  status: string | null
  projectId: string | null
  project?: {
    id: string
    name: string
  } | null
  designProject: {
    id: string
    name: string
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
  }
  inspectionRooms: InspectionRoom[]
}

export default function InspectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const inspectionId = params?.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingComponent, setUpdatingComponent] = useState<string | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [notesText, setNotesText] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingRoomName, setEditingRoomName] = useState("")
  const [savingRoom, setSavingRoom] = useState(false)
  const [deleteRoomConfirmOpen, setDeleteRoomConfirmOpen] = useState<string | null>(null)
  const [deletingRoom, setDeletingRoom] = useState(false)
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [savingProject, setSavingProject] = useState(false)

  useEffect(() => {
    if (inspectionId) {
      fetchInspection()
    }
  }, [inspectionId])

  useEffect(() => {
    // Expand all rooms by default when inspection loads
    if (inspection && inspection.inspectionRooms.length > 0) {
      setExpandedRooms(new Set(inspection.inspectionRooms.map(room => room.id)))
    }
  }, [inspection])

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

  const fetchInspection = async () => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`)
      if (response.ok) {
        const data = await response.json()
        setInspection(data)
        setCurrentProjectId(data.projectId || null)
        
        // Fetch projects for this unit
        if (data.designProject?.unit?.id) {
          const projectsResponse = await fetch(`/api/projects?unitId=${data.designProject.unit.id}`)
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            setProjects(projectsData)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching inspection:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (componentId: string, status: "pass" | "fail" | null) => {
    if (!inspection) return

    // Optimistically update the local state immediately for instant feedback
    const previousInspection = JSON.parse(JSON.stringify(inspection)) // Deep copy for rollback
    
    setInspection((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        inspectionRooms: prev.inspectionRooms.map((room) => ({
          ...room,
          inspectionComponents: room.inspectionComponents.map((comp) =>
            comp.id === componentId ? { ...comp, status } : comp
          ),
        })),
      }
    })

    setUpdatingComponent(componentId)
    
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/components/${componentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update component status")
      }

      const updatedComponent = await response.json()

      // Update local state with the actual response from server (includes any room status updates)
      setInspection((prev) => {
        if (!prev) return prev
        
        // Find which room contains this component
        const roomWithComponent = prev.inspectionRooms.find((room) =>
          room.inspectionComponents.some((comp) => comp.id === componentId)
        )
        
        if (!roomWithComponent) return prev

        // Update the component status
        const updatedRooms = prev.inspectionRooms.map((room) => {
          if (room.id === roomWithComponent.id) {
            const updatedComponents = room.inspectionComponents.map((comp) =>
              comp.id === componentId ? { ...comp, status: updatedComponent.status } : comp
            )
            
            // Calculate room status based on updated components
            const completedCount = updatedComponents.filter((c) => c.status !== null).length
            const totalCount = updatedComponents.length
            let roomStatus = "pending"
            if (completedCount === totalCount && totalCount > 0) {
              roomStatus = "complete"
            } else if (completedCount > 0) {
              roomStatus = "in progress"
            }
            
            return {
              ...room,
              status: roomStatus,
              inspectionComponents: updatedComponents,
            }
          }
          return room
        })
        
        return {
          ...prev,
          inspectionRooms: updatedRooms,
        }
      })
    } catch (error) {
      console.error("Error updating component:", error)
      // Rollback to previous state on error
      setInspection(previousInspection)
      alert("Failed to update component status")
    } finally {
      setUpdatingComponent(null)
    }
  }

  const handleImageUpload = async (componentId: string, file: File) => {
    if (!inspection) return
    
    setUploadingImage(componentId)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/inspections/${inspectionId}/components/${componentId}/image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to upload image"
        const errorDetails = errorData.details ? `\n\nDetails: ${errorData.details}` : ""
        const errorCode = errorData.code ? `\n\nError Code: ${errorData.code}` : ""
        
        console.error("Image upload failed:", {
          error: errorMessage,
          details: errorData.details,
          code: errorData.code,
          meta: errorData.meta,
          uploadedImageUrl: errorData.uploadedImageUrl,
        })
        
        throw new Error(`${errorMessage}${errorDetails}${errorCode}`)
      }

      const updatedComponent = await response.json()

      // Update local state with new image URL
      setInspection((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          inspectionRooms: prev.inspectionRooms.map((room) => ({
            ...room,
            inspectionComponents: room.inspectionComponents.map((comp) =>
              comp.id === componentId ? { ...comp, imageUrl: updatedComponent.imageUrl } : comp
            ),
          })),
        }
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      
      // Show more detailed error message
      let errorMessage = error?.message || "Failed to upload image"
      
      // Check for common database errors
      if (error?.message?.includes("Unknown column") || error?.message?.includes("column") && error?.message?.includes("does not exist")) {
        errorMessage = "Database schema error: The imageUrl column may be missing. Please run database migrations."
      } else if (error?.message?.includes("P2002") || error?.message?.includes("Unique constraint")) {
        errorMessage = "A file with this name already exists. Please try again."
      } else if (error?.message?.includes("P2025")) {
        errorMessage = "Component not found in database."
      }
      
      alert(errorMessage)
    } finally {
      setUploadingImage(null)
    }
  }

  const handleCameraClick = (componentId: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment" // Use back camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleImageUpload(componentId, file)
      }
    }
    input.click()
  }

  const handleNotesClick = (componentId: string) => {
    const component = inspection?.inspectionRooms
      .flatMap(room => room.inspectionComponents)
      .find(comp => comp.id === componentId)
    
    setEditingComponentId(componentId)
    setNotesText(component?.notes || "")
    setNotesModalOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!editingComponentId) return

    setSavingNotes(true)
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/components/${editingComponentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesText }),
      })

      if (!response.ok) {
        throw new Error("Failed to save notes")
      }

      const updatedComponent = await response.json()

      // Update local state with new notes
      setInspection((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          inspectionRooms: prev.inspectionRooms.map((room) => ({
            ...room,
            inspectionComponents: room.inspectionComponents.map((comp) =>
              comp.id === editingComponentId ? { ...comp, notes: updatedComponent.notes } : comp
            ),
          })),
        }
      })
      
      setNotesModalOpen(false)
      setEditingComponentId(null)
      setNotesText("")
    } catch (error) {
      console.error("Error saving notes:", error)
      alert("Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  const handleEditRoomStart = (room: InspectionRoom) => {
    setEditingRoomId(room.id)
    setEditingRoomName(room.name)
  }

  const handleEditRoomCancel = () => {
    setEditingRoomId(null)
    setEditingRoomName("")
  }

  const handleEditRoomSave = async (roomId: string) => {
    if (!editingRoomName.trim()) {
      alert("Room name cannot be empty")
      return
    }

    setSavingRoom(true)
    try {
      const response = await fetch(`/api/inspection-rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingRoomName.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to update room name")
      }

      const updatedRoom = await response.json()

      // Update local state with new room name
      setInspection((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          inspectionRooms: prev.inspectionRooms.map((room) =>
            room.id === roomId ? { ...room, name: updatedRoom.name } : room
          ),
        }
      })

      setEditingRoomId(null)
      setEditingRoomName("")
    } catch (error) {
      console.error("Error updating room:", error)
      alert("Failed to update room name")
    } finally {
      setSavingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    setDeletingRoom(true)
    try {
      const response = await fetch(`/api/inspection-rooms/${roomId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete room")
      }

      // Update local state by removing the deleted room
      setInspection((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          inspectionRooms: prev.inspectionRooms.filter((room) => room.id !== roomId),
        }
      })

      setDeleteRoomConfirmOpen(null)
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Failed to delete room")
    } finally {
      setDeletingRoom(false)
    }
  }

  const getRoomStatusBadge = (status: string | null) => {
    if (status === "complete") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Complete
        </span>
      )
    } else if (status === "in progress") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          In Progress
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        Pending
      </span>
    )
  }

  // Calculate statistics
  const calculateStatistics = () => {
    if (!inspection) return { pass: 0, fail: 0, total: 0 }
    
    const allComponents = inspection.inspectionRooms.flatMap(
      (room) => room.inspectionComponents
    )
    
    const pass = allComponents.filter((comp) => comp.status === "pass").length
    const fail = allComponents.filter((comp) => comp.status === "fail").length
    const total = allComponents.length
    
    return { pass, fail, total }
  }

  const statistics = calculateStatistics()

  const handleInspectionStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update inspection status")
      }

      // Refresh inspection data
      await fetchInspection()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update inspection status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading inspection...</div>
  }

  if (!inspection) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Inspection not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/inspections">Back to Inspections</Link>
        </Button>
      </div>
    )
  }

  const handleProjectChange = async (projectId: string) => {
    setSavingProject(true)
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{inspection.designProject.name}</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Inspection Details
          </p>
        </div>
        <Button
          variant="outline"
          disabled={exportingPDF}
          onClick={async () => {
            setExportingPDF(true)
            try {
              const response = await fetch(`/api/export-pdf?type=inspection&id=${inspectionId}`)
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
              a.download = `inspection-${inspectionId}-${Date.now()}.pdf`
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
          {exportingPDF ? "Generating PDF..." : "Export PDF"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">Inspection Details</CardTitle>
            {inspection.designProject.unit.building.community.logoUrl && (
              <div className="h-8 w-8 relative">
                <img
                  src={inspection.designProject.unit.building.community.logoUrl}
                  alt={`${inspection.designProject.unit.building.community.name} logo`}
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
              <p className="text-xs font-medium mt-0.5">{inspection.designProject.unit.building.community.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Building</Label>
              <p className="text-xs font-medium mt-0.5">{inspection.designProject.unit.building.name}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Unit</Label>
              <p className="text-xs font-medium mt-0.5">Unit {inspection.designProject.unit.number}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Inspected By</Label>
              <p className="text-xs font-medium mt-0.5">{inspection.inspectedBy || "—"}</p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Date</Label>
              <p className="text-xs font-medium mt-0.5">
                {new Date(inspection.inspectedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-gray-500 text-xs">Status</Label>
              <Select
                value={inspection.status || "draft"}
                onValueChange={handleInspectionStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="h-7 text-xs mt-0.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div>
              <Label className="text-gray-500 text-xs">Statistics</Label>
              <div className="mt-0.5 space-y-0.5">
                <p className="text-xs font-medium">
                  Pass: <span className="text-green-600">{statistics.pass}</span>
                </p>
                <p className="text-xs font-medium">
                  Fail: <span className="text-red-600">{statistics.fail}</span>
                </p>
                <p className="text-xs font-medium text-gray-600">
                  Total: {statistics.total}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {inspection.inspectionRooms.map((room) => {
        const isExpanded = expandedRooms.has(room.id)
        return (
        <Card key={room.id} className="overflow-hidden">
          <CardHeader 
            className="bg-gray-50 pb-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => toggleRoom(room.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {editingRoomId === room.id ? (
                  <div className="flex items-center gap-2 flex-1">
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
                      className="h-7 w-7 p-0"
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
                      className="h-7 w-7 p-0"
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
                    <CardTitle className="text-sm font-semibold">{room.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
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
              <div className="flex items-center gap-2">
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
                {getRoomStatusBadge(room.status)}
              </div>
            </div>
          </CardHeader>
          {isExpanded && (
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {room.inspectionComponents.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No components in this room
                </div>
              ) : (
                room.inspectionComponents.map((component) => (
                  <div
                    key={component.id}
                    className={cn(
                      "flex flex-col gap-2 p-3 md:p-4 hover:bg-gray-50 transition-colors",
                      component.status === "pass" && "bg-green-50/50",
                      component.status === "fail" && "bg-red-50/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">
                          {component.componentType}
                          {component.componentName && (
                            <span className="text-gray-500 ml-1 font-normal">- {component.componentName}</span>
                          )}
                        </div>
                        {component.designComponent && (
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            {component.designComponent.condition && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Condition:</span>
                                <span className="px-2 py-0.5 rounded text-xs bg-gray-100">
                                  {component.designComponent.condition}
                                </span>
                              </div>
                            )}
                            {component.designComponent.catalogItem && (
                              <>
                                {component.designComponent.catalogItem.manufacturer && (
                                  <div>
                                    <span className="font-medium">Manufacturer:</span>{" "}
                                    {component.designComponent.catalogItem.manufacturer}
                                    {component.designComponent.catalogItem.modelNumber && (
                                      <span className="ml-1">({component.designComponent.catalogItem.modelNumber})</span>
                                    )}
                                  </div>
                                )}
                                {component.designComponent.catalogItem.description && (
                                  <div>
                                    <span className="font-medium">Description:</span>{" "}
                                    {component.designComponent.catalogItem.description}
                                  </div>
                                )}
                                {(component.designComponent.catalogItem.finish || component.designComponent.catalogItem.color) && (
                                  <div>
                                    <span className="font-medium">Finish/Color:</span>{" "}
                                    {[component.designComponent.catalogItem.finish, component.designComponent.catalogItem.color]
                                      .filter(Boolean)
                                      .join(" / ")}
                                  </div>
                                )}
                              </>
                            )}
                            {component.designComponent.quantity > 1 && (
                              <div>
                                <span className="font-medium">Quantity:</span> {component.designComponent.quantity}
                              </div>
                            )}
                            {component.designComponent.residentUpgrade && (
                              <div className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 inline-block">
                                Resident Upgrade
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={component.status === "pass" ? "default" : "outline"}
                            className={cn(
                              "min-w-[60px] md:min-w-[80px] h-9 md:h-10 text-xs font-semibold",
                              component.status === "pass" && "bg-green-600 hover:bg-green-700 text-white"
                            )}
                            onClick={() => handleStatusChange(component.id, component.status === "pass" ? null : "pass")}
                            disabled={updatingComponent === component.id}
                          >
                            {updatingComponent === component.id && component.status === "pass" ? "..." : "Pass"}
                          </Button>
                          <Button
                            size="sm"
                            variant={component.status === "fail" ? "default" : "outline"}
                            className={cn(
                              "min-w-[60px] md:min-w-[80px] h-9 md:h-10 text-xs font-semibold",
                              component.status === "fail" && "bg-red-600 hover:bg-red-700 text-white"
                            )}
                            onClick={() => handleStatusChange(component.id, component.status === "fail" ? null : "fail")}
                            disabled={updatingComponent === component.id}
                          >
                            {updatingComponent === component.id && component.status === "fail" ? "..." : "Fail"}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-9 md:h-10 text-xs font-semibold",
                            "w-full" // Full width of the container (equal to Pass + gap + Fail buttons)
                          )}
                          onClick={() => handleCameraClick(component.id)}
                          disabled={uploadingImage === component.id}
                        >
                          {uploadingImage === component.id ? (
                            "..."
                          ) : (
                            <>
                              <CameraIcon className="h-4 w-4 mr-2" />
                              Photo
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "h-9 md:h-10 text-xs font-semibold",
                            "w-full" // Full width of the container (equal to Pass + gap + Fail buttons)
                          )}
                          onClick={() => handleNotesClick(component.id)}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Notes
                        </Button>
                        {component.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={component.imageUrl}
                              alt={`${component.componentType} inspection photo`}
                              className="h-20 w-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewingImageUrl(component.imageUrl)
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {component.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 w-full">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                          {component.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
          )}
        </Card>
        )
      })}

      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add notes for this inspection component
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
                setEditingComponentId(null)
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

      {/* Delete Room Confirmation Dialog */}
      <Dialog open={!!deleteRoomConfirmOpen} onOpenChange={() => setDeleteRoomConfirmOpen(null)}>
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

      {/* Image Viewer Modal */}
      <Dialog open={!!viewingImageUrl} onOpenChange={(open) => !open && setViewingImageUrl(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Inspection Photo</DialogTitle>
            <DialogDescription>
              Click outside or press ESC to close
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2 flex items-center justify-center bg-gray-50">
            {viewingImageUrl && (
              <img
                src={viewingImageUrl}
                alt="Inspection photo"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%236b7280' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage failed to load%3C/text%3E%3C/svg%3E"
                }}
              />
            )}
          </div>
          <DialogFooter className="p-6 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewingImageUrl(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

