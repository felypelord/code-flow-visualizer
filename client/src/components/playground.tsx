import React, { useEffect, useState, useRef } from "react";
import CodeEditor from "@/components/code-editor";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";
import { exercises } from '@/lib/exercises-new';
import { runInWorker } from '@/lib/sandbox';


export default function Playground({ variant, lessonId }: { variant: any; lessonId?: string }) {

  const steps = variant?.steps || [];
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // velocidade em ms
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setIndex((i) => {
          if (i >= steps.length - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isPlaying, steps.length, speed]);

  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
  }, [variant]);

  const step = steps[index] || { line: undefined, stack: [], heap: [], explanation: "" };

  // Practice state (if exercise exists for this lesson)
  let matchedExercise = lessonId ? exercises.find(e => e.id === lessonId) : undefined;
  // fallback: try heuristic match by tokens in lessonId/title to exercise id/title
  if (!matchedExercise && lessonId) {
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    const lessonTokens = norm(lessonId).split(' ').filter(Boolean);
    let best: any = null;
    let bestScore = 0;
    for (const e of exercises) {
      const hay = norm((e.id || '') + ' ' + (e.title || ''));
      let score = 0;
      for (const t of lessonTokens) if (hay.includes(t)) score++;
      if (score > bestScore) { best = e; bestScore = score; }
    }
    if (bestScore > 0) {
      matchedExercise = best;
      try { console.log('Playground matched exercise by heuristic', { lessonId, matched: matchedExercise?.id, score: bestScore }); } catch(e){}
    }
  }
  const exerciseVariant = matchedExercise ? (matchedExercise.variants as any)["javascript"] || Object.values(matchedExercise.variants || {})[0] : undefined;
  const [practiceCode, setPracticeCode] = useState<string>(exerciseVariant?.initialCode || variant?.code || "");
  const [activeLine, setActiveLine] = useState<number | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<any>({ stack: [], heap: [], vars: {} });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          <div className="h-full">
            {/* Seletor de velocidade tipo slider de volume */}
            <div className="flex items-center gap-3 mb-3" style={{maxWidth: 260}}>
              <span className="text-xs text-muted-foreground" style={{minWidth: 60}}>Speed</span>
              <Slider
                min={100}
                max={3000}
                step={100}
                value={[speed]}
                onValueChange={([val]) => setSpeed(val)}
                className="w-40"
                aria-label="Execution speed"
              />
              <span className="text-xs text-muted-foreground ml-2" style={{minWidth: 40, textAlign: 'right'}}>{speed} ms</span>
            </div>
            {/* If there's a matched exercise, show editable practice code, otherwise show lesson code */}
            {matchedExercise ? (
              <CodeEditor code={practiceCode} activeLine={activeLine ?? step.line} editable onChange={setPracticeCode} errorLine={validationResult?.errorLine ?? null} />
            ) : (
              <CodeEditor code={variant?.code || ""} activeLine={step.line} />
            )}
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="bg-card/50 border border-white/10 rounded-lg p-4 flex-1 overflow-auto">
              <h3 className="text-sm font-bold mb-2">Explanation</h3>
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm leading-relaxed">{step.explanation}</p>
              </motion.div>
            </div>

            <div className="h-48 bg-[#0d1220]/50 border border-white/5 rounded-lg p-3 overflow-auto">
              <CallStack stack={step.stack} />
            </div>

            <div className="h-48 bg-[#0d1220]/50 border border-white/5 rounded-lg p-3 overflow-auto">
              <HeapMemory heap={step.heap} />
            </div>
          </div>
        </div>
      </div>

      {/* Practice controls */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setIndex(0); setIsPlaying(false); }} aria-label="Go to start">
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous Step">
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button size="icon" onClick={() => setIsPlaying((p) => !p)} aria-pressed={isPlaying} aria-label={isPlaying ? "Pause" : "Run"}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} aria-label="Next Step">
          <SkipForward className="w-4 h-4" />
        </Button>

        <div className="ml-auto text-xs text-muted-foreground">Step {index + 1}/{steps.length}</div>
      </div>

      {matchedExercise && (
        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { setActiveLine(undefined); setValidationResult(null); setValidating(false); setPracticeCode(exerciseVariant?.initialCode || variant?.code || ''); }}>Reset</Button>
            <Button onClick={async () => {
              // Run checks using runInWorker
              setValidating(true);
              setValidationResult(null);
              setActiveLine(undefined);
              const ex = matchedExercise as any;
              for (const t of ex.tests) {
                let lastLine: number | null = null;
                try {
                  const res = await runInWorker(practiceCode, (function getFnName(){
                    const m = (practiceCode||'').match(/function\s+(\w+)\s*\(/);
                    return m ? m[1] : '__cf_main';
                  })(), t.input || [], { timeoutMs: 5000, onStep: (line:number)=>{ lastLine = line; setActiveLine(line); }, onSnapshot: (s:any)=>{ setSnapshot(s); } });
                  const ok = JSON.stringify(res) === JSON.stringify(t.expected);
                  if (!ok) {
                    setValidationResult({ ok: false, message: `Test failed: ${t.name}`, expected: t.expected, actual: res, errorLine: lastLine });
                    setActiveLine(lastLine ?? undefined);
                    setValidating(false);
                    return;
                  }
                } catch (err:any) {
                  const msg = err && err.message ? String(err.message) : String(err);
                  setValidationResult({ ok: false, message: `Runtime error: ${msg}`, errorLine: lastLine });
                  setActiveLine(lastLine ?? undefined);
                  setValidating(false);
                  return;
                }
              }
              setValidationResult({ ok: true, message: 'All tests passed' });
              setValidating(false);
            }} className="bg-primary text-black">{validating ? 'Checking...' : 'Check'}</Button>
          </div>
          <div className="ml-auto text-sm">
            {validationResult ? (validationResult.ok ? <span className="text-emerald-400">{validationResult.message}</span> : <span className="text-red-400">{validationResult.message}</span>) : null}
          </div>
        </div>
      )}
    </div>
  );
}
