import * as React from "react"
import { cn } from "@/lib/utils"

export type VariableControlType = "slider" | "toggle" | "number"

export interface VariableControlProps {
  label: string
  value: number | boolean
  type: VariableControlType
  onChange: (value: number | boolean) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  description?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function VariableControl({
  label,
  value,
  type,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  description,
  disabled = false,
  className,
  error
}: VariableControlProps) {
  const handleSliderChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value))
  }, [onChange])

  const handleNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (!isNaN(newValue)) {
      onChange(Math.min(Math.max(newValue, min), max))
    }
  }, [onChange, min, max])

  const handleToggleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked)
  }, [onChange])

  const numericValue = typeof value === "number" ? value : (value ? 1 : 0)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {type !== "toggle" && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {numericValue}{unit && ` ${unit}`}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      <div className="space-y-2">
        {type === "slider" && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numericValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className={cn(
              "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer",
              "slider:bg-blue-600 slider:rounded-lg",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-red-500"
            )}
            aria-label={`${label} slider control`}
          />
        )}

        {type === "number" && (
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={numericValue}
            onChange={handleNumberChange}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 dark:border-gray-600",
              "rounded-md shadow-sm text-sm",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500"
            )}
            aria-label={`${label} number input`}
          />
        )}

        {type === "toggle" && (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={handleToggleChange}
              disabled={disabled}
              className={cn(
                "h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600",
                "rounded focus:ring-blue-500 focus:ring-2",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`${label} toggle`}
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {Boolean(value) ? "Enabled" : "Disabled"}
            </span>
          </label>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}