"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  PaintBrushIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"
import { Input } from "@/components/ui/input"
import { CreateAssessmentModal } from "@/components/CreateAssessmentModal"
import { CreateSelectionModal } from "@/components/CreateSelectionModal"

interface Unit {
  id: string
  number: string
  building: {
    id: string
    name: string
    community: {
      id: string
      name: string
    }
  }
}

interface Assessment {
  id: string
  assessedBy: string | null
  assessedAt: string
  createdAt: string
  _count: {
    rooms: number
  }
}

interface Selection {
  id: string
  name: string
  status: string | null
  createdAt: string
  assessment: {
    id: string
    assessedAt: string
    assessedBy: string | null
  } | null
  _count: {
    designRooms: number
  }
}

interface Inspection {
  id: string
  inspectedBy: string | null
  inspectedAt: string
  status: string | null
  designProject: {
    id: string
    name: string
  }
  inspectionRooms: {
    id: string
    _count: {
      inspectionComponents: number
    }
  }[]
}

export default function UnitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<Unit | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [selectionsLoading, setSelectionsLoading] = useState(false)
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  const [assessmentSearchQuery, setAssessmentSearchQuery] = useState("")
  const [selectionSearchQuery, setSelectionSearchQuery] = useState("")
  const [inspectionSearchQuery, setInspectionSearchQuery] = useState("")
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [selectionModalOpen, setSelectionModalOpen] = useState(false)

  useEffect(() => {
    fetchUnit()
  }, [unitId])

  const fetchUnit = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setUnit(data)
        // Fetch related data after unit is loaded
        fetchAssessments()
        fetchSelections()
        fetchInspections()
      }
    } catch (error) {
      console.error("Error fetching unit:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessments = async () => {
    setAssessmentsLoading(true)
    try {
      const response = await fetch(`/api/assessments?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data)
      }
    } catch (error) {
      console.error("Error fetching assessments:", error)
    } finally {
      setAssessmentsLoading(false)
    }
  }

  const fetchSelections = async () => {
    setSelectionsLoading(true)
    try {
      const response = await fetch(`/api/selections?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setSelections(data)
      }
    } catch (error) {
      console.error("Error fetching selections:", error)
    } finally {
      setSelectionsLoading(false)
    }
  }

  const fetchInspections = async () => {
    setInspectionsLoading(true)
    try {
      const response = await fetch(`/api/inspections?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setInspections(data)
      }
    } catch (error) {
      console.error("Error fetching inspections:", error)
    } finally {
      setInspectionsLoading(false)
    }
  }

  const handleAssessmentCreated = (assessmentId: string) => {
    setAssessmentModalOpen(false)
    fetchAssessments()
    router.push(`/dashboard/assessments/${assessmentId}`)
    router.refresh()
  }

  const handleSelectionCreated = (selectionId: string) => {
    setSelectionModalOpen(false)
    fetchSelections()
    router.push(`/dashboard/selections/${selectionId}`)
    router.refresh()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          Draft
        </span>
      )
    }
    if (status === "complete") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Complete
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        {status}
      </span>
    )
  }

  // Filter assessments
  const filteredAssessments = assessments.filter((assessment) => {
    if (!assessmentSearchQuery.trim()) return true
    const query = assessmentSearchQuery.toLowerCase()
    return (
      (assessment.assessedBy && assessment.assessedBy.toLowerCase().includes(query)) ||
      formatDate(assessment.assessedAt).toLowerCase().includes(query)
    )
  })

  // Filter selections
  const filteredSelections = selections.filter((selection) => {
    if (!selectionSearchQuery.trim()) return true
    const query = selectionSearchQuery.toLowerCase()
    return (
      selection.name.toLowerCase().includes(query) ||
      (selection.status && selection.status.toLowerCase().includes(query))
    )
  })

  // Filter inspections
  const filteredInspections = inspections.filter((inspection) => {
    if (!inspectionSearchQuery.trim()) return true
    const query = inspectionSearchQuery.toLowerCase()
    return (
      inspection.designProject.name.toLowerCase().includes(query) ||
      (inspection.inspectedBy && inspection.inspectedBy.toLowerCase().includes(query)) ||
      formatDate(inspection.inspectedAt).toLowerCase().includes(query)
    )
  })

  if (loading) {
    return <div className="text-center py-8">Loading unit...</div>
  }

  if (!unit) {
    return <div>Unit not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/buildings/${unit.building.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to {unit.building.name}
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Unit {unit.number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unit.building.community.name} • {unit.building.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAssessmentModalOpen(true)}
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectionModalOpen(true)}
          >
            <PaintBrushIcon className="h-4 w-4 mr-2" />
            New Selection
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">
            Assessments ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="selections">
            Selections ({selections.length})
          </TabsTrigger>
          <TabsTrigger value="inspections">
            Inspections ({inspections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assessments</CardTitle>
                <div className="relative w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search assessments..."
                    value={assessmentSearchQuery}
                    onChange={(e) => setAssessmentSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="text-center py-8">Loading assessments...</div>
              ) : filteredAssessments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {assessments.length === 0
                      ? "No assessments for this unit yet."
                      : "No assessments match your search query."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessed By</TableHead>
                        <TableHead>Assessment Date</TableHead>
                        <TableHead>Rooms</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.map((assessment) => (
                        <TableRow
                          key={assessment.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            router.push(`/dashboard/assessments/${assessment.id}`)
                          }
                        >
                          <TableCell>
                            {assessment.assessedBy || "—"}
                          </TableCell>
                          <TableCell>
                            {formatDate(assessment.assessedAt)}
                          </TableCell>
                          <TableCell>{assessment._count.rooms}</TableCell>
                          <TableCell className="text-gray-500">
                            {formatDate(assessment.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Selections</CardTitle>
                <div className="relative w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search selections..."
                    value={selectionSearchQuery}
                    onChange={(e) => setSelectionSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectionsLoading ? (
                <div className="text-center py-8">Loading selections...</div>
              ) : filteredSelections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {selections.length === 0
                      ? "No selections for this unit yet."
                      : "No selections match your search query."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Based On Assessment</TableHead>
                        <TableHead>Rooms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSelections.map((selection) => (
                        <TableRow
                          key={selection.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() =>
                            router.push(`/dashboard/selections/${selection.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {selection.name}
                          </TableCell>
                          <TableCell>
                            {selection.assessment ? (
                              <span className="text-sm text-gray-600">
                                {formatDate(selection.assessment.assessedAt)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>{selection._count.designRooms}</TableCell>
                          <TableCell>
                            {getStatusBadge(selection.status)}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {formatDate(selection.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inspections</CardTitle>
                <div className="relative w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search inspections..."
                    value={inspectionSearchQuery}
                    onChange={(e) => setInspectionSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inspectionsLoading ? (
                <div className="text-center py-8">Loading inspections...</div>
              ) : filteredInspections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {inspections.length === 0
                      ? "No inspections for this unit yet."
                      : "No inspections match your search query."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Selection</TableHead>
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
                          onClick={() =>
                            router.push(`/dashboard/inspections/${inspection.id}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {inspection.designProject.name}
                          </TableCell>
                          <TableCell>
                            {inspection.inspectionRooms.length} Rooms
                          </TableCell>
                          <TableCell>
                            {inspection.inspectedBy || "—"}
                          </TableCell>
                          <TableCell>
                            {formatDate(inspection.inspectedAt)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(inspection.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateAssessmentModal
        open={assessmentModalOpen}
        onClose={() => setAssessmentModalOpen(false)}
        onSuccess={handleAssessmentCreated}
        initialUnitId={unitId}
      />

      <CreateSelectionModal
        open={selectionModalOpen}
        onOpenChange={setSelectionModalOpen}
        onSelectionCreated={handleSelectionCreated}
      />
    </div>
  )
}

