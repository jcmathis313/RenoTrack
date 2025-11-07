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
import { CreateSelectionModal } from "@/components/CreateSelectionModal"
import { PlusIcon } from "@heroicons/react/24/outline"

interface Selection {
  id: string
  name: string
  status: string | null
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
  assessment: {
    id: string
    assessedAt: string
    assessedBy: string | null
  } | null
  _count: {
    designRooms: number
  }
}

export default function SelectionsPage() {
  const router = useRouter()
  const [selections, setSelections] = useState<Selection[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchSelections()
  }, [])

  const fetchSelections = async () => {
    try {
      const response = await fetch("/api/selections")
      if (response.ok) {
        const data = await response.json()
        setSelections(data)
      }
    } catch (error) {
      console.error("Error fetching selections:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectionCreated = (selectionId: string) => {
    setModalOpen(false)
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

  if (loading) {
    return (
      <div className="text-center py-8">Loading selections...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage selection meetings and material choices
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Selections
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selection Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {selections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No selection meetings yet. Create your first one!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Based On Assessment</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selections.map((selection) => (
                    <TableRow 
                      key={selection.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/dashboard/selections/${selection.id}`)}
                    >
                      <TableCell className="font-medium">
                        {selection.name}
                      </TableCell>
                      <TableCell>Unit {selection.unit.number}</TableCell>
                      <TableCell>
                        {selection.unit.building.community.name}
                      </TableCell>
                      <TableCell>{selection.unit.building.name}</TableCell>
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
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {selection.status || "Draft"}
                        </span>
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

      <CreateSelectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelectionCreated={handleSelectionCreated}
      />
    </div>
  )
}
