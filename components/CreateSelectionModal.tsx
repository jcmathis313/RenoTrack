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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

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

interface Assessment {
  id: string
  assessedAt: string
  assessedBy: string | null
  unit: {
    id: string
    number: string
    building: {
      name: string
      community: {
        name: string
      }
    }
  }
}

interface CreateSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectionCreated: (selectionId: string) => void
}

export function CreateSelectionModal({
  open,
  onOpenChange,
  onSelectionCreated,
}: CreateSelectionModalProps) {
  const [createMode, setCreateMode] = useState<"assessment" | "scratch">("assessment")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [assessmentSearch, setAssessmentSearch] = useState("")

  const [formData, setFormData] = useState({
    assessmentId: "",
    unitId: "",
    name: "",
  })

  useEffect(() => {
    if (open) {
      fetchData()
      // Reset form when modal opens
      setFormData({
        assessmentId: "",
        unitId: "",
        name: "",
      })
      setAssessmentSearch("")
      setError("")
      setCreateMode("assessment")
    }
  }, [open])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [assessmentsResponse, unitsResponse] = await Promise.all([
        fetch("/api/assessments"),
        fetch("/api/units"),
      ])

      if (assessmentsResponse.ok) {
        const assessmentsData = await assessmentsResponse.json()
        setAssessments(assessmentsData)
      }

      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json()
        setUnits(unitsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const filteredAssessments = assessments.filter((assessment) => {
    if (!assessmentSearch) return true
    const searchLower = assessmentSearch.toLowerCase()
    return (
      assessment.unit.number.toLowerCase().includes(searchLower) ||
      assessment.unit.building.name.toLowerCase().includes(searchLower) ||
      assessment.unit.building.community.name.toLowerCase().includes(searchLower) ||
      (assessment.assessedBy && assessment.assessedBy.toLowerCase().includes(searchLower)) ||
      new Date(assessment.assessedAt).toLocaleDateString().includes(searchLower)
    )
  })

  const handleSubmit = async () => {
    setError("")
    setSaving(true)

    try {
      let submitData: any = {
        name: formData.name.trim(),
      }

      if (createMode === "assessment") {
        if (!formData.assessmentId) {
          setError("Please select an assessment")
          setSaving(false)
          return
        }

        const selectedAssessment = assessments.find((a) => a.id === formData.assessmentId)
        if (!selectedAssessment) {
          setError("Selected assessment not found")
          setSaving(false)
          return
        }

        submitData.assessmentId = formData.assessmentId
        submitData.unitId = selectedAssessment.unit.id
        
        // Default name if not provided
        if (!submitData.name) {
          submitData.name = `Selections for Unit ${selectedAssessment.unit.number}`
        }
      } else {
        // From scratch
        if (!formData.unitId) {
          setError("Please select a unit")
          setSaving(false)
          return
        }
        if (!submitData.name) {
          setError("Please enter a name for the selection meeting")
          setSaving(false)
          return
        }

        submitData.unitId = formData.unitId
      }

      const response = await fetch("/api/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create selection")
      }

      const data = await response.json()
      onSelectionCreated(data.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const selectedAssessment = assessments.find((a) => a.id === formData.assessmentId)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Selection Meeting</DialogTitle>
          <DialogDescription>
            Create a new selection meeting either from an existing assessment or from scratch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Create Selection From</Label>
            <RadioGroup
              value={createMode}
              onValueChange={(value) => setCreateMode(value as "assessment" | "scratch")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assessment" id="assessment" />
                <Label htmlFor="assessment" className="font-normal cursor-pointer">
                  From Assessment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scratch" id="scratch" />
                <Label htmlFor="scratch" className="font-normal cursor-pointer">
                  From Scratch (Blank Slate)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {createMode === "assessment" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="assessment-search">Search Assessment</Label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="assessment-search"
                    type="text"
                    placeholder="Search by unit, building, community, or assessor..."
                    value={assessmentSearch}
                    onChange={(e) => setAssessmentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment">Select Assessment *</Label>
                <Select
                  value={formData.assessmentId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, assessmentId: value })
                  }}
                >
                  <SelectTrigger id="assessment">
                    <SelectValue placeholder="Select an assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAssessments.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        {assessmentSearch
                          ? "No assessments match your search"
                          : "No assessments available"}
                      </div>
                    ) : (
                      filteredAssessments.map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Unit {assessment.unit.number} - {assessment.unit.building.community.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {assessment.unit.building.name} • {formatDate(assessment.assessedAt)}
                              {assessment.assessedBy && ` • ${assessment.assessedBy}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedAssessment && (
                <div className="p-3 bg-gray-50 rounded-md space-y-1">
                  <div className="text-sm font-medium">Selected Assessment</div>
                  <div className="text-xs text-gray-600">
                    Unit {selectedAssessment.unit.number} • {selectedAssessment.unit.building.name} •{" "}
                    {selectedAssessment.unit.building.community.name}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Selection Meeting Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Optional - defaults to 'Selections for Unit X'"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Unit {unit.number} - {unit.building.community.name}
                          </span>
                          <span className="text-xs text-gray-500">{unit.building.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Selection Meeting Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter selection meeting name"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading}>
            {saving ? "Creating..." : "Create Selection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
