"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderIcon } from "@heroicons/react/24/outline"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Project {
  id: string
  name: string
  unitId: string
}

interface ProjectAssociationHeaderProps {
  entityType: "assessment" | "selection" | "inspection"
  entityId: string
  unitId: string
  currentProjectId?: string | null
  onProjectChange?: (projectId: string | null) => void
}

export function ProjectAssociationHeader({
  entityType,
  entityId,
  unitId,
  currentProjectId,
  onProjectChange,
}: ProjectAssociationHeaderProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId || ""
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [unitId])

  useEffect(() => {
    setSelectedProjectId(currentProjectId || "")
  }, [currentProjectId])

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const handleSave = async () => {
    setError("")
    setSaving(true)

    try {
      // Determine the API endpoint based on entity type
      const endpointMap = {
        assessment: `/api/assessments/${entityId}`,
        selection: `/api/selections/${entityId}`,
        inspection: `/api/inspections/${entityId}`,
      }

      const response = await fetch(endpointMap[entityType], {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update project association")
      }

      if (onProjectChange) {
        onProjectChange(selectedProjectId || null)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  if (projects.length === 0 && !currentProjectId) {
    return null // Don't show if no projects available and not currently associated
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <FolderIcon className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">Project:</span>
      <Select
        value={selectedProjectId || undefined}
        onValueChange={(value) => setSelectedProjectId(value)}
        disabled={saving}
      >
        <SelectTrigger className="w-[200px] h-8">
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
      {selectedProjectId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedProjectId("")}
          disabled={saving}
          title="Clear project"
        >
          Clear
        </Button>
      )}
      {selectedProjectId !== (currentProjectId || "") && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedProjectId(currentProjectId || "")
              setError("")
            }}
            disabled={saving}
          >
            Cancel
          </Button>
        </>
      )}
      {selectedProject && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/dashboard/projects/${selectedProject.id}`)}
        >
          View Project
        </Button>
      )}
      {error && (
        <span className="text-xs text-red-600 ml-2">{error}</span>
      )}
    </div>
  )
}
