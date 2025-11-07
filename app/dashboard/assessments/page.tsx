"use client"

import { useState, useEffect } from "react"
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
import { PlusIcon } from "@heroicons/react/24/outline"

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

export default function AssessmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="mt-1 text-sm text-gray-500">
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
          <CardTitle>All Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No assessments found. Create your first assessment to get started.
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
                  {assessments.map((assessment) => (
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
