import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Language } from '@/lib/types';

const progLanguages: { id: Language; label: string; abbr: string; icon: React.ReactElement }[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    abbr: 'JS',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#F7DF1E"/><text x="6" y="17" fontSize="12" fontWeight="700" fill="#000">JS</text></svg>
    ),
  },
  {
    id: 'csharp',
    label: 'C#',
    abbr: 'C#',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#239120"/><text x="6" y="17" fontSize="12" fontWeight="700" fill="#fff">C#</text></svg>
    ),
  },
  {
    id: 'java',
    label: 'Java',
    abbr: 'JV',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#5382A1"/><text x="6" y="17" fontSize="12" fontWeight="700" fill="#fff">Jv</text></svg>
    ),
  },
  {
    id: 'c',
    label: 'C',
    abbr: 'C',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#08457E"/><text x="8" y="17" fontSize="12" fontWeight="700" fill="#fff">C</text></svg>
    ),
  },
];

export function LanguageSelector() {
  const { progLang, setProgLang } = useLanguage();
  return (
    <Select value={progLang} onValueChange={(v) => setProgLang(v as Language)}>
      <SelectTrigger className="w-[40px] h-8 bg-white/5 border-white/10 text-xs p-0 flex items-center justify-center">
        <div className="flex items-center justify-center w-full">
          <span className="text-sm">{progLanguages.find(p => p.id === progLang)?.icon}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {progLanguages.map((p) => (
          <SelectItem key={p.id} value={p.id} className="flex items-center gap-2">
            <span className="w-5 text-sm">{p.icon}</span>
            <span>{p.abbr}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LanguageBadge({ compact = false }: { compact?: boolean }) {
  const { progLang } = useLanguage();
  const info = progLanguages.find(p => p.id === progLang) || progLanguages[0];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded ${compact ? 'text-sm' : 'text-base'} bg-white/5 border border-white/6`}>
      <span className="w-4 h-4 flex-shrink-0">{info.icon}</span>
      <span className="font-medium">{info.label}</span>
    </div>
  );
}
