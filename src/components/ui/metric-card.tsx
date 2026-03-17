import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export type TrendDirection = "up" | "down" | "flat"
export type MetricStatus = "normal" | "warning" | "critical" | "success"

export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    direction: TrendDirection
    value: string | number
    label?: string
  }
  status?: MetricStatus
  description?: string
  icon?: React.ReactNode
  className?: string
  compact?: boolean
}

const statusStyles: Record<MetricStatus, {
  container: string
  value: string
  trend: string
}> = {
  normal: {
    container: "border-gray-200 dark:border-gray-700",
    value: "text-gray-900 dark:text-gray-100",
    trend: "text-gray-600 dark:text-gray-400"
  },
  success: {
    container: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10",
    value: "text-green-900 dark:text-green-100",
    trend: "text-green-600 dark:text-green-400"
  },
  warning: {
    container: "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10",
    value: "text-yellow-900 dark:text-yellow-100",
    trend: "text-yellow-600 dark:text-yellow-400"
  },
  critical: {
    container: "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
    value: "text-red-900 dark:text-red-100",
    trend: "text-red-600 dark:text-red-400"
  }
}

const trendIcons: Record<TrendDirection, React.ReactNode> = {
  up: <TrendingUp className="h-4 w-4" />,
  down: <TrendingDown className="h-4 w-4" />,
  flat: <Minus className="h-4 w-4" />
}

const trendColors: Record<TrendDirection, string> = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  flat: "text-gray-500 dark:text-gray-400"
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  status = "normal",
  description,
  icon,
  className,
  compact = false
}: MetricCardProps) {
  const styles = statusStyles[status]

  return (
    <div className={cn(
      "rounded-lg border bg-white dark:bg-gray-900 transition-all duration-200",
      styles.container,
      compact ? "p-3" : "p-4",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {icon}
              </div>
            )}
            <h3 className={cn(
              "font-medium truncate",
              compact ? "text-sm" : "text-base",
              "text-gray-700 dark:text-gray-300"
            )}>
              {title}
            </h3>
          </div>

          <div className={cn(
            "mt-1 flex items-baseline space-x-1",
            compact ? "flex-col space-x-0 space-y-1" : "flex-row"
          )}>
            <span className={cn(
              "font-semibold",
              compact ? "text-xl" : "text-2xl",
              styles.value
            )}>
              {value}
            </span>
            {unit && (
              <span className={cn(
                "text-sm text-gray-500 dark:text-gray-400",
                compact && "text-xs"
              )}>
                {unit}
              </span>
            )}
          </div>

          {description && !compact && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {trend && (
          <div className={cn(
            "flex items-center space-x-1 ml-3",
            compact ? "flex-col space-x-0 space-y-1" : "flex-row"
          )}>
            <div className={cn(
              "flex items-center space-x-1",
              trendColors[trend.direction]
            )}>
              {trendIcons[trend.direction]}
              <span className={cn(
                "font-medium",
                compact ? "text-xs" : "text-sm"
              )}>
                {trend.value}
              </span>
            </div>
            {trend.label && (
              <span className={cn(
                "text-xs text-gray-500 dark:text-gray-400",
                compact && "text-center"
              )}>
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}