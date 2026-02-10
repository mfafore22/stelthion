'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Sparkles, 
  Layers, 
  Settings 
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Overview' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/insights', icon: Sparkles, label: 'Insights' },
  { href: '/dashboard/tenants', icon: Layers, label: 'Tenants' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6">
      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-8">
        <span className="text-white font-bold text-lg">S</span>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }
              `}
              title={item.label}
            >
              <Icon size={20} />
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}