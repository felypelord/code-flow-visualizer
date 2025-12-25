import React, { ReactNode, useState, useEffect } from 'react';
import { Language } from '@/lib/types';

type LanguageContextShape = {
  lang: 'en';
  setLang: (l: string) => void;
  progLang: Language;
  setProgLang: (p: Language) => void;
};

const LanguageContext = React.createContext<LanguageContextShape>({
  lang: 'en',
  setLang: () => undefined,
  progLang: 'javascript',
  setProgLang: () => undefined,
});

// Simplified language provider extended with a global programming-language selector.
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<'en'>('en');
  const [progLang, setProgLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('progLang') as Language) || 'javascript';
    } catch {
      return 'javascript';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('progLang', progLang);
    } catch {}
  }, [progLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, progLang, setProgLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = React.useContext(LanguageContext);
  const t = (k: string, fallback?: string) => fallback || k;
  return { ...ctx, t };
};

