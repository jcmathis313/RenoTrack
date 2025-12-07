"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"

interface Selection {
  id: string
  name: string
  status: string | null
  createdAt: string
  unit: {
    number: string
    building: {
      name: string
      community: {
        name: string
      }
    }
  }
}

interface Inspection {
  id: string
  status: string | null
  inspectedAt: string
  createdAt: string
  designProject: {
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
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [selections, setSelections] = useState<Selection[]>([])
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all selections and filter for active ones (Pending Approval / Draft)
      const selectionsRes = await fetch("/api/selections")
      if (selectionsRes.ok) {
        const selectionsData = await selectionsRes.json()
        setSelections(
          selectionsData.filter(
            (s: Selection) =>
              s.status?.toLowerCase() === "pending approval" ||
              s.status?.toLowerCase() === "draft" ||
              s.status === null
          )
        )
      }

      // Fetch all inspections and filter for active ones (In Progress / Draft)
      const inspectionsRes = await fetch("/api/inspections")
      if (inspectionsRes.ok) {
        const inspectionsData = await inspectionsRes.json()
        setInspections(
          inspectionsData.filter(
            (i: Inspection) =>
              i.status?.toLowerCase() === "in progress" ||
              i.status?.toLowerCase() === "draft" ||
              i.status === null
          )
        )
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of active assessments, selections, and inspections.
        </p>
      </div>

      <div className="space-y-6">
        {/* Active Assessments - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Active Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              Placeholder - Coming soon
            </div>
          </CardContent>
        </Card>

        {/* Active Selections */}
        <Card>
          <CardHeader>
            <CardTitle>Active Selections</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Pending Approval / Draft</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
            ) : selections.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No active selections
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Selection</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selections.map((selection) => (
                      <TableRow 
                        key={selection.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/selections/${selection.id}`)}
                      >
                        <TableCell className="text-xs">
                          {selection.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              selection.status?.toLowerCase() === "pending approval"
                                ? "bg-yellow-100 text-yellow-800"
                                : selection.status?.toLowerCase() === "draft" || !selection.status
                                ? "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {selection.status || "Draft"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {selection.unit.number}
                          <span className="text-gray-400 ml-1">
                            ({selection.unit.building.community.name})
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Inspections */}
        <Card>
          <CardHeader>
            <CardTitle>Active Inspections</CardTitle>
            <p className="text-xs text-gray-500 mt-1">In Progress / Draft</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
            ) : inspections.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No active inspections
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Inspection</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection) => (
                      <TableRow 
                        key={inspection.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/inspections/${inspection.id}`)}
                      >
                        <TableCell className="text-xs">
                          {inspection.designProject.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              inspection.status?.toLowerCase() === "in progress"
                                ? "bg-blue-100 text-blue-800"
                                : inspection.status?.toLowerCase() === "draft" || !inspection.status
                                ? "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {inspection.status || "Draft"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {inspection.designProject.unit.number}
                          <span className="text-gray-400 ml-1">
                            ({inspection.designProject.unit.building.community.name})
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
