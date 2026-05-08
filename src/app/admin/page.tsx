import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { getSelectedCustomer, listSelectableCustomers } from '@/lib/admin-customer';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorVerifiedAt: true },
  });
  if (!user?.twoFactorVerifiedAt) redirect('/two-factor');

  const selected = await getSelectedCustomer();
  if (selected) redirect('/admin/dashboard');

  const customers = await listSelectableCustomers();
  if (customers.length <= 1) redirect('/admin/dashboard');
  redirect('/select-customer');
}
