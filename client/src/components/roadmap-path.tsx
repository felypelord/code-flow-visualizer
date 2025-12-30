import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { GuidedPath } from './guided-path';
import ReactMarkdown from 'react-markdown';
import { runTestsInWorker } from '@/lib/testRunner';

type RoadmapItem = {
  slug: string;
  title: string;
  summary?: string;
  icon?: string;
  pathId: string;
  order?: number;
  isPro?: boolean;
  content?: string;
  contentPreview?: string;
  starterCode?: string;
  tests?: any[];
};

export default function RoadmapPath(): React.ReactElement {
  const { user } = useUser();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [selectedLocked, setSelectedLocked] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [purchases, setPurchases] = useState<string[]>([]);
  const purchasedSet = useMemo(() => new Set(purchases), [purchases]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/roadmap');
        if (!res.ok) return;
        const j = await res.json();
        setItems(Array.isArray(j.items) ? j.items : []);
      } catch (e) { /* ignore */ }
    })();

    (async () => {
      try {
        const res = await fetch('/api/monetization/purchases');
        if (!res.ok) return;
        const j = await res.json();
        if (Array.isArray(j.purchases)) setPurchases(j.purchases.map((p:any) => p.itemId));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const paths = useMemo(() => {
    const by: Record<string, RoadmapItem[]> = {};
    for (const it of items) (by[it.pathId] ||= []).push(it);
    for (const k of Object.keys(by)) by[k].sort((a, b) => (a.order || 0) - (b.order || 0));
    return by;
  }, [items]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedSlug) { setSelectedItem(null); setSelectedLocked(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/roadmap/${encodeURIComponent(selectedSlug)}`);
        if (!res.ok) return;
        const j = await res.json();
        setSelectedItem(j.item || null);
        setSelectedLocked(Boolean(j.locked || j.item?.isPro));
      } catch (e) { /* ignore */ }
    })();
  }, [selectedSlug]);

  async function startPurchase(itemId: string) {
    try {
      // Redirect to centralized pricing/store page for this roadmap item
      const url = new URL(window.location.origin + '/pricing');
      url.searchParams.set('product', itemId);
      url.searchParams.set('returnTo', window.location.pathname + window.location.search);
      window.location.href = url.toString();
    } catch (e) { alert('Falha ao iniciar compra'); }
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {Object.keys(paths).map((pathId) => (
        <section key={pathId} className="space-y-2">
          <h3 className="font-semibold">{pathId}</h3>
          <div className="flex gap-3 overflow-x-auto py-2">
            {paths[pathId].map((it) => {
              const locked = it.isPro && !purchasedSet.has(`roadmap:${it.slug}`);
              return (
                <div key={it.slug} className="relative w-44 p-3 rounded bg-slate-800 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-slate-700">{it.icon || '•'}</div>
                    <div className="flex-1 text-sm">{it.title}</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-300">{it.summary}</div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-2 py-1 bg-amber-500 text-black rounded text-xs" onClick={() => setSelectedSlug(it.slug)}>Open</button>
                    {locked ? (
                      <button className="px-2 py-1 bg-slate-700 text-xs rounded flex items-center gap-1" onClick={() => startPurchase(`roadmap:${it.slug}`)}><Lock size={14}/> Pro</button>
                    ) : (
                      <button className="px-2 py-1 bg-slate-700 text-xs rounded flex items-center gap-1" onClick={() => { setSelectedSlug(it.slug); setShowPractice(true); }}><Unlock size={14}/> Practice</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {selectedSlug && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-slate-900 rounded w-full max-w-3xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold">{selectedItem.title}</div>
                <div className="text-sm text-amber-200">{selectedItem.summary}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-amber-200" onClick={() => { setSelectedSlug(null); setShowPractice(false); }}>Close</button>
              </div>
            </div>

            <div className="mt-4 prose max-w-none text-sm text-gray-200">
              {selectedLocked ? (
                <div>
                  <div className="mb-3">Conteúdo Pro — bloqueado.</div>
                  <div className="mb-4"><ReactMarkdown skipHtml>{selectedItem.contentPreview || selectedItem.summary || ''}</ReactMarkdown></div>
                  <div className="flex gap-2">
                    <button className="bg-amber-500 text-black px-3 py-2 rounded" onClick={() => startPurchase(`roadmap:${selectedItem.slug}`)}>Comprar Pro</button>
                    <a className="px-3 py-2 border rounded" href="/signup">Criar conta</a>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="prose max-w-none"><ReactMarkdown skipHtml>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>
                  <div className="mt-4">
                    <button className="bg-emerald-500 text-black px-3 py-2 rounded" onClick={() => setShowPractice(true)}>Praticar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSlug && showPractice && selectedItem && !selectedLocked && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-slate-900 rounded w-full max-w-4xl p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Practice: {selectedItem.title}</div>
              <button className="text-amber-200" onClick={() => setShowPractice(false)}>Close</button>
            </div>
            <GuidedPath
              id={`roadmap-single-${selectedItem.slug}`}
              title={selectedItem.title}
              steps={[{
                id: selectedItem.slug,
                title: selectedItem.title,
                lesson: (selectedItem.content || selectedItem.summary || '').split('\n\n'),
                taskPrompt: selectedItem.summary || 'Implemente este exercício',
                check: async (code: string) => {
                  try {
                    const starter = selectedItem.starterCode || '';
                    const tests = selectedItem.tests || [];
                    const res = await runTestsInWorker(starter, code, tests);
                    return res;
                  } catch (e: any) { return { ok: false, messages: [e?.message || String(e)] }; }
                }
              }]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
