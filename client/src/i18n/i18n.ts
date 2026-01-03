import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en/translation.json';
import ptBR from '@/locales/pt-BR/translation.json';
import es from '@/locales/es/translation.json';
import zhCN from '@/locales/zh-CN/translation.json';
import hiIN from '@/locales/hi-IN/translation.json';

export const SUPPORTED_UI_LANGUAGES = ['en', 'pt-BR', 'es', 'zh-CN', 'hi-IN'] as const;
export type UILanguage = (typeof SUPPORTED_UI_LANGUAGES)[number];

export function normalizeUILanguage(input?: string | null): UILanguage {
  if (!input) return 'en';

  const normalized = input.trim().toLowerCase();

  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'pt' || normalized === 'pt-br' || normalized.startsWith('pt-')) return 'pt-BR';
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-')) return 'zh-CN';
  if (normalized === 'hi' || normalized === 'hi-in' || normalized.startsWith('hi-')) return 'hi-IN';

  return 'en';
}

export function initI18n() {
  if (i18n.isInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        'pt-BR': { translation: ptBR },
        es: { translation: es },
        'zh-CN': { translation: zhCN },
        'hi-IN': { translation: hiIN },
      },
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_UI_LANGUAGES],
      nonExplicitSupportedLngs: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['querystring', 'localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupQuerystring: 'lng',
        lookupLocalStorage: 'lang',
        convertDetectedLanguage: (lng: string) => normalizeUILanguage(lng),
      },
    });

  const normalized = normalizeUILanguage(i18n.language);
  if (i18n.language !== normalized) {
    void i18n.changeLanguage(normalized);
  }

  return i18n;
}

export { i18n };
