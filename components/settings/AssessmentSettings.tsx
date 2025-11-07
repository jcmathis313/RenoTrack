"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { StatusListManager } from "./StatusListManager"

export function AssessmentSettings() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusListManager
          title="Condition"
          description="Manage condition options used in assessments"
          apiEndpoint="/api/settings/component-status"
          defaultItems={[]}
          showColorPicker={true}
        />
        
        <StatusListManager
          title="Quality Status"
          description="Manage quality status options used in assessments"
          apiEndpoint="/api/settings/quality-status"
          defaultItems={[]}
        />
      </div>
    </div>
  )
}
