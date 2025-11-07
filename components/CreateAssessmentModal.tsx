"use client"

import { useState, useEffect } from "react"
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

interface CreateAssessmentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (assessmentId: string) => void
  initialUnitId?: string
}

export function CreateAssessmentModal({
  open,
  onClose,
  onSuccess,
  initialUnitId,
}: CreateAssessmentModalProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    unitId: initialUnitId || "",
    assessedBy: undefined as string | undefined,
    assessedAt: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (open) {
      fetchData()
      if (initialUnitId) {
        setFormData((prev) => ({ ...prev, unitId: initialUnitId }))
      }
    }
  }, [open, initialUnitId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [unitsResponse, usersResponse] = await Promise.all([
        fetch("/api/units"),
        fetch("/api/users"),
      ])

      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json()
        setUnits(unitsData)
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unitId: formData.unitId,
          assessedBy: formData.assessedBy || null,
          assessedAt: formData.assessedAt || new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create assessment")
      }

      const assessment = await response.json()
      onSuccess(assessment.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const getUnitDisplayName = (unit: Unit) => {
    return `${unit.building.community.name} - ${unit.building.name} - Unit ${unit.number}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Assessment</DialogTitle>
          <DialogDescription>
            Create a new assessment for a unit. You'll be able to add rooms and components after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit *</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) =>
                  setFormData({ ...formData, unitId: value })
                }
                disabled={loading}
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
              <Label htmlFor="assessedBy">Assessed By (Optional)</Label>
              <Select
                value={formData.assessedBy || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, assessedBy: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="assessedBy">
                  <SelectValue placeholder="Select a user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.assessedBy && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setFormData({ ...formData, assessedBy: undefined })}
                >
                  Clear selection
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessedAt">Assessment Date *</Label>
              <Input
                id="assessedAt"
                type="date"
                value={formData.assessedAt}
                onChange={(e) =>
                  setFormData({ ...formData, assessedAt: e.target.value })
                }
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.unitId}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
