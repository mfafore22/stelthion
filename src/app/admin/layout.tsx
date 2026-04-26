import { redirect } from 'next/navigation';
import prisma from '../lib/prisma';
import { auth } from '@/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getMallIdentity, getContrastTextColor } from '@/lib/mall/mallIdentity';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  if (session.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorVerifiedAt: true },
  });

  if (!user?.twoFactorVerifiedAt) {
    redirect('/two-factor');
  }

  const identity = getMallIdentity('ideapark-lempaala');
  const textColor = getContrastTextColor(identity.colors.primary);

  return (
    <div className="flex h-screen bg-bo-neutral-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <div
          className="px-6 py-4 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${identity.gradient.from} 0%, ${identity.gradient.to} 100%)`,
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-5">
              <div className="flex gap-2.5">
                <div
                  className="w-3 h-3 rounded-full shadow-bo-sm"
                  style={{ backgroundColor: identity.colors.accent }}
                />
                <div
                  className="w-3 h-3 rounded-full shadow-bo-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                />
                <div
                  className="w-3 h-3 rounded-full shadow-bo-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
                />
              </div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ color: textColor }}
              >
                {identity.name}
              </h2>
              <span
                className="text-sm px-4 py-1.5 rounded-md font-medium tracking-wide"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: textColor,
                }}
              >
                Lempäälä
              </span>
            </div>
            {identity.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={identity.logo}
                alt={identity.name}
                style={{ height: '52px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
              />
            )}
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}