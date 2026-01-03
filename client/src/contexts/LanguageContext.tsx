import React, { ReactNode, useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { i18n, initI18n, normalizeUILanguage, type UILanguage } from '@/i18n/i18n';

type LanguageContextShape = {
  lang: string;
  setLang: React.Dispatch<React.SetStateAction<string>>;
  progLang: Language;
  setProgLang: (p: Language) => void;
};

const LanguageContext = React.createContext<LanguageContextShape>({
  lang: 'en',
  setLang: () => undefined as any,
  progLang: 'javascript',
  setProgLang: () => undefined,
});

// Simplified language provider extended with a global programming-language selector.
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<UILanguage>(() => {
    initI18n();
    return normalizeUILanguage(i18n.language);
  });
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

  useEffect(() => {
    initI18n();
    const onLanguageChanged = (next: string) => setLangState(normalizeUILanguage(next));
    i18n.on('languageChanged', onLanguageChanged);
    onLanguageChanged(i18n.language);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    // SEO / accessibility: keep <html lang>, title/description and hreflang in sync.
    // This does not change UX, only document metadata.
    try {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;

      const currentLang = normalizeUILanguage(lang);
      document.documentElement.lang = currentLang;

      const t = (k: string, fallback?: string) => {
        initI18n();
        return i18n.t(k, { defaultValue: fallback ?? k });
      };

      const seoTitle = t('seo.title', 'CodeFlowBR — Learn to Code Visually | Free Interactive Lessons');
      const seoDescription = t('seo.description', 'Learn programming visually and interactively with CodeFlowBR. Free lessons and exercises for Python, JavaScript, C++ and more. Start now.');

      document.title = seoTitle;

      const ensureMeta = (selector: string, attrs: Record<string, string>) => {
        let el = document.head.querySelector(selector) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
          document.head.appendChild(el);
        }
        return el;
      };

      // Description
      const descEl = ensureMeta('meta[name="description"]', { name: 'description' });
      descEl.setAttribute('content', seoDescription);

      // og:title / og:description
      const ogTitle = ensureMeta('meta[property="og:title"]', { property: 'og:title' });
      ogTitle.setAttribute('content', seoTitle);
      const ogDesc = ensureMeta('meta[property="og:description"]', { property: 'og:description' });
      ogDesc.setAttribute('content', seoDescription);

      // og:locale
      const ogLocale = ensureMeta('meta[property="og:locale"]', { property: 'og:locale' });
      const toOgLocale = (lng: UILanguage) => {
        if (lng === 'pt-BR') return 'pt_BR';
        if (lng === 'es') return 'es_ES';
        if (lng === 'zh-CN') return 'zh_CN';
        if (lng === 'hi-IN') return 'hi_IN';
        return 'en_US';
      };
      ogLocale.setAttribute('content', toOgLocale(currentLang));

      // Canonical (keep query only when it's a language landing page)
      const origin = window.location.origin;
      const pathname = window.location.pathname || '/';
      const hasLngParam = (() => {
        try {
          const u = new URL(window.location.href);
          return Boolean(u.searchParams.get('lng'));
        } catch {
          return false;
        }
      })();

      const canonicalHref = hasLngParam ? `${origin}${pathname}?lng=${encodeURIComponent(currentLang)}` : `${origin}${pathname}`;
      let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalHref);

      // Hreflang alternates (querystring based)
      const supported: UILanguage[] = ['en', 'pt-BR', 'es', 'zh-CN', 'hi-IN'];
      // Remove previous managed links
      document.head.querySelectorAll('link[data-seo="hreflang"]').forEach((n) => n.remove());

      const makeAlt = (hreflang: string, href: string) => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'alternate');
        l.setAttribute('hreflang', hreflang);
        l.setAttribute('href', href);
        l.setAttribute('data-seo', 'hreflang');
        document.head.appendChild(l);
      };

      makeAlt('x-default', `${origin}${pathname}`);
      for (const lng of supported) {
        makeAlt(lng, `${origin}${pathname}?lng=${encodeURIComponent(lng)}`);
      }
    } catch {
      // no-op
    }
  }, [lang]);

  const setLang: React.Dispatch<React.SetStateAction<string>> = (next) => {
    initI18n();
    const resolved = typeof next === 'function' ? next(i18n.language) : next;
    void i18n.changeLanguage(normalizeUILanguage(resolved));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, progLang, setProgLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = React.useContext(LanguageContext);
  const t = (k: string, fallback?: string, options?: Record<string, unknown>) => {
    initI18n();
    return i18n.t(k, { defaultValue: fallback ?? k, ...(options || {}) });
  };
  return { ...ctx, t };
};

