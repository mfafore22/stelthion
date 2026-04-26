'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type React from 'react';

export interface ShopperMindTrendViewContext {
  kind: 'shoppermind_trend';
  phenomenonId: string;
  label: string;
  state: string;
  primaryCountry: string;
}

export type ViewContextValue = ShopperMindTrendViewContext | null;

interface ViewContextStore {
  value: ViewContextValue;
  setValue: (next: ViewContextValue) => void;
  clear: () => void;
}

const Ctx = createContext<ViewContextStore | null>(null);

export function ViewContextProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<ViewContextValue>(null);
  const clear = useCallback(() => setValue(null), []);
  const store = useMemo<ViewContextStore>(() => ({ value, setValue, clear }), [value, clear]);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useViewContext(): ViewContextStore {
  const store = useContext(Ctx);
  if (!store) {
    return {
      value: null,
      setValue: () => {},
      clear: () => {},
    };
  }
  return store;
}

export function useSetTrendViewContext(ctx: Omit<ShopperMindTrendViewContext, 'kind'> | null) {
  const { setValue, clear } = useViewContext();
  useEffect(() => {
    if (!ctx) {
      clear();
      return;
    }
    setValue({ kind: 'shoppermind_trend', ...ctx });
    return () => clear();
  }, [ctx?.phenomenonId, ctx?.label, ctx?.state, ctx?.primaryCountry, setValue, clear]);
}
