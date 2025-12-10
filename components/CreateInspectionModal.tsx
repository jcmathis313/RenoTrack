"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface Selection {
  id: string
  name: string
  unitId?: string
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
}

interface Project {
  id: string
  name: string
  unitId: string
}

interface CreateInspectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInspectionModal({
  open,
  onOpenChange,
}: CreateInspectionModalProps) {
  const router = useRouter()
  const [selections, setSelections] = useState<Selection[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    designProjectId: "",
    projectId: "",
  })

  useEffect(() => {
    if (open) {
      fetchCompleteSelections()
      setFormData({
        designProjectId: "",
        projectId: "",
      })
      setSearchTerm("")
      setError("")
    }
  }, [open])

  const fetchCompleteSelections = async () => {
    setLoading(true)
    try {
      const [selectionsResponse, projectsResponse] = await Promise.all([
        fetch("/api/selections"),
        fetch("/api/projects"),
      ])

      if (selectionsResponse.ok) {
        const data = await selectionsResponse.json()
        // Filter only complete selections
        const completeSelections = data.filter(
          (s: any) => s.status === "complete"
        )
        setSelections(completeSelections)
      }

      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Get projects for the selected selection's unit
  const selectedSelection = selections.find((s) => s.id === formData.designProjectId)
  const availableProjects = selectedSelection
    ? projects.filter((p) => p.unitId === selectedSelection.unit.id)
    : []

  const filteredSelections = selections.filter((selection) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      selection.name.toLowerCase().includes(searchLower) ||
      selection.unit.building.community.name.toLowerCase().includes(searchLower) ||
      selection.unit.building.name.toLowerCase().includes(searchLower) ||
      selection.unit.number.toLowerCase().includes(searchLower)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          designProjectId: formData.designProjectId,
          projectId: formData.projectId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create inspection")
      }

      const inspection = await response.json()
      onOpenChange(false)
      router.push(`/dashboard/inspections/${inspection.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Inspection</DialogTitle>
            <DialogDescription>
              Select a completed selection to create an inspection. Only selections with status &quot;complete&quot; are available.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="selection">Select Complete Selection *</Label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by selection name, community, building, or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {loading ? (
                <div className="text-sm text-gray-500 py-4">Loading selections...</div>
              ) : filteredSelections.length === 0 ? (
                <div className="text-sm text-gray-500 py-4">
                  {searchTerm
                    ? "No matching complete selections found."
                    : "No complete selections available."}
                </div>
              ) : (
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  {filteredSelections.map((selection) => (
                    <button
                      key={selection.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          designProjectId: selection.id,
                          projectId: "", // Reset project when selection changes
                        })
                      }
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${
                        formData.designProjectId === selection.id
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                    >
                      <div className="font-medium">{selection.name}</div>
                      <div className="text-sm text-gray-500">
                        {selection.unit.building.community.name} →{" "}
                        {selection.unit.building.name} → Unit{" "}
                        {selection.unit.number}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.designProjectId && (
              <div className="grid gap-2">
                <Label htmlFor="projectId">Project (Optional)</Label>
                <Select
                  value={formData.projectId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Select a project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableProjects.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No projects available for this unit
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.designProjectId}>
              {saving ? "Creating..." : "Create Inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

