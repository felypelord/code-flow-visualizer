import React, { useEffect, useState, useRef } from "react";
import CodeEditor from "@/components/code-editor";
import CallStack from "@/components/visualizer/call-stack";
import HeapMemory from "@/components/visualizer/heap-memory";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";

export default function Playground({ variant }: { variant: any }) {
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          <div className="h-full">
            {/* Seletor de velocidade tipo slider de volume */}
            <div className="flex items-center gap-3 mb-3" style={{maxWidth: 260}}>
              <span className="text-xs text-muted-foreground" style={{minWidth: 60}}>Velocidade</span>
              <Slider
                min={100}
                max={3000}
                step={100}
                value={[speed]}
                onValueChange={([val]) => setSpeed(val)}
                className="w-40"
                aria-label="Velocidade de execução"
              />
              <span className="text-xs text-muted-foreground ml-2" style={{minWidth: 40, textAlign: 'right'}}>{speed} ms</span>
            </div>
            <CodeEditor code={variant?.code || ""} activeLine={step.line} />
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="bg-card/50 border border-white/10 rounded-lg p-4 flex-1 overflow-auto">
              <h3 className="text-sm font-bold mb-2">Explicação</h3>
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

      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setIndex(0); setIsPlaying(false); }} aria-label="Ir para início">
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Passo anterior">
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button size="icon" onClick={() => setIsPlaying((p) => !p)} aria-pressed={isPlaying} aria-label={isPlaying ? "Pausar" : "Executar"}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} aria-label="Próximo passo">
          <SkipForward className="w-4 h-4" />
        </Button>

        <div className="ml-auto text-xs text-muted-foreground">Passo {index + 1}/{steps.length}</div>
      </div>
    </div>
  );
}
