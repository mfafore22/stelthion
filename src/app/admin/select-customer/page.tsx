import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { listSelectableCustomers } from '@/lib/admin-customer';
import { CustomerSelectorClient } from './client';

export const dynamic = 'force-dynamic';

export default async function SelectCustomerPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorVerifiedAt: true },
  });
  if (!user?.twoFactorVerifiedAt) redirect('/two-factor');

  const customers = await listSelectableCustomers();

  if (customers.length === 1) {
    redirect('/admin/dashboard');
  }

  return <CustomerSelectorClient customers={customers} />;
}
