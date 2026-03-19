import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import Link from 'next/link'
import { Building2, Users, TrendingUp, Clock, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.customerId) redirect('/login')

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.customerId },
    include: {
      malls: {
        include: {
          stats: true,
          branding: true,
          categories: true,
        }
      }
    }
  })

  if (!customer) redirect('/login')

  const totalVisitors = customer.malls.reduce((sum, m) => sum + (m.stats?.currentVisitors ?? 0), 0)
  const totalAnnualSales = customer.malls.reduce((sum, m) => sum + (m.stats?.annualSales ?? 0), 0)
  const totalShops = customer.malls.reduce((sum, m) => sum + m.totalShops, 0)

  return (
    <div>
      {/* Company header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{customer.name} Portfolio</h1>
        <p className="text-sm text-gray-500 mt-1">
          {customer.malls.length} properties · {totalShops.toLocaleString()} shops · {totalVisitors.toLocaleString()} current visitors
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Properties</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{customer.malls.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users size={18} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Current Visitors</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{totalVisitors.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Annual Sales</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">€{(totalAnnualSales / 1_000_000).toFixed(0)}M</p>
        </div>
      </div>

      {/* Mall grid */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customer.malls.map((mall) => (
          <Link
            key={mall.id}
            href={`/dashboard/${mall.id}`}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Gradient header */}
            <div
              className="h-24 flex items-end p-4"
              style={{
                background: `linear-gradient(135deg, ${mall.branding?.gradientFrom ?? '#1e40af'}, ${mall.branding?.gradientTo ?? '#3b82f6'})`,
              }}
            >
              <div>
                <h3 className="text-white font-semibold text-lg leading-tight">{mall.name}</h3>
                <p className="text-white/70 text-sm">{mall.city}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Users size={14} /> Visitors now
                </span>
                <span className="font-medium text-gray-900">
                  {(mall.stats?.currentVisitors ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <TrendingUp size={14} /> Annual sales
                </span>
                <span className="font-medium text-gray-900">
                  €{((mall.stats?.annualSales ?? 0) / 1_000_000).toFixed(0)}M
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} /> Dwell time
                </span>
                <span className="font-medium text-gray-900">
                  {mall.stats?.dwellTime ?? 0} min
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <ShoppingBag size={14} /> Shops
                </span>
                <span className="font-medium text-gray-900">{mall.totalShops}</span>
              </div>

              {/* Status badge */}
              <div className="pt-2 border-t border-gray-100">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  mall.status === 'LIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : mall.status === 'BETA'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {mall.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}