import * as React from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, PlayCircle, Settings, BarChart3, Zap } from "lucide-react"
import { CollapsibleCard } from "./collapsible-card"
import { Button } from "./button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAirports } from "@/hooks/useAirports"
import { STELTHION_WHATIF_VERSION } from "@/lib/whatif/version"
import { getSupportedAirports, getAirportConfiguration } from "@/lib/whatif/config/airportConfigurations"

interface EnhancedScenarioLauncherProps {
  defaultExpanded?: boolean
  className?: string
}

export function EnhancedScenarioLauncher({
  defaultExpanded = false,
  className
}: EnhancedScenarioLauncherProps) {
  const [selectedAirport, setSelectedAirport] = React.useState<string>('DOH')
  const router = useRouter()

  // Get airport data
  const { airports } = useAirports()
  const supportedAirports = getSupportedAirports()
  const selectedConfig = getAirportConfiguration(selectedAirport)

  // Filter airports to only show supported ones
  const availableAirports = airports?.filter(airport =>
    supportedAirports.includes(airport.code)
  ) || []

  // Launch scenario planner
  const launchScenarioPlanner = React.useCallback((airportCode?: string) => {
    const targetAirport = airportCode || selectedAirport
    const url = `/dashboard/scenarios/planner?airport=${targetAirport}&from=${encodeURIComponent('/dashboard')}`
    router.push(url)
  }, [selectedAirport, router])

  // Quick launch for current selection
  const handleQuickLaunch = React.useCallback(() => {
    launchScenarioPlanner(selectedAirport)
  }, [launchScenarioPlanner, selectedAirport])

  return (
    <CollapsibleCard
      title="SCENARIO PLANNER"
      icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
      defaultExpanded={defaultExpanded}
      variant="sidebar"
      className={className}
      titleClassName="text-blue-600"
    >
      <div className="p-3 space-y-3 text-sm">
        {/* Engine Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="h-3 w-3" />
          <span>Stelthion What-If Engine</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            v{STELTHION_WHATIF_VERSION}
          </Badge>
        </div>

        {/* Quick Airport Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Airport</label>
          <Select value={selectedAirport} onValueChange={setSelectedAirport}>
            <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableAirports.map(airport => {
                const config = getAirportConfiguration(airport.code)
                return (
                  <SelectItem key={airport.code} value={airport.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{airport.code}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-xs">{config?.city}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Airport Info */}
        {selectedConfig && (
          <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
            <div className="text-xs font-medium text-slate-200">{selectedConfig.name}</div>
            <div className="text-xs text-slate-400">
              {selectedConfig.characteristics.annualPassengers.toLocaleString()} pax/year
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-slate-700">
                {selectedConfig.characteristics.runways} runways
              </Badge>
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-slate-700">
                {selectedConfig.characteristics.terminals} terminals
              </Badge>
            </div>
          </div>
        )}

        {/* Launch Button */}
        <Button
          onClick={handleQuickLaunch}
          className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-500"
        >
          <PlayCircle className="h-3 w-3 mr-1.5" />
          Launch Scenario Planner
        </Button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => launchScenarioPlanner(selectedAirport)}
            className="h-7 text-xs border-slate-600 hover:bg-slate-800"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Quick Analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/scenarios/planner')}
            className="h-7 text-xs border-slate-600 hover:bg-slate-800"
          >
            <Settings className="h-3 w-3 mr-1" />
            Advanced Mode
          </Button>
        </div>

        {/* Engine Status */}
        <div className="text-xs text-center text-slate-400 pt-2 border-t border-slate-700">
          Engine ready • {supportedAirports.length} airports • 47 variables
        </div>
      </div>
    </CollapsibleCard>
  )
}
