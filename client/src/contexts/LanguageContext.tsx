import React, { ReactNode } from 'react';

// English-only simplified language provider.
// Keeps a compatible API for `useLanguage()` but does not rely on external maps.
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useLanguage = () => {
  const t = (k: string, fallback?: string) => fallback || k;
  return { lang: 'en' as const, setLang: (_: string) => undefined, t };
};

