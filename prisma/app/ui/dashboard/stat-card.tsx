interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  trend?: string
  color?: 'emerald' | 'blue' | 'default'
}

export function StatCard({ label, value, subtitle, trend, color = 'default' }: StatCardProps) {
  const valueColors = {
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    default: 'text-gray-900',
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${valueColors[color]}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
      {trend && (
        <p className="text-sm text-gray-400 mt-1">— {trend}</p>
      )}
    </div>
  )
}