'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';

interface MallUser {
  userId: string;
  email: string;
  mallId: string;
  companyName: string;
  isMultiProperty: boolean;
  properties: string[];
  mallDisplayName?: string;
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
        const properties = malls.map((m: any) => m.mallId);

        setMallUser({
          userId: session.user.id || '',
          email: session.user.email || '',
          mallId: properties[0] || '',
          companyName: customer.name || '',
          isMultiProperty: properties.length > 1,
          properties,
          mallDisplayName: customer.name || session.user.email || '',
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