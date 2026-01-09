"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateInspectionModal } from "@/components/CreateInspectionModal"
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface Inspection {
  id: string
  inspectedBy: string | null
  inspectedAt: string
  status: string | null
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
        }
      }
    }
  }
  inspectionRooms: {
    id: string
    status: string | null
    _count: {
      inspectionComponents: number
    }
    inspectionComponents: {
      status: string | null
    }[]
  }[]
}

export default function InspectionsPage() {
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pass" | "fail">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const response = await fetch("/api/inspections")
      if (response.ok) {
        const data = await response.json()
        setInspections(data)
      }
    } catch (error) {
      console.error("Error fetching inspections:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (status === "complete") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Complete
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        In Progress
        </span>
    )
  }

  // Filter inspections based on component status and search query
  const filteredInspections = inspections.filter((inspection) => {
    // First apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        inspection.designProject.unit.number.toLowerCase().includes(query) ||
        inspection.designProject.unit.building.community.name.toLowerCase().includes(query) ||
        inspection.designProject.unit.building.name.toLowerCase().includes(query) ||
        inspection.designProject.name.toLowerCase().includes(query) ||
        (inspection.inspectedBy && inspection.inspectedBy.toLowerCase().includes(query))
      )
      if (!matchesSearch) return false
    }
    
    // Then apply status filter
    if (filter === "all") return true
    
    // Get all component statuses from all rooms
    const allComponents = inspection.inspectionRooms.flatMap(
      (room) => room.inspectionComponents || []
    )
    
    if (filter === "pass") {
      // Show inspections that have at least one pass component
      return allComponents.some((comp: any) => comp.status === "pass")
    }
    
    if (filter === "fail") {
      // Show inspections that have at least one fail component
      return allComponents.some((comp: any) => comp.status === "fail")
    }
    
    return true
  })

  if (loading) {
    return <div className="text-center py-8">Loading inspections...</div>
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inspections</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage quality inspections for completed selections
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Inspections</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by unit, community, building..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={cn(
                      filter === "all" && "bg-gray-900 text-white hover:bg-gray-800"
                    )}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "pass" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("pass")}
                    className={cn(
                      filter === "pass" && "bg-gray-900 text-white hover:bg-gray-800"
                    )}
                  >
                    Pass
                  </Button>
                  <Button
                    variant={filter === "fail" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("fail")}
                    className={cn(
                      filter === "fail" && "bg-gray-900 text-white hover:bg-gray-800"
                    )}
                  >
                    Fail
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInspections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No inspections yet.</p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Inspection
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Selection</TableHead>
                      <TableHead>Community</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead>Inspected By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInspections.map((inspection) => (
                      <TableRow 
                        key={inspection.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/inspections/${inspection.id}`)}
                      >
                        <TableCell className="font-medium">
                          Inspection for Unit {inspection.designProject.unit.number}
                        </TableCell>
                        <TableCell>
                          {inspection.designProject.unit.building.community.name}
                        </TableCell>
                        <TableCell>
                          {inspection.designProject.unit.building.name}
                        </TableCell>
                        <TableCell>
                          Unit {inspection.designProject.unit.number}
                        </TableCell>
                        <TableCell>
                          {inspection.inspectionRooms.length} Rooms
                        </TableCell>
                        <TableCell>
                          {inspection.inspectedBy || "—"}
                        </TableCell>
                        <TableCell>{formatDate(inspection.inspectedAt)}</TableCell>
                        <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateInspectionModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) {
            fetchInspections()
          }
        }}
      />
    </>
  )
}

