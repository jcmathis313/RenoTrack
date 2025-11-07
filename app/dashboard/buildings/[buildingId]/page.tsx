"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { UnitForm } from "@/components/UnitForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import Link from "next/link"
import {
  ArrowLeftIcon,
  HomeIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  PaintBrushIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"

interface Unit {
  id: string
  number: string
  _count: {
    assessments: number
    designProjects: number
  }
}

interface Building {
  id: string
  name: string
  address: string | null
  community: {
    id: string
    name: string
  }
}

export default function UnitsPage() {
  const router = useRouter()
  const params = useParams()
  const buildingId = params.buildingId as string

  const [building, setBuilding] = useState<Building | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      // Fetch units
      const unitsResponse = await fetch(`/api/units?buildingId=${buildingId}`)
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json()
        setUnits(unitsData)
      }

      // Fetch building info by getting all communities and their buildings
      const commResponse = await fetch("/api/communities")
      if (commResponse.ok) {
        const communities = await commResponse.json()
        for (const community of communities) {
          const buildingsResponse = await fetch(`/api/buildings?communityId=${community.id}`)
          if (buildingsResponse.ok) {
            const buildings = await buildingsResponse.json()
            const foundBuilding = buildings.find((b: Building) => b.id === buildingId)
            if (foundBuilding) {
              setBuilding({ ...foundBuilding, community })
              break
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [buildingId])

  const handleDelete = async () => {
    if (!selectedUnit) return

    try {
      const response = await fetch(`/api/units/${selectedUnit.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.refresh()
        fetchData()
        setDeleteOpen(false)
        setSelectedUnit(null)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete unit")
      }
    } catch (error) {
      console.error("Error deleting unit:", error)
      alert("An error occurred while deleting the unit")
    }
  }

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit)
    setFormOpen(true)
  }

  const handleNew = () => {
    setSelectedUnit(null)
    setFormOpen(true)
  }

  // Filter units based on search query
  const filteredUnits = units.filter((unit) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const number = unit.number.toLowerCase()

    return number.includes(query)
  })

  if (loading) {
    return <div>Loading...</div>
  }

  if (!building) {
    return <div>Building not found</div>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/communities/${building.community.id}`}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to {building.community.name}
                </Link>
              </Button>
            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                  {building.name} - Units
                </h1>
            <p className="mt-1 text-sm text-gray-500">
              {building.community.name} • {building.address || "No address"}
            </p>
          </div>
          <Button onClick={handleNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Unit
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search units by unit number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="text-center py-12">
                <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No units
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new unit.
                </p>
                <div className="mt-6">
                  <Button onClick={handleNew}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Unit
                  </Button>
                </div>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No units found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Assessments</TableHead>
                      <TableHead>Design Projects</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          Unit {unit.number}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {unit._count.assessments}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            {unit._count.designProjects}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(unit)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUnit(unit)
                                setDeleteOpen(true)
                              }}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/assessments/new?unitId=${unit.id}`}>
                                <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                                Assess
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/designs/new?unitId=${unit.id}`}>
                                <PaintBrushIcon className="h-4 w-4 mr-1" />
                                Design
                              </Link>
                            </Button>
                          </div>
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

      <UnitForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setSelectedUnit(null)
          }
        }}
        buildingId={buildingId}
        unit={selectedUnit || undefined}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete Unit"
        description="Are you sure you want to delete"
        itemName={selectedUnit ? `Unit ${selectedUnit.number}` : undefined}
      />
    </>
  )
}
