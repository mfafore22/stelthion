'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { choosePrimaryMallId } from '@/lib/mall/primaryMall';

interface MallUser {
  userId: string;
  email: string;
  mallId: string;
  venueId?: string;
  companyName: string;
  serviceType?: 'MALL' | 'VENUE' | 'MIXED';
  isMultiProperty: boolean;
  properties: string[];
  venues?: string[];
  mallDisplayName?: string;
  role?: string | null;
}

interface SessionContextType {
  user: MallUser | null;
  loading: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useNextAuthSession();
  const [mallUser, setMallUser] = useState<MallUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      setMallUser(null);
      setLoading(false);
      return;
    }

    const customerId = (session.user as any).customerId;
    if (!customerId) {
      setMallUser(null);
      setLoading(false);
      return;
    }

    fetch(`/api/customers/${customerId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch customer');
        return res.json();
      })
      .then((customer) => {
        const malls = customer.malls || [];
        const venues = customer.venues || [];
        const properties = malls.map((m: any) => m.mallId);
        const venueIds = venues.map((v: any) => v.venueId);
        const mallId = choosePrimaryMallId(properties, customer.id);

        setMallUser({
          userId: session.user.id || '',
          email: session.user.email || '',
          mallId,
          venueId: venueIds[0],
          companyName: customer.name || '',
          serviceType: customer.serviceType ?? (venueIds.length ? 'VENUE' : 'MALL'),
          isMultiProperty: properties.length > 1 || venueIds.length > 1,
          properties,
          venues: venueIds,
          mallDisplayName: customer.name || session.user.email || '',
          role: (session.user as { role?: string | null }).role ?? null,
        });
        setLoading(false);
      })
      .catch(() => {
        setMallUser(null);
        setLoading(false);
      });
  }, [session, status]);

  const logout = () => {
    window.location.replace('/login');
  };

  return (
    <SessionContext.Provider value={{ user: mallUser, loading, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
