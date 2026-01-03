import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { SUPPORTED_UI_LANGUAGES, type UILanguage } from '@/i18n/i18n';

const uiLanguages: { id: UILanguage; label: string; flag: string }[] = [
  { id: 'en', label: 'en', flag: '🇺🇸' },
  { id: 'pt-BR', label: 'pt-br', flag: '🇧🇷' },
  { id: 'es', label: 'es', flag: '🇪🇸' },
  { id: 'zh-CN', label: 'zh', flag: '🇨🇳' },
  { id: 'hi-IN', label: 'hi', flag: '🇮🇳' }
];

export function UILanguageSelector() {
  const { lang, setLang } = useLanguage();
  const value = (SUPPORTED_UI_LANGUAGES.includes(lang as any) ? (lang as UILanguage) : 'en');

  return (
    <Select value={value} onValueChange={(v) => setLang(v)}>
      <SelectTrigger className="w-[72px] h-8 bg-white/5 border-white/10 text-xs px-2">
        <span className="inline-flex items-center gap-1">
          <span className="text-sm">{uiLanguages.find((l) => l.id === value)?.flag}</span>
          <span>{uiLanguages.find((l) => l.id === value)?.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {uiLanguages.map((l) => (
          <SelectItem key={l.id} value={l.id} className="flex items-center gap-2">
            <span className="w-5 text-sm">{l.flag}</span>
            <span className="text-xs">{l.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
