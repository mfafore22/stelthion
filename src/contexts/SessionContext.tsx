/**
 * Session Context
 * Provides authenticated user session data to client components
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SessionUser {
  userId: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  isMultiProperty?: boolean; // Whether tenant manages multiple properties
  properties?: string[]; // List of all property IDs this tenant can access
}

interface SessionContextValue {
  user: SessionUser | null;
  csrfToken: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/mall/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCsrfToken(data.csrfToken || null);
      } else {
        setUser(null);
        setCsrfToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/mall/auth/logout', { method: 'POST' });
      setUser(null);
      setCsrfToken(null);
      router.push('/mall/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchSession();
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ user, csrfToken, loading, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
