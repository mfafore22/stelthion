'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Building2,
  Megaphone,
  BarChart3,
  TrendingUpDown,
  HandPlatter,
  Brain,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Portfolio' },
  { href: '/dashboard/tenants', icon: Building2, label: 'My Properties' },
  { href: '/dashboard/reports', icon: Megaphone, label: 'Campaigns' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/insights', icon: TrendingUpDown, label: 'Scenarios' },
  { href: '/dashboard/messages', icon: HandPlatter, label: 'Assistants' },
  { href: '/dashboard/shoppermind', icon: Brain, label: 'ShopperMind' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6">
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