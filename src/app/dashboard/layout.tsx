import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import { Sidebar } from '@/app/ui/dashboard/sidebar';
import { Header } from '../ui/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorVerifiedAt: true },
  })
  if (!user?.twoFactorVerifiedAt) {
    redirect('/two-factor');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}