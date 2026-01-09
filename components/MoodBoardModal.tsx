"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface CatalogItem {
  id: string
  description: string | null
  modelNumber: string | null
  manufacturer: string | null
  finish: string | null
  color: string | null
  imageUrl: string | null
  category: {
    id: string
    name: string
  }
  component: {
    id: string
    name: string
  }
}

interface RoomWithItems {
  id: string
  name: string
  type: string | null
  catalogItems: CatalogItem[]
}

interface MoodBoardData {
  selection: {
    id: string
    name: string
  }
  rooms: RoomWithItems[]
}

interface MoodBoardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectionId: string
}

export function MoodBoardModal({
  open,
  onOpenChange,
  selectionId,
}: MoodBoardModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MoodBoardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    if (open && selectionId) {
      fetchMoodBoardData()
    } else {
      // Reset data when modal closes
      setData(null)
      setError(null)
    }
  }, [open, selectionId])

  const fetchMoodBoardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/selections/${selectionId}/moodboard`)
      if (!response.ok) {
        throw new Error("Failed to fetch mood board data")
      }
      const moodBoardData = await response.json()
      setData(moodBoardData)
    } catch (err: any) {
      console.error("Error fetching mood board:", err)
      setError(err.message || "Failed to load mood board")
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      const response = await fetch(`/api/export-pdf?type=moodboard&id=${selectionId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || `Failed to generate PDF: ${response.status} ${response.statusText}`)
      }
      
      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/pdf")) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || "Server did not return a PDF")
      }
      
      const blob = await response.blob()
      
      if (blob.type !== "application/pdf") {
        const text = await blob.text()
        try {
          const errorJson = JSON.parse(text)
          throw new Error(errorJson.error || errorJson.details || "Failed to generate PDF")
        } catch {
          throw new Error("Server returned non-PDF response")
        }
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `moodboard-${data?.selection.name || "export"}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      alert(`Failed to export PDF: ${error?.message || "Unknown error"}\n\nCheck the browser console for more details.`)
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] w-screen max-h-[100vh] h-screen m-0 p-0 gap-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !right-0 !bottom-0 rounded-none flex flex-col print:p-6 print:max-w-full print:w-full print:h-auto print:gap-4 [&>button]:hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0 print:border-b-0 print:pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">
                {data?.selection.name || "Mood Board"}
              </DialogTitle>
              <div className="flex items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="h-8"
                >
                  {exportingPDF ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  )}
                  {exportingPDF ? "Generating PDF..." : "Export PDF"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6 min-h-0 print:overflow-visible print:p-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading mood board...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-500">{error}</div>
              </div>
            ) : !data || data.rooms.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <p className="text-gray-500 text-lg">
                    No catalog items with images found for any rooms.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Add components with catalog items that have photos to create a mood board.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {data.rooms.map((room) => (
                  <div key={room.id} className="space-y-4 print:break-inside-avoid">
                    <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 print:mb-4">
                      {room.name}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-4">
                      {room.catalogItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm print:shadow-none print:border-gray-300"
                        >
                          {/* Image - Square frame */}
                          <div className="w-full aspect-square bg-gray-100 print:bg-white overflow-hidden relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={
                                  item.description ||
                                  `${item.category.name} - ${item.component.name}`
                                }
                                className="absolute inset-0 w-full h-full object-cover object-center"
                                onError={(e) => {
                                  // Hide broken images
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            )}
                          </div>

                          {/* Item Details Below Image */}
                          <div className="p-3 space-y-1 print:p-2">
                            {item.description && (
                              <p className="font-medium text-sm text-gray-900 line-clamp-2 print:text-xs">
                                {item.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 print:text-[10px]">
                              {item.category.name} - {item.component.name}
                            </p>
                            {item.manufacturer && (
                              <p className="text-xs text-gray-500 print:text-[10px]">
                                {item.manufacturer}
                                {item.modelNumber && ` - ${item.modelNumber}`}
                              </p>
                            )}
                            {(item.finish || item.color) && (
                              <p className="text-xs text-gray-500 print:text-[10px]">
                                {[item.finish, item.color].filter(Boolean).join(" - ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}
