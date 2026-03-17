import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { StatCard } from '@/app/ui/dashboard/stat-card'
import { MetricCard } from '@/app/ui/dashboard/metric-card'
import { Tabs } from '@/app/ui/dashboard/tabs'
import { isAdminOrManager } from '@/app/lib/role-check'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const customerId = session.user.customerId
  const role = session.user.role

  // Fetch company stats
  let stats = await prisma.stats.findUnique({
    where: { customerId }
  })

  // If no stats exist, create default
  if (!stats) {
    stats = await prisma.stats.create({
      data: {
        customerId,
        totalUnits: 0,
        topCategory: 'N/A',
        foodBeverage: 0,
        fashionRetail: 0,
        currentVisitors: 0,
        dwellTime: 0,
        conversionRate: 0,
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session.user.customerName}
        </h1>
        <p className="text-gray-600">
          Logged in as {session.user.name} ({role})
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Retail Units"
          value={stats.totalUnits.toString()}
          trend={`Updated ${stats.updatedAt.toLocaleDateString()}`}
          color="emerald"
        />
        <StatCard
          label="Top Category"
          value={stats.topCategory}
          subtitle="Based on units"
          color="emerald"
        />
        <StatCard
          label="Food & Beverage"
          value={`${stats.foodBeverage}%`}
          subtitle="of total units"
          color="emerald"
        />
        <StatCard
          label="Fashion & Retail"
          value={`${stats.fashionRetail}%`}
          subtitle="of total units"
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={['Overview', 'Performance', 'Location & Access', 'Tenant Mix', 'Events', 'Weather', 'Campaigns']}
        defaultTab="Performance"
      />

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Metrics */}
        <div className="space-y-4">
          <MetricCard
            label="Current Visitors"
            value={stats.currentVisitors >= 1000 
              ? `${(stats.currentVisitors / 1000).toFixed(1)}k` 
              : stats.currentVisitors.toString()}
            change="+8.7%"
            changeLabel="vs plan"
            progress={75}
          />
          <MetricCard
            label="Dwell Time"
            value={`${stats.dwellTime} min`}
            change="+12.0%"
            changeLabel="vs baseline"
            progress={60}
          />
          
          {/* Only ADMIN and MANAGER see conversion rate */}
          {isAdminOrManager(role) && (
            <MetricCard
              label="Conversion Rate"
              value={`${stats.conversionRate}%`}
              change="+5.2%"
              changeLabel="vs last week"
              progress={45}
            />
          )}
        </div>

        {/* Right Column - Chart */}
        <div className="col-span-2 bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-6">
            Actual vs Predicted Footfall (Today)
          </h3>
          
          {/* Chart Placeholder */}
          <div className="h-64 relative">
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
              <span>2800</span>
              <span>2100</span>
              <span>1400</span>
              <span>700</span>
              <span>0</span>
            </div>
            
            <div className="ml-12 h-full border-l border-b border-gray-200 relative">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 180 Q 50 170, 100 150 T 200 120 T 300 100 T 400 60 T 500 50 T 600 70 T 700 90 T 800 100"
                  fill="url(#chartGradient)"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <path
                  d="M 0 200 Q 100 190, 200 185 T 400 180 T 600 175 T 800 170"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
              
              <div className="absolute bottom-0 left-0 right-0 translate-y-6 flex justify-between text-xs text-gray-400 px-4">
                <span>10am</span>
                <span>12pm</span>
                <span>2pm</span>
                <span>4pm</span>
                <span>6pm</span>
                <span>8pm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}