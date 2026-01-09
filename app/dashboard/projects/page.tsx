"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StepProgress } from "@/components/ui/progress"
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

interface Unit {
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

interface User {
  id: string
  name: string | null
  email: string
  role: string
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
  residents: {
    id: string
    firstName: string
    lastName: string
  }[]
  _count: {
    assessments: number
    selections: number
    inspections: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    unitId: "",
    name: "",
    notes: "",
    assignedUserIds: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsResponse, unitsResponse, usersResponse] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/units"),
        fetch("/api/users"),
      ])

      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        setProjects(data)
      }

      if (unitsResponse.ok) {
        const data = await unitsResponse.json()
        setUnits(data)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create project")
      }

      const project = await response.json()
      setModalOpen(false)
      setFormData({
        unitId: "",
        name: "",
        notes: "",
        assignedUserIds: [],
      })
      router.push(`/dashboard/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getUnitDisplayName = (unit: Unit) => {
    return `${unit.building.community.name} - ${unit.building.name} - Unit ${unit.number}`
  }

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.unit.number.toLowerCase().includes(query) ||
      project.unit.building.community.name.toLowerCase().includes(query) ||
      project.unit.building.name.toLowerCase().includes(query) ||
      (project.notes && project.notes.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage projects and track assessments, selections, and inspections
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Projects</CardTitle>
            <div className="relative w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No projects match your search" : "No projects yet"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const hasAssessment = project._count.assessments > 0
                const hasSelection = project._count.selections > 0
                const hasInspection = project._count.inspections > 0

                return (
                  <Card
                    key={project.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.name}
                            </Link>
                          </CardTitle>
                          <div className="text-sm text-gray-600 space-y-0.5 mt-2">
                            <div className="font-medium">Unit {project.unit.number}</div>
                            <div className="text-gray-500">{project.unit.building.name}</div>
                            <div className="text-gray-400 text-xs">
                              {project.unit.building.community.name}
                            </div>
                          </div>
                          {project.assignments.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Assigned: {project.assignments.slice(0, 2).map((a) => a.user.name || a.user.email).join(", ")}
                              {project.assignments.length > 2 && ` +${project.assignments.length - 2} more`}
                            </div>
                          )}
                          {project.residents.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              Resident: {project.residents.map((r) => `${r.firstName} ${r.lastName}`).join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500 space-y-1 ml-4">
                          <div className="mb-2">
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
                          <div>
                            <div className="font-medium text-gray-700">Vacancy Date:</div>
                            <div>{formatDate(project.vacancyDate)}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Move In Date:</div>
                            <div>{formatDate(project.moveInDate)}</div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <StepProgress
                        hasAssessment={hasAssessment}
                        hasSelection={hasSelection}
                        hasInspection={hasInspection}
                        assessmentCount={project._count.assessments}
                        selectionCount={project._count.selections}
                        inspectionCount={project._count.inspections}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Project Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Create a new project to track assessments, selections, and inspections for a unit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unitId: value })
                  }
                >
                  <SelectTrigger id="unitId">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {getUnitDisplayName(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Unit 101 Renovation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any notes about this project..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedUsers">Assign Users</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !formData.assignedUserIds.includes(value)) {
                      setFormData({
                        ...formData,
                        assignedUserIds: [...formData.assignedUserIds, value],
                      })
                    }
                  }}
                >
                  <SelectTrigger id="assignedUsers">
                    <SelectValue placeholder="Select users to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => !formData.assignedUserIds.includes(user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({user.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.assignedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.assignedUserIds.map((userId) => {
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
                              setFormData({
                                ...formData,
                                assignedUserIds: formData.assignedUserIds.filter(
                                  (id) => id !== userId
                                ),
                              })
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


