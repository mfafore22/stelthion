'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const DEFAULT_MALL_ID = 'ideapark';
const STORAGE_KEY = 'stelthion-admin-mall';

interface AdminMallContextValue {
  activeMallId: string;
  setActiveMallId: (mallId: string) => void;
}

const AdminMallContext = createContext<AdminMallContextValue>({
  activeMallId: DEFAULT_MALL_ID,
  setActiveMallId: () => {},
});

function getStoredMallId(): string {
  if (typeof window === 'undefined') return DEFAULT_MALL_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  // Migration: clear stale 'ideapark-lempaala' value stored by older versions
  if (stored === 'ideapark-lempaala') {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_MALL_ID;
  }
  return stored ?? DEFAULT_MALL_ID;
}

export function AdminMallProvider({ children }: { children: ReactNode }) {
  const [activeMallId, setRaw] = useState(getStoredMallId);

  const setActiveMallId = useCallback((mallId: string) => {
    setRaw(mallId);
    localStorage.setItem(STORAGE_KEY, mallId);
  }, []);

  return (
    <AdminMallContext.Provider value={{ activeMallId, setActiveMallId }}>
      {children}
    </AdminMallContext.Provider>
  );
}

export function useAdminMall() {
  return useContext(AdminMallContext);
}
