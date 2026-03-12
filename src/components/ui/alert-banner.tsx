import * as React from "react"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertVariant = "info" | "success" | "warning" | "error"

export interface AlertBannerProps {
  variant: AlertVariant
  title?: string
  children: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  icon?: React.ReactNode
}

const variantStyles: Record<AlertVariant, {
  container: string
  icon: string
  title: string
  content: string
}> = {
  info: {
    container: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-500 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-200",
    content: "text-blue-700 dark:text-blue-300"
  },
  success: {
    container: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: "text-green-500 dark:text-green-400",
    title: "text-green-800 dark:text-green-200",
    content: "text-green-700 dark:text-green-300"
  },
  warning: {
    container: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-500 dark:text-yellow-400",
    title: "text-yellow-800 dark:text-yellow-200",
    content: "text-yellow-700 dark:text-yellow-300"
  },
  error: {
    container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "text-red-500 dark:text-red-400",
    title: "text-red-800 dark:text-red-200",
    content: "text-red-700 dark:text-red-300"
  }
}

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />
}

export function AlertBanner({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
  icon
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const styles = variantStyles[variant]
  const displayIcon = icon || defaultIcons[variant]

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false)
    onDismiss?.()
  }, [onDismiss])

  if (!isVisible) {
    return null
  }

  return (
    <div className={cn(
      "relative rounded-lg border p-4",
      styles.container,
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0", styles.icon)}>
          {displayIcon}
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn("text-sm font-medium", styles.title)}>
              {title}
            </h3>
          )}
          <div className={cn(
            "text-sm",
            styles.content,
            title && "mt-1"
          )}>
            {children}
          </div>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 rounded-md p-1.5 transition-colors",
              "hover:bg-black/5 dark:hover:bg-white/5",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              variant === "info" && "focus:ring-blue-500",
              variant === "success" && "focus:ring-green-500",
              variant === "warning" && "focus:ring-yellow-500",
              variant === "error" && "focus:ring-red-500",
              styles.icon
            )}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}