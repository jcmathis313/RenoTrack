import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: "blue" | "purple" | "green" | "gray"
}

interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  hasAssessment: boolean
  hasSelection: boolean
  hasInspection: boolean
  assessmentCount?: number
  selectionCount?: number
  inspectionCount?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 10, label, showValue = true, color = "blue", ...props }, ref) => {
    const percentage = Math.min((value / max) * 100, 100)

    const colorClasses = {
      blue: "bg-blue-600",
      purple: "bg-purple-600",
      green: "bg-green-600",
      gray: "bg-gray-600",
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">{label}</span>
            {showValue && (
              <span className="text-xs text-gray-500">{value}</span>
            )}
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", colorClasses[color])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ 
    className, 
    hasAssessment, 
    hasSelection, 
    hasInspection,
    assessmentCount = 0,
    selectionCount = 0,
    inspectionCount = 0,
    ...props 
  }, ref) => {
    // Calculate progress: 0% -> 33% -> 66% -> 100%
    let progress = 0
    if (hasInspection) {
      progress = 100
    } else if (hasSelection) {
      progress = 66
    } else if (hasAssessment) {
      progress = 33
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative mb-1">
          {/* Progress fill */}
          <div
            className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600"
            style={{ width: `${progress}%` }}
          />
          {/* Step markers */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 border-r border-gray-300" />
            <div className="flex-1 border-r border-gray-300" />
            <div className="flex-1" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Assessment</span>
          <span>Selection</span>
          <span>Inspection</span>
        </div>
      </div>
    )
  }
)
StepProgress.displayName = "StepProgress"

export { Progress, StepProgress }

