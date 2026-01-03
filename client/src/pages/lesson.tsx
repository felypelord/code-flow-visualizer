import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Layout from "@/components/layout";
import { lessons } from "@/lib/lessons";
import { Language } from "@/lib/types";
import CodeEditor from "@/components/code-editor";
import { AdUnit, AD_SLOTS } from "@/components/ad-unit";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronRight, HelpCircle, Info, Layers, Box, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Playground from "@/components/playground";
import Skeleton from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageBadge } from '@/components/language-selector';
import { getLessonResource, buildYouTubeSearchUrl } from "@/lib/lesson-resources";
import { useUser } from "@/hooks/use-user";


export default function LessonPage() {

  const [match, params] = useRoute("/lesson/:id");
  const lessonId = params?.id || "functions";
  const lesson = lessons[lessonId];
  const isMobile = useIsMobile();
  
  const { progLang, setProgLang } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [view, setView] = useState<"lesson" | "playground">("lesson");

  // Get current variant based on global language selector, fallback to javascript if not found
  const variant = lesson?.variants[progLang] || lesson?.variants['javascript'];
  
  const currentStep = variant?.steps[currentStepIndex] || variant?.steps[0];
  const totalSteps = variant?.steps.length || 0;

  // Auto-play effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, speed]);

  // Reset when lesson or language changes
  useEffect(() => {
    // try to restore saved progress for this lesson+language
    const saved = localStorage.getItem(`progress:${lessonId}:${progLang}`);
    setCurrentStepIndex(saved ? parseInt(saved, 10) : 0);
    setIsPlaying(false);
  }, [lessonId, progLang]);

  // Adaptive: restore preferred playback speed for this lesson+language
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`adaptive-speed:${lessonId}:${progLang}`);
      const v = Number(raw);
      if (Number.isFinite(v) && v >= 500 && v <= 3000) {
        setSpeed(v);
      }
    } catch {
      // ignore
    }
  }, [lessonId, progLang]);

  if (!lesson || !variant || !currentStep) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-2xl text-muted-foreground">Lesson not found</h1>
        </div>
      </Layout>
    );
  }

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    // clear saved progress
    localStorage.removeItem(`progress:${lessonId}:${progLang}`);
  };

  // persist progress
  useEffect(() => {
    localStorage.setItem(`progress:${lessonId}:${progLang}`, String(currentStepIndex));
    // if logged in, sync to server
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ lessonId, language: progLang, index: currentStepIndex }) }).catch(() => {});
    }
  }, [currentStepIndex, lessonId, progLang]);

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const lessonResource = getLessonResource(lessonId);

  const estimatedMinutes = typeof lesson.estimatedMinutes === 'number' ? lesson.estimatedMinutes : null;
  const prerequisites = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
  const outcomes = Array.isArray(lesson.outcomes) ? lesson.outcomes : [];
  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];

  // Render content based on device type
  const renderContent = () => {
    if (view === "playground") {
      return (
        <div className="h-full">
          <Playground variant={variant} lessonId={lessonId} />
        </div>
      );
    }
    if (isMobile) {
      return (
        <div className="flex flex-col h-full overflow-y-auto pb-20">
          <div className="h-[400px] shrink-0 p-2 relative">
            <CodeEditor code={variant.code} activeLine={currentStep.line} />
            
             {/* Start Overlay Mobile */}
            {currentStepIndex === 0 && !isPlaying && (
              <div className="absolute inset-2 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-lg pointer-events-auto">
                <Button 
                  size="lg" 
                  onClick={() => setIsPlaying(true)}
                  aria-label="Start playback"
                  className="gap-2 text-lg font-bold shadow-xl scale-110 hover:scale-125 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="w-6 h-6 fill-current" /> Start
                </Button>
              </div>
            )}
          </div>
          
          <div className="p-2 shrink-0">
             <div className="bg-card/50 border border-white/10 rounded-lg p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <ChevronRight className="w-3 h-3" /> Explanation
              </h3>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={`${progLang}-${currentStepIndex}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm leading-relaxed font-light"
                >
                  {currentStep.explanation}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-2">
             <div className="h-[300px] bg-[#0d1220]/50 border border-white/5 rounded-lg">
                <CallStack stack={currentStep.stack} />
             </div>
             <div className="h-[300px] bg-[#0d1220]/50 border border-white/5 rounded-lg">
                <HeapMemory heap={currentStep.heap} />
             </div>
          </div>
        </div>
      );
    }

    return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full p-4 flex flex-col gap-4">
            <CodeEditor code={variant.code} activeLine={currentStep.line} />
            
            {/* Start Overlay */}
            {currentStepIndex === 0 && !isPlaying && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-lg">
                <Button 
                  size="lg" 
                  onClick={() => setIsPlaying(true)}
                  aria-label="Start playback"
                  className="gap-2 text-lg font-bold shadow-xl scale-110 hover:scale-125 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="w-6 h-6 fill-current" /> Start
                </Button>
              </div>
            )}
            
            <div className="bg-card/50 border border-white/10 rounded-lg p-4 flex-1 overflow-auto min-h-[100px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <ChevronRight className="w-3 h-3" /> Explanation
              </h3>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${progLang}-${currentStepIndex}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {currentStep.explanation ? (
                    <p className="text-lg leading-relaxed font-light">{currentStep.explanation}</p>
                  ) : (
                    <Skeleton className="h-6 w-full rounded-md" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5" />

        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full p-4 bg-[#0d1220]/50 border-b border-white/5">
                <CallStack stack={currentStep.stack} />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/5" />

            <ResizablePanel defaultSize={50} minSize={20}>
               <div className="h-full p-4 bg-[#0d1220]/50">
                <HeapMemory heap={currentStep.heap} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Toolbar */}
        <div className="h-auto md:h-16 border-b border-white/10 bg-card/30 flex flex-col md:flex-row items-center px-4 py-2 md:py-0 justify-between shrink-0 gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full md:w-auto">
             <h2 className="font-bold text-lg whitespace-nowrap hidden md:block">{lesson.title}</h2>
             

             {/* Language indicator (display-only) */}
             <div className="hidden md:block">
               <LanguageBadge />
             </div>

             <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-muted-foreground whitespace-nowrap">
               Step {currentStepIndex + 1}/{totalSteps}
             </span>

             <div className="ml-auto md:ml-0">
               <div className="flex items-center gap-2">
                 <ResourcesDialog
                   title={lessonResource.title}
                   youtubeSearchQuery={lessonResource.youtubeSearchQuery}
                   videos={lessonResource.videos}
                    visuals={lessonResource.visuals}
                   docs={lessonResource.docs || []}
                 />
                 <LessonInfoDialog
                   title={lesson.title}
                   difficulty={lesson.difficulty}
                   estimatedMinutes={estimatedMinutes}
                   prerequisites={prerequisites}
                   outcomes={outcomes}
                 />
                 {quiz.length > 0 && (
                   <QuizDialog
                     questions={quiz}
                     onReview={() => {
                       setView('lesson');
                       handleReset();
                     }}
                     onExtraPractice={() => {
                       setIsPlaying(false);
                       setView('playground');
                     }}
                     onAdaptiveSlowdown={() => {
                       setSpeed((prev) => {
                         const next = Math.max(prev, 2200);
                         try {
                           localStorage.setItem(`adaptive-speed:${lessonId}:${progLang}`, String(next));
                         } catch {}
                         return next;
                       });
                     }}
                     onStruggle={(wrong) => {
                       try {
                         const key = `adaptive-struggle:${lessonId}:${progLang}`;
                         const cur = Number(localStorage.getItem(key) || '0') || 0;
                         localStorage.setItem(key, String(cur + Math.max(1, wrong)));
                       } catch {}
                     }}
                   />
                 )}
                 <CommunityDialog lessonId={lessonId} lessonTitle={lesson.title} />
                 <HelpDialog />
               </div>
             </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-center pb-2 md:pb-0">
            <div className="flex items-center gap-2 mr-2">
              <button onClick={() => setView('lesson')} className={`px-3 py-1 rounded ${view === 'lesson' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground'}`}>Lesson</button>
              <button onClick={() => setView('playground')} className={`px-3 py-1 rounded ${view === 'playground' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground'}`}>Playground</button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Restart" className="h-8 w-8">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentStepIndex === 0} className="h-8 w-8">
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              size="icon" 
              className={isPlaying ? "bg-amber-500 hover:bg-amber-600 h-8 w-8" : "bg-primary hover:bg-primary/90 h-8 w-8"}
              title={isPlaying ? "Pause" : "Play"}
              onClick={() => {
                if (currentStepIndex >= totalSteps - 1) {
                  setCurrentStepIndex(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black ml-0.5" />}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentStepIndex === totalSteps - 1} className="h-8 w-8">
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="w-24 ml-2 hidden md:block">
               <Slider 
                 value={[3000 - speed]} 
                 min={500} 
                 max={2500} 
                 step={100} 
                 onValueChange={(v) => setSpeed(3000 - v[0])} 
               />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
           {renderContent()}
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-white/5 w-full shrink-0 sticky bottom-0">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </Layout>
  );
}

function LessonInfoDialog({
  title,
  difficulty,
  estimatedMinutes,
  prerequisites,
  outcomes,
}: {
  title: string;
  difficulty: string;
  estimatedMinutes: number | null;
  prerequisites: string[];
  outcomes: string[];
}) {
  const hasAny = Boolean(estimatedMinutes) || prerequisites.length > 0 || outcomes.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Info className="w-4 h-4" />
          <span className="hidden md:inline">Lesson info</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {difficulty}{estimatedMinutes ? ` • ~${estimatedMinutes} min` : ''}
          </DialogDescription>
        </DialogHeader>

        {!hasAny ? (
          <div className="text-sm text-gray-300">No metadata available for this lesson.</div>
        ) : (
          <div className="space-y-4 mt-2">
            {prerequisites.length > 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm font-semibold text-white mb-2">Prerequisites</div>
                <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                  {prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {outcomes.length > 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-sm font-semibold text-white mb-2">What you'll learn</div>
                <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                  {outcomes.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuizDialog({
  questions,
  onReview,
  onExtraPractice,
  onAdaptiveSlowdown,
  onStruggle,
}: {
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  onReview: () => void;
  onExtraPractice?: () => void;
  onAdaptiveSlowdown?: () => void;
  onStruggle?: (wrongCount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongCount, setWrongCount] = useState(0);

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;

  const resetQuizState = () => {
    setQIndex(0);
    setSelected(null);
    setIsCorrect(null);
    setWrongCount(0);
  };

  const closeQuiz = () => {
    setOpen(false);
    resetQuizState();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetQuizState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">Quiz</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>Quick quiz</DialogTitle>
          <DialogDescription>
            Question {qIndex + 1} of {questions.length}
          </DialogDescription>
        </DialogHeader>

        {!q ? (
          <div className="text-sm text-gray-300">No quiz questions configured.</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-white font-semibold">{q.prompt}</div>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const chosen = selected === idx;
                const showState = selected !== null;
                const isRight = idx === q.correctIndex;

                const base = 'w-full justify-start text-left';
                const variant = !showState
                  ? 'outline'
                  : chosen
                    ? isRight
                      ? 'default'
                      : 'destructive'
                    : isRight
                      ? 'secondary'
                      : 'outline';

                return (
                  <Button
                    key={idx}
                    variant={variant as any}
                    className={base}
                    disabled={selected !== null}
                    onClick={() => {
                      setSelected(idx);
                      const ok = idx === q.correctIndex;
                      setIsCorrect(ok);
                      if (!ok) setWrongCount((c) => c + 1);
                    }}
                  >
                    {opt}
                  </Button>
                );
              })}
            </div>

            {selected !== null && (
              <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className={`text-sm font-semibold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </div>
                <div className="mt-2 text-sm text-gray-200">{q.explanation}</div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" onClick={closeQuiz}>Close</Button>

              <div className="flex gap-2">
                {selected !== null && !isLast && (
                  <Button
                    onClick={() => {
                      setQIndex((i) => Math.min(i + 1, questions.length - 1));
                      setSelected(null);
                      setIsCorrect(null);
                    }}
                  >
                    Next
                  </Button>
                )}

                {selected !== null && isLast && (
                  <Button
                    onClick={() => {
                      // keep dialog open; show summary-like action via state
                      // If user got anything wrong, suggest review.
                      if (wrongCount > 0) {
                        onStruggle?.(wrongCount);
                        onAdaptiveSlowdown?.();
                        onReview();
                      }
                      closeQuiz();
                    }}
                  >
                    {wrongCount > 0 ? 'Review lesson' : 'Finish'}
                  </Button>
                )}
              </div>
            </div>

            {selected !== null && isLast && wrongCount > 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-gray-200 font-semibold">Adaptive suggestion</div>
                <div className="mt-1 text-xs text-gray-400">Try extra practice and slow down playback for better understanding.</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onStruggle?.(wrongCount);
                      onAdaptiveSlowdown?.();
                    }}
                  >
                    Slow down playback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onStruggle?.(wrongCount);
                      onExtraPractice?.();
                      closeQuiz();
                    }}
                  >
                    Extra practice
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResourcesDialog({
  title,
  youtubeSearchQuery,
  videos,
  visuals,
  docs,
}: {
  title: string;
  youtubeSearchQuery?: string;
  videos?: Array<{ title: string; url: string }>;
  visuals?:
    | Array<
        | {
            kind: 'diagram';
            title: string;
            diagramId: 'call-stack' | 'stack-vs-heap' | 'event-loop';
            description?: string;
          }
        | {
            kind: 'beforeAfter';
            title: string;
            description?: string;
            beforeCode: string;
            afterCode: string;
          }
      >
    | undefined;
  docs: Array<{ label: string; url: string }>;
}) {
  const youtubeUrl = youtubeSearchQuery ? buildYouTubeSearchUrl(youtubeSearchQuery) : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Info className="w-4 h-4" />
          <span className="hidden md:inline">Resources</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>Resources: {title}</DialogTitle>
          <DialogDescription>
            Quick links to study before/after the exercise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold text-white mb-2">Videos (YouTube)</div>
            {videos && videos.length > 0 ? (
              <div className="space-y-2">
                {videos.map((v) => (
                  <div key={v.url}>
                    <a className="text-sm text-amber-200 underline" href={v.url} target="_blank" rel="noreferrer">
                      {v.title}
                    </a>
                  </div>
                ))}
              </div>
            ) : youtubeUrl ? (
              <a className="text-sm text-amber-200 underline" href={youtubeUrl} target="_blank" rel="noreferrer">
                Search on YouTube: “{youtubeSearchQuery}”
              </a>
            ) : (
              <div className="text-sm text-gray-400">No recommendations configured.</div>
            )}

            {youtubeUrl && (!videos || videos.length === 0) && (
              <div className="mt-2 text-xs text-gray-400">Tip: you can change the search to a specific channel/playlist.</div>
            )}
          </div>

          {visuals && visuals.length > 0 && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm font-semibold text-white mb-2">Visual Explanations</div>
              <div className="space-y-4">
                {visuals.map((v: any) => (
                  <div key={v.title} className="p-3 rounded bg-black/20 border border-white/10">
                    <div className="text-sm text-white font-semibold">{v.title}</div>
                    {v.description && <div className="mt-1 text-xs text-gray-400">{v.description}</div>}

                    {v.kind === 'diagram' && (
                      <div className="mt-3">
                        <VisualDiagram diagramId={v.diagramId} />
                      </div>
                    )}

                    {v.kind === 'beforeAfter' && (
                      <div className="mt-3 grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Before</div>
                          <pre className="text-xs bg-slate-900/60 border border-white/10 rounded p-2 overflow-auto"><code>{v.beforeCode}</code></pre>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">After</div>
                          <pre className="text-xs bg-slate-900/60 border border-white/10 rounded p-2 overflow-auto"><code>{v.afterCode}</code></pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold text-white mb-2">Documentation</div>
            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map((d) => (
                  <div key={d.url}>
                    <a className="text-sm text-blue-200 underline" href={d.url} target="_blank" rel="noreferrer">
                      {d.label}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No links configured.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VisualDiagram({ diagramId }: { diagramId: 'call-stack' | 'stack-vs-heap' | 'event-loop' }) {
  if (diagramId === 'call-stack') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded border border-white/10 bg-slate-900/40">
          <div className="text-xs text-gray-400">Call Stack (top)</div>
          <div className="mt-2 space-y-2">
            <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">add(a, b)</div>
            <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">main()</div>
            <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">Global</div>
          </div>
        </div>
        <div className="p-2 rounded border border-white/10 bg-slate-900/40">
          <div className="text-xs text-gray-400">Key idea</div>
          <div className="mt-2 text-xs text-gray-200">
            Calls push frames; returns pop frames. The “top” frame is currently executing.
          </div>
        </div>
      </div>
    );
  }

  if (diagramId === 'stack-vs-heap') {
    return (
      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-2 rounded border border-white/10 bg-slate-900/40">
          <div className="text-xs text-gray-400">Stack</div>
          <div className="mt-2 p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">u1 → REF: obj1</div>
          <div className="mt-2 p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">u2 → REF: obj1</div>
        </div>
        <div className="p-2 rounded border border-white/10 bg-slate-900/40">
          <div className="text-xs text-gray-400">Heap</div>
          <div className="mt-2 p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">
            obj1 = {'{'} name: 'Ana', admin: false {'}'}
          </div>
          <div className="mt-2 text-xs text-gray-400">Both refs can point to the same object.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="p-2 rounded border border-white/10 bg-slate-900/40">
        <div className="text-xs text-gray-400">After code runs…</div>
        <div className="mt-2 space-y-2">
          <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">Call stack empties</div>
          <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">Microtasks (Promises)</div>
          <div className="p-2 rounded bg-white/5 border border-white/10 text-xs text-gray-200">Macrotasks (setTimeout)</div>
        </div>
      </div>
      <div className="p-2 rounded border border-white/10 bg-slate-900/40">
        <div className="text-xs text-gray-400">Rule of thumb</div>
        <div className="mt-2 text-xs text-gray-200">
          Promises run before timers once the current stack finishes.
        </div>
      </div>
    </div>
  );
}

type ForumAnswer = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  isMentor?: boolean;
  helpfulBy?: string[];
};

type ForumThread = {
  id: string;
  question: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  answers: ForumAnswer[];
};

function CommunityDialog({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authed = Boolean(token && user?.id);
  const isMentor = Boolean(user?.isAdmin || user?.isPro);

  const displayName = (() => {
    const fn = (user?.firstName || '').trim();
    const ln = (user?.lastName || '').trim();
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    const email = (user?.email || '').trim();
    if (email && email.includes('@')) return email.split('@')[0] || 'User';
    return 'User';
  })();

  const storageKey = `lesson-forum:${lessonId}`;

  const readThreads = (): ForumThread[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ForumThread[]) : [];
    } catch {
      return [];
    }
  };

  const writeThreads = (next: ForumThread[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
    setThreads(next);
  };

  const pointsKey = (uid: string) => `help-points:${uid}`;
  const getPoints = (uid: string) => {
    try {
      return Number(localStorage.getItem(pointsKey(uid)) || '0') || 0;
    } catch {
      return 0;
    }
  };

  const addPoints = (uid: string, delta: number) => {
    try {
      const cur = getPoints(uid);
      localStorage.setItem(pointsKey(uid), String(cur + delta));
    } catch {
      // ignore
    }
  };

  const myPoints = user?.id ? getPoints(user.id) : 0;

  const makeId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  useEffect(() => {
    if (!open) return;
    setThreads(readThreads());
  }, [open, lessonId]);

  const submitQuestion = () => {
    const text = newQuestion.trim();
    if (!text || !authed || !user?.id) return;
    const next: ForumThread[] = [
      {
        id: makeId(),
        question: text,
        createdAt: new Date().toISOString(),
        authorId: user.id,
        authorName: displayName,
        answers: [],
      },
      ...readThreads(),
    ];
    writeThreads(next);
    setNewQuestion('');
  };

  const submitReply = (threadId: string) => {
    const body = (replyDraft[threadId] || '').trim();
    if (!body || !authed || !user?.id) return;
    const cur = readThreads();
    const next = cur.map((t) => {
      if (t.id !== threadId) return t;
      const answer: ForumAnswer = {
        id: makeId(),
        body,
        createdAt: new Date().toISOString(),
        authorId: user.id,
        authorName: displayName,
        isMentor,
        helpfulBy: [],
      };
      return { ...t, answers: [...(t.answers || []), answer] };
    });
    writeThreads(next);
    setReplyDraft((prev) => ({ ...prev, [threadId]: '' }));
  };

  const markHelpful = (threadId: string, answerId: string) => {
    if (!authed || !user?.id) return;
    const cur = readThreads();
    const thread = cur.find((t) => t.id === threadId);
    if (!thread) return;
    if (thread.authorId !== user.id) return; // only the asker can award points

    const next = cur.map((t) => {
      if (t.id !== threadId) return t;
      const answers = (t.answers || []).map((a) => {
        if (a.id !== answerId) return a;
        if (a.authorId === user.id) return a;
        const helpfulBy = Array.isArray(a.helpfulBy) ? a.helpfulBy : [];
        if (helpfulBy.includes(user.id)) return a;
        if (a.authorId) addPoints(a.authorId, 1);
        return { ...a, helpfulBy: [...helpfulBy, user.id] };
      });
      return { ...t, answers };
    });

    writeThreads(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <MessagesSquare className="w-4 h-4" />
          <span className="hidden md:inline">Community</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>Community: {lessonTitle}</DialogTitle>
          <DialogDescription>
            Per-lesson forum for questions and answers. Mentors (Pro/Admin) are labeled.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-400">Your help points: <span className="text-gray-200 font-semibold">{myPoints}</span></div>
          {!authed && <div className="text-xs text-gray-400">Sign in to post questions or replies.</div>}
        </div>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto pr-1">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold text-white">Ask a question</div>
            <textarea
              className="mt-2 w-full rounded bg-black/20 border border-white/10 text-sm text-gray-200 p-2"
              rows={3}
              placeholder={authed ? 'Describe your doubt…' : 'Sign in to ask a question…'}
              value={newQuestion}
              disabled={!authed}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <Button onClick={submitQuestion} disabled={!authed || newQuestion.trim().length === 0}>
                Post
              </Button>
            </div>
          </div>

          {threads.length === 0 ? (
            <div className="text-sm text-gray-400">No questions yet. Be the first to ask.</div>
          ) : (
            <div className="space-y-3">
              {threads.map((t) => {
                const canAward = authed && user?.id && t.authorId === user.id;
                return (
                  <div key={t.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-white font-semibold">{t.question}</div>
                        <div className="mt-1 text-xs text-gray-400">by {t.authorName} • {new Date(t.createdAt).toISOString().slice(0, 10)}</div>
                      </div>
                      {canAward ? (
                        <div className="text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">You can award points</div>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      {(t.answers || []).length === 0 ? (
                        <div className="text-xs text-gray-400">No replies yet.</div>
                      ) : (
                        (t.answers || []).map((a) => {
                          const wasHelpful = Array.isArray(a.helpfulBy) && user?.id ? a.helpfulBy.includes(user.id) : false;
                          const anyHelpful = Array.isArray(a.helpfulBy) && a.helpfulBy.length > 0;
                          return (
                            <div key={a.id} className="p-2 rounded bg-black/20 border border-white/10">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-gray-400">
                                  <span className="text-gray-200">{a.authorName}</span>
                                  {a.isMentor ? <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">Mentor</span> : null}
                                  {anyHelpful ? <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200">Helpful</span> : null}
                                </div>
                                {canAward && a.authorId !== user?.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={wasHelpful}
                                    onClick={() => markHelpful(t.id, a.id)}
                                  >
                                    {wasHelpful ? 'Awarded' : 'Mark helpful (+1)'}
                                  </Button>
                                )}
                              </div>
                              <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{a.body}</div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-3">
                      <textarea
                        className="w-full rounded bg-black/20 border border-white/10 text-sm text-gray-200 p-2"
                        rows={2}
                        placeholder={authed ? (isMentor ? 'Reply as mentor…' : 'Write a reply…') : 'Sign in to reply…'}
                        value={replyDraft[t.id] || ''}
                        disabled={!authed}
                        onChange={(e) => setReplyDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button onClick={() => submitReply(t.id)} disabled={!authed || (replyDraft[t.id] || '').trim().length === 0}>
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HelpDialog() {

  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">Legend</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>How to use</DialogTitle>
          <DialogDescription>Understand the areas below</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex gap-3 items-start p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="p-2 bg-blue-500 rounded-md shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-blue-400 text-sm">Call Stack</h4>
              <p className="text-xs text-gray-400 mt-1">
                The call stack shows the order of function calls.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="p-2 bg-emerald-500 rounded-md shrink-0">
              <Box className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-400 text-sm">Heap Memory</h4>
              <p className="text-xs text-gray-400 mt-1">
                The heap memory shows objects and variables in memory.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/10">
             <div className="p-2 bg-white/10 rounded-md shrink-0">
              <Play className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Controls</h4>
              <p className="text-xs text-gray-400 mt-1">
                Controls Desc
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
