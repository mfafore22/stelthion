'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Locale, t as translate } from './locale'

type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: Parameters<typeof translate>[1]) => string
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  const t = useCallback(
    (key: Parameters<typeof translate>[1]) => translate(locale, key),
    [locale]
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}