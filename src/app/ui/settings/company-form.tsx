'use client'

import { useState } from 'react'
import { Button } from '@/app/ui/button'

interface Stats {
  totalUnits: number
  topCategory: string
  foodBeverage: number
  fashionRetail: number
  currentVisitors: number
  dwellTime: number
  conversionRate: number
}

interface Props {
  stats: Stats | null
  companyName: string
}

export default function CompanySettingsForm({ stats, companyName }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)

    const res = await fetch('/api/company/stats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: formData.get('companyName'),
        totalUnits: Number(formData.get('totalUnits')),
        topCategory: formData.get('topCategory'),
        foodBeverage: Number(formData.get('foodBeverage')),
        fashionRetail: Number(formData.get('fashionRetail')),
        currentVisitors: Number(formData.get('currentVisitors')),
        dwellTime: Number(formData.get('dwellTime')),
        conversionRate: Number(formData.get('conversionRate')),
      }),
    })

    if (res.ok) {
      setMessage('Settings updated successfully!')
    } else {
      setMessage('Failed to update settings')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg bg-white p-6 rounded-lg border">
      <h2 className="text-lg font-semibold">Company Information</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Company Name</label>
        <input
          type="text"
          name="companyName"
          defaultValue={companyName}
          className="border p-2 rounded w-full"
          required
        />
      </div>

      <hr className="my-4" />
      
      <h2 className="text-lg font-semibold">Dashboard Statistics</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Total Retail Units</label>
        <input
          type="number"
          name="totalUnits"
          defaultValue={stats?.totalUnits || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Top Category</label>
        <input
          type="text"
          name="topCategory"
          defaultValue={stats?.topCategory || ''}
          placeholder="e.g. Restaurant, Fashion"
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Food & Beverage (%)</label>
        <input
          type="number"
          step="0.1"
          name="foodBeverage"
          defaultValue={stats?.foodBeverage || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fashion & Retail (%)</label>
        <input
          type="number"
          step="0.1"
          name="fashionRetail"
          defaultValue={stats?.fashionRetail || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Current Visitors</label>
        <input
          type="number"
          name="currentVisitors"
          defaultValue={stats?.currentVisitors || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dwell Time (minutes)</label>
        <input
          type="number"
          name="dwellTime"
          defaultValue={stats?.dwellTime || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Conversion Rate (%)</label>
        <input
          type="number"
          step="0.1"
          name="conversionRate"
          defaultValue={stats?.conversionRate || 0}
          className="border p-2 rounded w-full"
        />
      </div>

      {message && (
        <p className={message.includes('success') ? 'text-green-600' : 'text-red-600'}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}