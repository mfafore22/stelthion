import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, TrendingUp, Clock, ShoppingBag, BarChart3 } from 'lucide-react'

export default async function MallDetailPage({
  params,
}: {
  params: Promise<{ mallId: string }>
}) {
  const session = await auth()
  if (!session?.user?.customerId) redirect('/login')

  const { mallId } = await params

  const mall = await prisma.mall.findUnique({
    where: { mallId },
    include: {
      stats: true,
      branding: true,
      categories: true,
      customer: true,
    }
  })

  if (!mall || mall.customerId !== session.user.customerId) {
    redirect('/dashboard')
  }

  const stats = mall.stats

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        Back to portfolio
      </Link>

      <div
        className="rounded-xl p-6 mb-8"
        style={{
          background: `linear-gradient(135deg, ${mall.branding?.gradientFrom ?? '#1e40af'}, ${mall.branding?.gradientTo ?? '#3b82f6'})`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{mall.name}</h1>
            <p className="text-white/70 mt-1">{mall.city} · {mall.totalShops} shops</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            mall.status === 'LIVE'
              ? 'bg-white/20 text-white'
              : 'bg-white/10 text-white/70'
          }`}>
            {mall.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-emerald-600" />
            <span className="text-xs text-gray-500">Current Visitors</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {(stats?.currentVisitors ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-600" />
            <span className="text-xs text-gray-500">Annual Visitors</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {((stats?.annualVisitors ?? 0) / 1_000_000).toFixed(1)}M
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-purple-600" />
            <span className="text-xs text-gray-500">Annual Sales</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            €{((stats?.annualSales ?? 0) / 1_000_000).toFixed(0)}M
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-600" />
            <span className="text-xs text-gray-500">Dwell Time</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {stats?.dwellTime ?? 0} min
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-indigo-600" />
            <span className="text-xs text-gray-500">Conversion</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {stats?.conversionRate ?? 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Categories</h2>
        <div className="space-y-3">
          {mall.categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-32">{cat.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: mall.branding?.primaryColor ?? '#1e40af',
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 w-20 text-right">
                {cat.shopCount} shops ({cat.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}