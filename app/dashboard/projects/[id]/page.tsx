"use client"

import { useState, useEffect } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import {
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  profilePictureUrl: string | null
}

interface Assessment {
  id: string
  assessedAt: string
  assessedBy: string | null
  rooms: {
    id: string
  }[]
}

interface Selection {
  id: string
  name: string
  status: string | null
  designRooms: {
    id: string
  }[]
}

interface Inspection {
  id: string
  inspectedAt: string
  inspectedBy: string | null
  status: string | null
  inspectionRooms: {
    id: string
  }[]
}

interface ProjectResident {
  id: string
  lastName: string
  firstName: string
  phone: string | null
  email: string | null
  createdAt: string
}

interface ProjectNote {
  id: string
  content: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  notes: string | null
  status: string | null
  vacancyDate: string | null
  moveInDate: string | null
  createdAt: string
  updatedAt: string
  unit: {
    id: string
    number: string
    building: {
      name: string
      community: {
        id: string
        name: string
      }
    }
  }
  assignments: {
    user: User
  }[]
  assessments: Assessment[]
  selections: Selection[]
  inspections: Inspection[]
  residents: ProjectResident[]
  projectNotes: ProjectNote[]
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingAssignments, setEditingAssignments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [editData, setEditData] = useState({
    name: "",
    notes: "",
    status: "Pending",
    vacancyDate: "",
    moveInDate: "",
  })

  const [assignmentUserIds, setAssignmentUserIds] = useState<string[]>([])
  const [editingDates, setEditingDates] = useState(false)
  const [dateData, setDateData] = useState({
    vacancyDate: "",
    moveInDate: "",
  })
  
  const [addingResident, setAddingResident] = useState(false)
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null)
  const [residentForm, setResidentForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
  })
  const [savingResident, setSavingResident] = useState(false)
  const [deletingResidentId, setDeletingResidentId] = useState<string | null>(null)
  
  const [newNote, setNewNote] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    try {
      const [projectResponse, usersResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch("/api/users"),
      ])

      if (projectResponse.ok) {
        const data = await projectResponse.json()
        setProject(data)
        setEditData({
          name: data.name,
          notes: data.notes || "",
          status: data.status || "Pending",
          vacancyDate: data.vacancyDate ? new Date(data.vacancyDate).toISOString().split("T")[0] : "",
          moveInDate: data.moveInDate ? new Date(data.moveInDate).toISOString().split("T")[0] : "",
        })
        setDateData({
          vacancyDate: data.vacancyDate ? new Date(data.vacancyDate).toISOString().split("T")[0] : "",
          moveInDate: data.moveInDate ? new Date(data.moveInDate).toISOString().split("T")[0] : "",
        })
        setAssignmentUserIds(data.assignments.map((a: { user: User }) => a.user.id))
      }

      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError("")
    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.details 
          ? `${data.error || "Failed to update project"}: ${data.details}`
          : data.error || "Failed to update project"
        throw new Error(errorMessage)
      }

      const updated = await response.json()
      setProject(updated)
      setEditData({
        name: updated.name,
        notes: updated.notes || "",
        status: updated.status || "Pending",
        vacancyDate: updated.vacancyDate ? new Date(updated.vacancyDate).toISOString().split("T")[0] : "",
        moveInDate: updated.moveInDate ? new Date(updated.moveInDate).toISOString().split("T")[0] : "",
      })
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDates = async () => {
    setError("")
    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project?.name,
          notes: project?.notes,
          vacancyDate: dateData.vacancyDate || null,
          moveInDate: dateData.moveInDate || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update dates")
      }

      const updated = await response.json()
      setProject(updated)
      setDateData({
        vacancyDate: updated.vacancyDate ? new Date(updated.vacancyDate).toISOString().split("T")[0] : "",
        moveInDate: updated.moveInDate ? new Date(updated.moveInDate).toISOString().split("T")[0] : "",
      })
      setEditingDates(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleAddResident = async () => {
    if (!residentForm.lastName.trim() || !residentForm.firstName.trim()) {
      setError("Last name and first name are required")
      return
    }

    setSavingResident(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/residents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(residentForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add resident")
      }

      setResidentForm({ lastName: "", firstName: "", phone: "", email: "" })
      setAddingResident(false)
      router.refresh()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSavingResident(false)
    }
  }

  const handleUpdateResident = async () => {
    if (!editingResidentId || !residentForm.lastName.trim() || !residentForm.firstName.trim()) {
      setError("Last name and first name are required")
      return
    }

    setSavingResident(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/residents?residentId=${editingResidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(residentForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update resident")
      }

      setResidentForm({ lastName: "", firstName: "", phone: "", email: "" })
      setEditingResidentId(null)
      router.refresh()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSavingResident(false)
    }
  }

  const handleDeleteResident = async (residentId: string) => {
    if (!confirm("Are you sure you want to delete this resident?")) return

    setDeletingResidentId(residentId)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/residents?residentId=${residentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete resident")
      }

      router.refresh()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setDeletingResidentId(null)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setError("Note content is required")
      return
    }

    setAddingNote(true)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add note")
      }

      setNewNote("")
      router.refresh()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    setDeletingNoteId(noteId)
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/notes?noteId=${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete note")
      }

      router.refresh()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setDeletingNoteId(null)
    }
  }

  const startEditResident = (resident: ProjectResident) => {
    setEditingResidentId(resident.id)
    setResidentForm({
      lastName: resident.lastName,
      firstName: resident.firstName,
      phone: resident.phone || "",
      email: resident.email || "",
    })
    setAddingResident(true)
  }

  const handleSaveAssignments = async () => {
    setError("")
    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedUserIds: assignmentUserIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update assignments")
      }

      const updated = await response.json()
      setProject(updated)
      setAssignmentUserIds(updated.assignments.map((a: { user: User }) => a.user.id))
      setEditingAssignments(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  // Timeline status checks
  const hasAssessment = project?.assessments && project.assessments.length > 0
  const hasSelection = project?.selections && project.selections.length > 0
  const hasInspection = project?.inspections && project.inspections.length > 0

  // Check if assessment is "complete" (has rooms with components)
  const assessmentComplete =
    hasAssessment &&
    project.assessments.some((a) => a.rooms && a.rooms.length > 0)

  // Check if selection is complete (status is "complete")
  const selectionComplete =
    hasSelection &&
    project.selections.some((s) => s.status === "complete" || s.status === "Completed")

  // Check if inspection is complete (status is "complete")
  const inspectionComplete =
    hasInspection &&
    project.inspections.some(
      (i) => i.status === "complete" && i.inspectionRooms && i.inspectionRooms.length > 0
    )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-red-500">Project not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Unit {project.unit.number} • {project.unit.building.name} •{" "}
            {project.unit.building.community.name}
          </p>
        </div>
      </div>

      {/* Timeline Component */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Assessment Step */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2",
                  assessmentComplete
                    ? "bg-green-100 border-green-500 text-green-600"
                    : hasAssessment
                    ? "bg-yellow-100 border-yellow-500 text-yellow-600"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                )}
              >
                {assessmentComplete ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : hasAssessment ? (
                  <ClockIcon className="h-6 w-6" />
                ) : (
                  <XCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Assessment</div>
                <div className="text-xs text-gray-500">
                  {assessmentComplete
                    ? "Complete"
                    : hasAssessment
                    ? "In Progress"
                    : "Not Started"}
                </div>
                {hasAssessment && (
                  <Link
                    href={`/dashboard/assessments/${project.assessments[0].id}`}
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View Assessment
                  </Link>
                )}
              </div>
            </div>

            {/* Connector Line */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />

            {/* Selection Step */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2",
                  selectionComplete
                    ? "bg-green-100 border-green-500 text-green-600"
                    : hasSelection
                    ? "bg-yellow-100 border-yellow-500 text-yellow-600"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                )}
              >
                {selectionComplete ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : hasSelection ? (
                  <ClockIcon className="h-6 w-6" />
                ) : (
                  <XCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Selection</div>
                <div className="text-xs text-gray-500">
                  {selectionComplete
                    ? "Complete"
                    : hasSelection
                    ? "In Progress"
                    : "Not Started"}
                </div>
                {hasSelection && (
                  <Link
                    href={`/dashboard/selections/${project.selections[0].id}`}
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View Selection
                  </Link>
                )}
              </div>
            </div>

            {/* Connector Line */}
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />

            {/* Inspection Step */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2",
                  inspectionComplete
                    ? "bg-green-100 border-green-500 text-green-600"
                    : hasInspection
                    ? "bg-yellow-100 border-yellow-500 text-yellow-600"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                )}
              >
                {inspectionComplete ? (
                  <CheckCircleIcon className="h-6 w-6" />
                ) : hasInspection ? (
                  <ClockIcon className="h-6 w-6" />
                ) : (
                  <XCircleIcon className="h-6 w-6" />
                )}
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Inspection</div>
                <div className="text-xs text-gray-500">
                  {inspectionComplete
                    ? "Complete"
                    : hasInspection
                    ? "In Progress"
                    : "Not Started"}
                </div>
                {hasInspection && (
                  <Link
                    href={`/dashboard/inspections/${project.inspections[0].id}`}
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View Inspection
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Project Details</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData({ ...editData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editData.notes}
                    onChange={(e) =>
                      setEditData({ ...editData, notes: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false)
                      setEditData((prev) => ({
                        ...prev,
                        name: project.name,
                        notes: project.notes || "",
                        status: project.status || "Pending",
                        vacancyDate: project.vacancyDate ? new Date(project.vacancyDate).toISOString().split("T")[0] : "",
                        moveInDate: project.moveInDate ? new Date(project.moveInDate).toISOString().split("T")[0] : "",
                      }))
                      setError("")
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Name</Label>
                  <p className="mt-1">{project.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">
                    {project.status === "Pending" && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Pending
                      </span>
                    )}
                    {project.status === "In Progress" && (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        In Progress
                      </span>
                    )}
                    {project.status === "Complete" && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Complete
                      </span>
                    )}
                    {!project.status && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {project.notes && (
                  <div>
                    <Label className="text-gray-500">Notes</Label>
                    <p className="mt-1 whitespace-pre-wrap">{project.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dates</CardTitle>
              {!editingDates && (
                <Button variant="outline" size="sm" onClick={() => setEditingDates(true)}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingDates ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vacancyDate">Vacancy Date</Label>
                  <Input
                    id="vacancyDate"
                    type="date"
                    value={dateData.vacancyDate}
                    onChange={(e) =>
                      setDateData({ ...dateData, vacancyDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInDate">Move In Date</Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    value={dateData.moveInDate}
                    onChange={(e) =>
                      setDateData({ ...dateData, moveInDate: e.target.value })
                    }
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveDates} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDates(false)
                      setDateData({
                        vacancyDate: project?.vacancyDate ? new Date(project.vacancyDate).toISOString().split("T")[0] : "",
                        moveInDate: project?.moveInDate ? new Date(project.moveInDate).toISOString().split("T")[0] : "",
                      })
                      setError("")
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Vacancy Date</Label>
                  <p className="mt-1">
                    {project.vacancyDate
                      ? new Date(project.vacancyDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Move In Date</Label>
                  <p className="mt-1">
                    {project.moveInDate
                      ? new Date(project.moveInDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Residents and Assigned Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Residents</CardTitle>
              {!addingResident && !editingResidentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingResident(true)
                    setEditingResidentId(null)
                    setResidentForm({ lastName: "", firstName: "", phone: "", email: "" })
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Resident
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {addingResident ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={residentForm.firstName}
                      onChange={(e) =>
                        setResidentForm({ ...residentForm, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={residentForm.lastName}
                      onChange={(e) =>
                        setResidentForm({ ...residentForm, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={residentForm.phone}
                    onChange={(e) =>
                      setResidentForm({ ...residentForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={residentForm.email}
                    onChange={(e) =>
                      setResidentForm({ ...residentForm, email: e.target.value })
                    }
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={editingResidentId ? handleUpdateResident : handleAddResident}
                    disabled={savingResident}
                  >
                    {savingResident ? "Saving..." : editingResidentId ? "Update" : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddingResident(false)
                      setEditingResidentId(null)
                      setResidentForm({ lastName: "", firstName: "", phone: "", email: "" })
                      setError("")
                    }}
                    disabled={savingResident}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {project.residents && project.residents.length > 0 ? (
                  project.residents.map((resident) => (
                    <div
                      key={resident.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {resident.firstName} {resident.lastName}
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {resident.phone && <div>{resident.phone}</div>}
                            {resident.email && <div>{resident.email}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditResident(resident)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResident(resident.id)}
                          disabled={deletingResidentId === resident.id}
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No residents added yet
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assigned Users</CardTitle>
              {!editingAssignments && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAssignments(true)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingAssignments ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign Users</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !assignmentUserIds.includes(value)) {
                        setAssignmentUserIds([...assignmentUserIds, value])
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select users to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((user) => !assignmentUserIds.includes(user.id))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {assignmentUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {assignmentUserIds.map((userId) => {
                        const user = users.find((u) => u.id === userId)
                        return (
                          <span
                            key={userId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {user?.name || user?.email}
                            <button
                              type="button"
                              onClick={() =>
                                setAssignmentUserIds(
                                  assignmentUserIds.filter((id) => id !== userId)
                                )
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleSaveAssignments} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingAssignments(false)
                      setAssignmentUserIds(
                        project.assignments.map((a) => a.user.id)
                      )
                      setError("")
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {project.assignments.length > 0 ? (
                  project.assignments.map((assignment) => (
                    <div
                      key={assignment.user.id}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {(assignment.user.name || assignment.user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {assignment.user.name || assignment.user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.user.role}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No users assigned</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Notes - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Project Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Note Form */}
            <div className="space-y-2">
              <Label htmlFor="newNote">Add Note</Label>
              <Textarea
                id="newNote"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this project..."
                rows={3}
                className="w-full"
              />
              <Button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                size="sm"
              >
                {addingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Notes Timeline */}
            {project.projectNotes && project.projectNotes.length > 0 ? (
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-semibold text-gray-700">Note History</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  {/* Notes */}
                  <div className="space-y-6">
                    {project.projectNotes.map((note, index) => (
                      <div key={note.id} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        
                        {/* Note content */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No notes yet. Add a note to track project development.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
