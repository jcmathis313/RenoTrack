"use client"

import React, { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

interface Selection {
  id: string
  name: string
  unit: {
    number: string
    building: {
      name: string
      community: {
        name: string
      }
    }
  }
  designRooms: {
    id: string
    name: string
    designComponents: {
      id: string
    }[]
  }[]
}

interface Assessment {
  id: string
  assessedAt: string
  unit: {
    number: string
    building: {
      name: string
      community: {
        name: string
      }
    }
  }
  rooms: {
    id: string
    name: string
    componentAssessments: {
      id: string
    }[]
  }[]
}

interface CopyRoomsToTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  onSuccess: () => void
}

export function CopyRoomsToTemplateModal({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: CopyRoomsToTemplateModalProps) {
  const [sourceType, setSourceType] = useState<"selection" | "assessment">("selection")
  const [selections, setSelections] = useState<Selection[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>("")
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [rename, setRename] = useState(true)

  useEffect(() => {
    if (open) {
      fetchSources()
      setSelectedSourceId("")
      setSelectedRoomIds(new Set())
      setSearchTerm("")
      setError("")
    }
  }, [open, sourceType])

  const fetchSources = async () => {
    setLoading(true)
    try {
      if (sourceType === "selection") {
        const response = await fetch("/api/selections")
        if (response.ok) {
          const data = await response.json()
          setSelections(data)
        }
      } else {
        const response = await fetch("/api/assessments")
        if (response.ok) {
          const data = await response.json()
          setAssessments(data)
        }
      }
    } catch (error) {
      console.error("Error fetching sources:", error)
      setError("Failed to load sources")
    } finally {
      setLoading(false)
    }
  }

  const selectedSource = sourceType === "selection"
    ? selections.find((s) => s.id === selectedSourceId)
    : assessments.find((a) => a.id === selectedSourceId)

  const availableRooms = selectedSource
    ? sourceType === "selection"
      ? (selectedSource as Selection).designRooms
      : (selectedSource as Assessment).rooms
    : []

  const filteredSources = sourceType === "selection" ? selections : assessments

  const filteredSourcesWithSearch = searchTerm
    ? filteredSources.filter((source) => {
        const searchLower = searchTerm.toLowerCase()
        if (sourceType === "selection") {
          const s = source as Selection
          return (
            s.name.toLowerCase().includes(searchLower) ||
            s.unit.number.toLowerCase().includes(searchLower) ||
            s.unit.building.name.toLowerCase().includes(searchLower) ||
            s.unit.building.community.name.toLowerCase().includes(searchLower)
          )
        } else {
          const a = source as Assessment
          return (
            `Unit ${a.unit.number}`.toLowerCase().includes(searchLower) ||
            a.unit.building.name.toLowerCase().includes(searchLower) ||
            a.unit.building.community.name.toLowerCase().includes(searchLower)
          )
        }
      })
    : filteredSources

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId)
    setSelectedRoomIds(new Set())
  }

  const handleRoomToggle = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

  const handleSelectAllRooms = () => {
    if (!selectedSource) return
    if (selectedRoomIds.size === availableRooms.length) {
      setSelectedRoomIds(new Set())
    } else {
      setSelectedRoomIds(new Set(availableRooms.map((r) => r.id)))
    }
  }

  const handleCopy = async () => {
    if (!selectedSourceId || selectedRoomIds.size === 0) {
      setError("Please select a source and at least one room")
      return
    }

    setCopying(true)
    setError("")

    try {
      const response = await fetch(`/api/settings/templates/${templateId}/copy-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId: selectedSourceId,
          roomIds: Array.from(selectedRoomIds),
          rename,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to copy rooms")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setCopying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copy Rooms to Template</DialogTitle>
          <DialogDescription>
            Select a selection or assessment and choose which rooms to copy into this template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Source Type</Label>
            <RadioGroup value={sourceType} onValueChange={(value) => setSourceType(value as typeof sourceType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selection" id="selection" />
                <Label htmlFor="selection" className="cursor-pointer">Selection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assessment" id="assessment" />
                <Label htmlFor="assessment" className="cursor-pointer">Assessment</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Select {sourceType === "selection" ? "Selection" : "Assessment"} *</Label>
            <Select value={selectedSourceId} onValueChange={handleSourceSelect}>
              <SelectTrigger id="source">
                <SelectValue placeholder={`Select a ${sourceType}`} />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 bg-white p-2 border-b">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${sourceType}s...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-2 h-9 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {loading ? (
                  <div className="p-2 text-sm text-gray-500">Loading...</div>
                ) : filteredSourcesWithSearch.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    {searchTerm ? `No ${sourceType}s match your search` : `No ${sourceType}s available`}
                  </div>
                ) : (
                  filteredSourcesWithSearch.map((source) => {
                    if (sourceType === "selection") {
                      const s = source as Selection
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-gray-500">
                              {s.unit.building.community.name} - {s.unit.building.name} - Unit {s.unit.number}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    } else {
                      const a = source as Assessment
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">Assessment for Unit {a.unit.number}</span>
                            <span className="text-xs text-gray-500">
                              {a.unit.building.community.name} - {a.unit.building.name}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    }
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedSource && availableRooms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Rooms to Copy *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllRooms}
                >
                  {selectedRoomIds.size === availableRooms.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {availableRooms.map((room) => {
                  let componentCount = 0
                  if (sourceType === "selection") {
                    const designRoom = room as Selection["designRooms"][0]
                    componentCount = designRoom.designComponents?.length || 0
                  } else {
                    const assessmentRoom = room as Assessment["rooms"][0]
                    componentCount = assessmentRoom.componentAssessments?.length || 0
                  }
                  
                  return (
                    <div
                      key={room.id}
                      className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={room.id}
                        checked={selectedRoomIds.has(room.id)}
                        onCheckedChange={() => handleRoomToggle(room.id)}
                      />
                      <label
                        htmlFor={room.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{room.name}</div>
                        <div className="text-xs text-gray-500">
                          {componentCount} component{componentCount !== 1 ? "s" : ""}
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rename"
                checked={rename}
                onCheckedChange={(checked) => setRename(checked === true)}
              />
              <Label htmlFor="rename" className="cursor-pointer text-sm">
                Add "(Copy)" suffix to room names
              </Label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={copying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={copying || !selectedSourceId || selectedRoomIds.size === 0}
          >
            {copying ? "Copying..." : "Copy Rooms"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

