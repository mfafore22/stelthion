interface MetricCardProps {
  label: string
  value: string
  change: string
  changeLabel: string
  progress: number
}

export function MetricCard({ label, value, change, changeLabel, progress }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 mb-2">
        {value}
      </p>
      <div className="flex items-center gap-2 text-sm text-emerald-500 mb-3">
        <span>↗</span>
        <span>{change} {changeLabel}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}