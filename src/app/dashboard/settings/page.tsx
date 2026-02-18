import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import CompanySettingsForm from '@/app/ui/settings/company-form'

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const stats = await prisma.stats.findUnique({
    where: { customerId: session.user.customerId }
  })

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.customerId }
  })

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-gray-600 mb-6">Manage your company settings</p>

      {isAdmin ? (
        <CompanySettingsForm stats={stats} companyName={customer?.name || ''} />
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-600">Only ADMIN can edit company settings.</p>
        </div>
      )}
    </div>
  )
}