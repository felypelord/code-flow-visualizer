import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Layout from "@/components/layout";
import { lessons } from "@/lib/lessons";
import { Language } from "@/lib/types";
import CodeEditor from "@/components/code-editor";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronRight, HelpCircle, Info, Layers, Box } from "lucide-react";
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
               <HelpDialog />
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
