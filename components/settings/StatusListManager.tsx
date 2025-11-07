"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Status {
  id: string
  name: string
  color?: string
  order: number
  isDefault: boolean
}

interface StatusListManagerProps {
  title: string
  description: string
  apiEndpoint: string
  defaultItems: string[]
  showColorPicker?: boolean
}

const COLOR_OPTIONS = [
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "gray", label: "Gray" },
  { value: "yellow", label: "Yellow" },
  { value: "purple", label: "Purple" },
] as const

export function StatusListManager({
  title,
  description,
  apiEndpoint,
  defaultItems,
  showColorPicker = false,
}: StatusListManagerProps) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null)
  const [newStatusName, setNewStatusName] = useState("")
  const [newStatusColor, setNewStatusColor] = useState("gray")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingColor, setEditingColor] = useState("gray")

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const response = await fetch(apiEndpoint)
      if (response.ok) {
        const data = await response.json()
        console.log(`Fetched ${title}:`, data)
        if (data.length > 0 && showColorPicker) {
          console.log(`First status color check:`, {
            name: data[0].name,
            color: data[0].color,
            hasColor: 'color' in data[0],
          })
        }
        setStatuses(data)
      } else {
        console.error(`Error fetching ${title}:`, response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error(`Error details:`, errorData)
      }
    } catch (error) {
      console.error(`Error fetching ${title}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusName.trim()) return

    setAdding(true)
    setError("")

    try {
      const body: any = {
        name: newStatusName.trim(),
        order: statuses.length,
      }
      if (showColorPicker) {
        body.color = newStatusColor
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        let errorMessage = "Failed to add status"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      setNewStatusName("")
      setNewStatusColor("gray")
      fetchStatuses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setAdding(false)
    }
  }

  const handleEditStart = (status: Status) => {
    setEditingId(status.id)
    setEditingName(status.name)
    setEditingColor(status.color || "gray")
    setError("")
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingName("")
    setEditingColor("gray")
    setError("")
  }

  const handleEditSave = async (statusId: string) => {
    if (!editingName.trim()) return

    setError("")

    try {
      const body: any = {
        name: editingName.trim(),
      }
      if (showColorPicker) {
        body.color = editingColor
      }

      const response = await fetch(`${apiEndpoint}/${statusId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      setEditingId(null)
      setEditingName("")
      fetchStatuses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!selectedStatus) return

    try {
      const response = await fetch(`${apiEndpoint}/${selectedStatus.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete status")
      }

      setDeleteOpen(false)
      setSelectedStatus(null)
      fetchStatuses()
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading {title.toLowerCase()}...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statuses.length === 0 && !loading ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No statuses found. Add one below.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {showColorPicker && <TableHead>Color</TableHead>}
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">
                          {editingId === status.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full max-w-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditSave(status.id)
                                } else if (e.key === "Escape") {
                                  handleEditCancel()
                                }
                              }}
                            />
                          ) : (
                            status.name
                          )}
                        </TableCell>
                        {showColorPicker && (
                          <TableCell>
                            {editingId === status.id ? (
                              <Select
                                value={editingColor}
                                onValueChange={setEditingColor}
                              >
                                <SelectTrigger className="w-full max-w-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COLOR_OPTIONS.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={cn(
                                            "w-4 h-4 rounded-full border border-gray-300",
                                            color.value === "green" && "bg-green-500",
                                            color.value === "orange" && "bg-orange-500",
                                            color.value === "blue" && "bg-blue-500",
                                            color.value === "red" && "bg-red-500",
                                            color.value === "gray" && "bg-gray-500",
                                            color.value === "yellow" && "bg-yellow-500",
                                            color.value === "purple" && "bg-purple-500"
                                          )}
                                        />
                                        <span>{color.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border border-gray-300",
                                    status.color === "green" && "bg-green-500",
                                    status.color === "orange" && "bg-orange-500",
                                    status.color === "blue" && "bg-blue-500",
                                    status.color === "red" && "bg-red-500",
                                    status.color === "gray" && "bg-gray-500",
                                    status.color === "yellow" && "bg-yellow-500",
                                    status.color === "purple" && "bg-purple-500"
                                  )}
                                />
                                <span className="text-xs text-gray-600 capitalize">
                                  {COLOR_OPTIONS.find((c) => c.value === status.color)?.label || status.color || "Gray"}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          {status.isDefault ? (
                            <span className="text-xs text-gray-500">Default</span>
                          ) : (
                            <span className="text-xs text-gray-400">Custom</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingId === status.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSave(status.id)}
                                >
                                  <CheckIcon className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleEditCancel}
                                >
                                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStart(status)}
                                  disabled={status.isDefault}
                                >
                                  <PencilIcon
                                    className={cn(
                                      "h-4 w-4",
                                      status.isDefault ? "text-gray-300" : ""
                                    )}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStatus(status)
                                    setDeleteOpen(true)
                                  }}
                                  disabled={status.isDefault}
                                >
                                  <TrashIcon
                                    className={cn(
                                      "h-4 w-4",
                                      status.isDefault ? "text-gray-300" : "text-destructive"
                                    )}
                                  />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Inline Add Form - Always visible */}
            <form onSubmit={handleAdd} className={cn(
              "space-y-3",
              statuses.length > 0 && "pt-2 border-t"
            )}>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={newStatusName}
                  onChange={(e) => {
                    setNewStatusName(e.target.value)
                    setError("")
                  }}
                  placeholder={`Add new ${title.slice(0, -1).toLowerCase()}`}
                  className="flex-1 max-w-xs"
                />
                {showColorPicker && (
                  <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border border-gray-300",
                                color.value === "green" && "bg-green-500",
                                color.value === "orange" && "bg-orange-500",
                                color.value === "blue" && "bg-blue-500",
                                color.value === "red" && "bg-red-500",
                                color.value === "gray" && "bg-gray-500",
                                color.value === "yellow" && "bg-yellow-500",
                                color.value === "purple" && "bg-purple-500"
                              )}
                            />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button type="submit" disabled={adding || !newStatusName.trim()}>
                  {adding ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedStatus?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
