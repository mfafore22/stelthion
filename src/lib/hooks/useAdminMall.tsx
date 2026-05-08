'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import useSWR from 'swr';

const STORAGE_KEY = 'stelthion-admin-mall';

interface MallOption {
  mallId: string;
  name: string;
  city: string;
}

interface AdminMallContextValue {
  activeMallId: string;
  setActiveMallId: (mallId: string) => void;
}

const AdminMallContext = createContext<AdminMallContextValue>({
  activeMallId: '',
  setActiveMallId: () => {},
});

function getStoredMallId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AdminMallProvider({ children }: { children: ReactNode }) {
  const [activeMallId, setRaw] = useState(getStoredMallId);
  const { data: malls } = useSWR<MallOption[]>('/api/admin/malls', fetcher);

  const setActiveMallId = useCallback((mallId: string) => {
    setRaw(mallId);
    localStorage.setItem(STORAGE_KEY, mallId);
  }, []);

  // Auto-correct: if the stored mall isn't in the active customer's mall list,
  // fall back to the first available mall for that customer.
  useEffect(() => {
    if (!malls || malls.length === 0) return;
    if (malls.some((m) => m.mallId === activeMallId)) return;
    setActiveMallId(malls[0].mallId);
  }, [malls, activeMallId, setActiveMallId]);

  return (
    <AdminMallContext.Provider value={{ activeMallId, setActiveMallId }}>
      {children}
    </AdminMallContext.Provider>
  );
}

export function useAdminMall() {
  return useContext(AdminMallContext);
}
