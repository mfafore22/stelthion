'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { AssistantViewContext } from '@/lib/assistant-flow/types';

export type ShopperMindTrendViewContext = Extract<AssistantViewContext, { kind: 'shoppermind_trend' }>;
export type ViewContextValue = AssistantViewContext | null;

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
  const phenomenonId = ctx?.phenomenonId;
  const label = ctx?.label;
  const state = ctx?.state;
  const primaryCountry = ctx?.primaryCountry;
  const returnTarget = ctx?.returnTarget;
  useEffect(() => {
    if (!phenomenonId || !label || !state || !primaryCountry) {
      clear();
      return;
    }
    setValue({ kind: 'shoppermind_trend', phenomenonId, label, state, primaryCountry, returnTarget });
    return () => clear();
  }, [phenomenonId, label, state, primaryCountry, returnTarget, setValue, clear]);
}
