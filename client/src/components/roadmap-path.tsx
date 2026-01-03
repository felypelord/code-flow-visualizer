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
  quiz?: {
    title?: string;
    questions: Array<{
      id: string;
      prompt: string;
      options: string[];
      answerIndex: number;
      explanation?: string;
    }>;
  };
};

type QuizProgress = {
  selections: Record<string, number>;
  passed?: boolean;
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
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);

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

  useEffect(() => {
    if (!selectedItem?.slug) {
      setQuizProgress(null);
      return;
    }

    const quiz = selectedItem.quiz;
    if (!quiz?.questions?.length) {
      setQuizProgress(null);
      return;
    }

    const key = `roadmap-quiz:${selectedItem.slug}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.selections && typeof parsed.selections === 'object') {
          setQuizProgress({ selections: parsed.selections as Record<string, number>, passed: Boolean(parsed.passed) });
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    const initialSelections: Record<string, number> = {};
    for (const q of quiz.questions) initialSelections[q.id] = -1;
    setQuizProgress({ selections: initialSelections, passed: false });
  }, [selectedItem?.slug]);

  useEffect(() => {
    if (!selectedItem?.slug || !quizProgress) return;
    const quiz = selectedItem.quiz;
    if (!quiz?.questions?.length) return;

    const allAnswered = quiz.questions.every((q) => typeof quizProgress.selections[q.id] === 'number' && quizProgress.selections[q.id] >= 0);
    const allCorrect = allAnswered && quiz.questions.every((q) => quizProgress.selections[q.id] === q.answerIndex);

    if (allCorrect && !quizProgress.passed) {
      const next = { ...quizProgress, passed: true };
      setQuizProgress(next);
      try {
        localStorage.setItem(`roadmap-quiz:${selectedItem.slug}`, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
    }
  }, [quizProgress, selectedItem?.slug, selectedItem?.quiz]);

  async function startPurchase(itemId: string) {
    try {
      // Redirect to centralized pricing/store page for this roadmap item
      const url = new URL(window.location.origin + '/pricing');
      url.searchParams.set('product', itemId);
      url.searchParams.set('returnTo', window.location.pathname + window.location.search);
      window.location.href = url.toString();
    } catch (e) { alert('Failed to start purchase'); }
  }

  function setQuizAnswer(questionId: string, optionIndex: number) {
    if (!selectedItem?.slug || !quizProgress) return;
    const next: QuizProgress = {
      ...quizProgress,
      selections: { ...quizProgress.selections, [questionId]: optionIndex },
    };
    setQuizProgress(next);
    try {
      localStorage.setItem(`roadmap-quiz:${selectedItem.slug}`, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
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
                  <div className="mb-3">Pro content — locked.</div>
                  <div className="mb-4"><ReactMarkdown skipHtml>{selectedItem.contentPreview || selectedItem.summary || ''}</ReactMarkdown></div>
                  <div className="flex gap-2">
                    <button className="bg-amber-500 text-black px-3 py-2 rounded" onClick={() => startPurchase(`roadmap:${selectedItem.slug}`)}>Buy Pro</button>
                    <a className="px-3 py-2 border rounded" href="/signup">Create account</a>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="prose max-w-none"><ReactMarkdown skipHtml>{selectedItem.content || selectedItem.summary || ''}</ReactMarkdown></div>

                  {selectedItem.quiz?.questions?.length ? (
                    <div className="mt-6 not-prose border border-slate-700 rounded p-4 bg-slate-950">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{selectedItem.quiz.title || 'Quiz'}</div>
                        {quizProgress?.passed ? (
                          <div className="text-xs px-2 py-1 rounded bg-emerald-600 text-black">Completed</div>
                        ) : (
                          <div className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-100">Pending</div>
                        )}
                      </div>

                      <div className="mt-4 space-y-4">
                        {selectedItem.quiz.questions.map((q, idx) => {
                          const selected = quizProgress?.selections?.[q.id] ?? -1;
                          const answered = selected >= 0;
                          const correct = answered && selected === q.answerIndex;

                          return (
                            <div key={q.id} className="rounded border border-slate-800 p-3">
                              <div className="text-sm font-medium">{idx + 1}. {q.prompt}</div>
                              <div className="mt-2 grid gap-2">
                                {q.options.map((opt, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`quiz-${selectedItem.slug}-${q.id}`}
                                      checked={selected === optIdx}
                                      onChange={() => setQuizAnswer(q.id, optIdx)}
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>

                              {answered ? (
                                <div className={`mt-2 text-xs ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                                  {correct ? 'Correct.' : 'Incorrect.'}{q.explanation ? ` ${q.explanation}` : ''}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <button className="bg-emerald-500 text-black px-3 py-2 rounded" onClick={() => setShowPractice(true)}>Practice</button>
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
                taskPrompt: selectedItem.summary || 'Implement this exercise',
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
