import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { GuidedPath } from './guided-path';
import ReactMarkdown from 'react-markdown';
import { runTestsInWorker } from '@/lib/testRunner';

export default function RoadmapPath() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedLocked, setSelectedLocked] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [purchases, setPurchases] = useState<string[]>([]);
  const purchasedSet = new Set(purchases);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/roadmap');
        if (!res.ok) return;
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) { /* ignore */ }
    })();
    (async () => {
      try {
        const res = await fetch('/api/monetization/purchases');
        if (!res.ok) return;
        const j = await res.json();
        if (Array.isArray(j.purchases)) setPurchases(j.purchases.map((p:any)=>p.itemId));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const paths = useMemo(() => {
    const by: Record<string, any[]> = {};
    for (const it of items) {
      (by[it.pathId] ||= []).push(it);
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return by;
  }, [items]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedSlug) { setSelectedItem(null); setSelectedLocked(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/roadmap/${encodeURIComponent(selectedSlug)}`);
        if (!res.ok) return;
        const data = await res.json();
        setSelectedItem(data.item || null);
        setSelectedLocked(Boolean(data.locked));
      } catch (e) { /* ignore */ }
    })();
  }, [selectedSlug]);

  return (
    <div ref={containerRef} className="space-y-4">
      {Object.keys(paths).map((pathId) => (
        <div key={pathId} className="flex items-center gap-3 overflow-auto">
          {paths[pathId].map((it: any) => (
            <button key={it.slug} onClick={() => setSelectedSlug(it.slug)} className="flex items-center gap-2 p-3 bg-slate-800 rounded">
              <div className="w-10 h-10 flex items-center justify-center rounded bg-slate-700">{it.icon || '•'}</div>
              <div className="text-sm">{it.title}</div>
            </button>
          ))}
        </div>
      ))}

      {/* Modal */}
      {selectedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-slate-900 border border-amber-400/30 text-white rounded max-w-2xl w-full p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{selectedItem?.title || selectedSlug}</div>
                <div className="text-sm text-amber-200">{selectedItem?.summary || ''}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-amber-200" onClick={() => setSelectedSlug(null)}>Close</button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-200">
              {selectedItem ? (
                selectedLocked ? (
                  <div>
                    <div className="mb-3 text-gray-300">Locked. Preview:</div>
                    <div className="prose max-w-none text-sm text-gray-200"><ReactMarkdown>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>
                    <div className="mt-4 flex gap-2">
                      <a className="bg-amber-500 text-black px-3 py-2 rounded font-semibold" href="/pricing">Upgrade</a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="prose max-w-none text-sm text-gray-200"><ReactMarkdown>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>
                    <div className="mt-4 flex gap-2">
                      {user ? (
                        purchasedSet.has(`roadmap:${selectedItem.slug}`) ? (
                          <button className="bg-emerald-500 text-black px-3 py-2 rounded font-semibold" disabled>Owned</button>
                        ) : (
                          <button
                            className="bg-amber-500 text-black px-3 py-2 rounded font-semibold"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/monetization/create-payment', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ packageId: 'roadmap_item', itemId: `roadmap:${selectedItem.slug}` }),
                                });
                                const j = await res.json();
                                if (j?.checkoutUrl) window.location.href = j.checkoutUrl;
                              } catch (e) { alert('Failed to start purchase'); }
                            }}
                          >
                            Buy this item
                          </button>
                        )
                      ) : (
                        <a className="bg-amber-500 text-black px-3 py-2 rounded font-semibold" href="/signup">Sign up to purchase</a>
                      )}
                      <button className="border border-amber-400/40 text-amber-200 px-3 py-2 rounded" onClick={() => setShowPractice(true)}>Practice</button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-xs text-gray-400">Loading...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Practice modal rendering GuidedPath */}
      {selectedSlug && showPractice && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-slate-900 border border-amber-400/30 text-white rounded max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Practice: {selectedItem?.title || selectedSlug}</div>
              <button className="text-amber-200" onClick={() => setShowPractice(false)}>Close</button>
            </div>
            <div>
              <GuidedPath
                id={`roadmap-single-${selectedItem.slug}`}
                title={selectedItem.title}
                steps={[{
                  id: selectedItem.slug,
                  title: selectedItem.title,
                  lesson: (selectedItem.content || selectedItem.summary || '').split('\n\n'),
                  taskPrompt: selectedItem.summary || 'Practice this task',
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
        </div>
      )}
    </div>
  );
}
import { Lock, Unlock } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { GuidedPath } from './guided-path';
import ReactMarkdown from 'react-markdown';
import { runTestsInWorker } from '@/lib/testRunner';

export default function RoadmapPath() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedLocked, setSelectedLocked] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [purchases, setPurchases] = useState<string[]>([]);
  const purchasedSet = new Set(purchases);
}
      try {
        const res = await fetch('/api/roadmap');
        if (!res.ok) return;
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) { /* ignore */ }
    })();
    // fetch purchases if logged in
    (async () => {
      try {
        const res = await fetch('/api/monetization/purchases');
        import React, { useEffect, useMemo, useRef, useState } from 'react';
        import { Lock, Unlock } from 'lucide-react';
        import { useUser } from '@/hooks/use-user';
        import { GuidedPath } from './guided-path';
        import ReactMarkdown from 'react-markdown';
        import { runTestsInWorker } from '@/lib/testRunner';

        export default function RoadmapPath() {
          const { user } = useUser();
          const [items, setItems] = useState<any[]>([]);
          const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
          const [selectedItem, setSelectedItem] = useState<any | null>(null);
          const [selectedLocked, setSelectedLocked] = useState(false);
          const [showPractice, setShowPractice] = useState(false);
          const [purchases, setPurchases] = useState<string[]>([]);
          const purchasedSet = new Set(purchases);

          useEffect(() => {
            (async () => {
              try {
                const res = await fetch('/api/roadmap');
                if (!res.ok) return;
                const data = await res.json();
                setItems(Array.isArray(data.items) ? data.items : []);
              } catch (e) { /* ignore */ }
            })();
            (async () => {
              try {
                const res = await fetch('/api/monetization/purchases');
                if (!res.ok) return;
                const j = await res.json();
                if (Array.isArray(j.purchases)) setPurchases(j.purchases.map((p:any)=>p.itemId));
              } catch (e) { /* ignore */ }
            })();
          }, []);

          const paths = useMemo(() => {
            const by: Record<string, any[]> = {};
            for (const it of items) {
              (by[it.pathId] ||= []).push(it);
            }
            for (const k of Object.keys(by)) {
              by[k].sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            return by;
          }, [items]);

          const containerRef = useRef<HTMLDivElement | null>(null);

          useEffect(() => {
            if (!selectedSlug) { setSelectedItem(null); setSelectedLocked(false); return; }
            (async () => {
              try {
                const res = await fetch(`/api/roadmap/${encodeURIComponent(selectedSlug)}`);
                if (!res.ok) return;
                const data = await res.json();
                setSelectedItem(data.item || null);
                setSelectedLocked(Boolean(data.locked));
              } catch (e) { /* ignore */ }
            })();
          }, [selectedSlug]);

          return (
            <div ref={containerRef} className="space-y-4">
              {Object.keys(paths).map((pathId) => (
                <div key={pathId} className="flex items-center gap-3 overflow-auto">
                  {paths[pathId].map((it: any) => (
                    <button key={it.slug} onClick={() => setSelectedSlug(it.slug)} className="flex items-center gap-2 p-3 bg-slate-800 rounded">
                      <div className="w-10 h-10 flex items-center justify-center rounded bg-slate-700">{it.icon || '•'}</div>
                      <div className="text-sm">{it.title}</div>
                    </button>
                  ))}
                </div>
              ))}

              {/* Modal */}
              {selectedSlug && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                  <div className="bg-slate-900 border border-amber-400/30 text-white rounded max-w-2xl w-full p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">{selectedItem?.title || selectedSlug}</div>
                        <div className="text-sm text-amber-200">{selectedItem?.summary || ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-amber-200" onClick={() => setSelectedSlug(null)}>Close</button>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-200">
                      {selectedItem ? (
                        selectedLocked ? (
                          <div>
                            <div className="mb-3 text-gray-300">Locked. Preview:</div>
                            <div className="prose max-w-none text-sm text-gray-200"><ReactMarkdown>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>
                            <div className="mt-4 flex gap-2">
                              <a className="bg-amber-500 text-black px-3 py-2 rounded font-semibold" href="/pricing">Upgrade</a>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="prose max-w-none text-sm text-gray-200"><ReactMarkdown>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>
                            <div className="mt-4 flex gap-2">
                              {user ? (
                                purchasedSet.has(`roadmap:${selectedItem.slug}`) ? (
                                  <button className="bg-emerald-500 text-black px-3 py-2 rounded font-semibold" disabled>Owned</button>
                                ) : (
                                  <button
                                    className="bg-amber-500 text-black px-3 py-2 rounded font-semibold"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch('/api/monetization/create-payment', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ packageId: 'roadmap_item', itemId: `roadmap:${selectedItem.slug}` }),
                                        });
                                        const j = await res.json();
                                        if (j?.checkoutUrl) window.location.href = j.checkoutUrl;
                                      } catch (e) { alert('Failed to start purchase'); }
                                    }}
                                  >
                                    Buy this item
                                  </button>
                                )
                              ) : (
                                <a className="bg-amber-500 text-black px-3 py-2 rounded font-semibold" href="/signup">Sign up to purchase</a>
                              )}
                              <button className="border border-amber-400/40 text-amber-200 px-3 py-2 rounded" onClick={() => setShowPractice(true)}>Practice</button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-gray-400">Loading...</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Practice modal rendering GuidedPath */}
              {selectedSlug && showPractice && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                  <div className="bg-slate-900 border border-amber-400/30 text-white rounded max-w-3xl w-full p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-semibold">Practice: {selectedItem?.title || selectedSlug}</div>
                      <button className="text-amber-200" onClick={() => setShowPractice(false)}>Close</button>
                    </div>
                    <div>
                      <GuidedPath
                        id={`roadmap-single-${selectedItem.slug}`}
                        title={selectedItem.title}
                        steps={[{
                          id: selectedItem.slug,
                          title: selectedItem.title,
                          lesson: (selectedItem.content || selectedItem.summary || '').split('\n\n'),
                          taskPrompt: selectedItem.summary || 'Practice this task',
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
                </div>
              )}
            </div>
          );
        }
