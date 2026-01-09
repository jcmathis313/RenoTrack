"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { CreateAssessmentModal } from "@/components/CreateAssessmentModal"
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Input } from "@/components/ui/input"

interface Assessment {
  id: string
  assessedBy: string | null
  assessedAt: string
  createdAt: string
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
  _count: {
    rooms: number
  }
}

function AssessmentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchAssessments()
    // Check if unitId is in query params, open modal if so
    const unitId = searchParams?.get("unitId")
    if (unitId) {
      setModalOpen(true)
    }
  }, [searchParams])

  const fetchAssessments = async () => {
    try {
      const response = await fetch("/api/assessments")
      if (response.ok) {
        const data = await response.json()
        setAssessments(data)
      }
    } catch (error) {
      console.error("Error fetching assessments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssessmentCreated = (assessmentId: string) => {
    setModalOpen(false)
    router.push(`/dashboard/assessments/${assessmentId}`)
    router.refresh()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Filter assessments based on search query
  const filteredAssessments = assessments.filter((assessment) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    return (
      assessment.unit.number.toLowerCase().includes(query) ||
      assessment.unit.building.community.name.toLowerCase().includes(query) ||
      assessment.unit.building.name.toLowerCase().includes(query) ||
      (assessment.assessedBy && assessment.assessedBy.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assessments</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage and track unit assessments
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Assessments</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No assessments found. Create your first assessment to get started.
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No assessments match your search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Building</TableHead>
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
                      onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)}
                    >
                      <TableCell>
                        Unit {assessment.unit.number}
                      </TableCell>
                      <TableCell>{assessment.unit.building.community.name}</TableCell>
                      <TableCell>{assessment.unit.building.name}</TableCell>
                      <TableCell>
                        {assessment.assessedBy || (
                          <span className="text-gray-400">—</span>
                        )}
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

      <CreateAssessmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          // Clear unitId from URL when closing
          if (searchParams?.get("unitId")) {
            router.push("/dashboard/assessments")
          }
        }}
        onSuccess={handleAssessmentCreated}
        initialUnitId={searchParams?.get("unitId") || undefined}
      />
    </div>
  )
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track unit assessments
            </p>
          </div>
        </div>
        <Card>
          <CardContent>
            <div className="text-center py-8">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <AssessmentsContent />
    </Suspense>
  )
}
