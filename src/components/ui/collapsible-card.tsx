import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CollapsibleCardProps {
  title: string
  icon?: React.ReactNode
  children?: React.ReactNode
  defaultExpanded?: boolean
  variant?: "default" | "sidebar"
  className?: string
  titleClassName?: string
  contentClassName?: string
  onToggle?: (expanded: boolean) => void
}

export function CollapsibleCard({
  title,
  icon,
  children,
  defaultExpanded = false,
  variant = "default",
  className,
  titleClassName,
  contentClassName,
  onToggle
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  const handleToggle = React.useCallback(() => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(newExpanded)
  }, [isExpanded, onToggle])

  const baseCardClasses = variant === "sidebar"
    ? "bg-gray-50 dark:bg-gray-800/50"
    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"

  return (
    <div className={cn(
      "rounded-lg overflow-hidden transition-all duration-200",
      baseCardClasses,
      className
    )}>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          "hover:bg-gray-50 dark:hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500",
          titleClassName
        )}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
              {icon}
            </div>
          )}
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className={cn(
            "border-t border-gray-200 dark:border-gray-700",
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}