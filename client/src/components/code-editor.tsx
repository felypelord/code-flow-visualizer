import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  activeLine: number; // 1-indexed
  editable?: boolean;
  onChange?: (code: string) => void;
  errorLine?: number | null;
}

export default function CodeEditor({ code, activeLine, editable, onChange, errorLine }: CodeEditorProps) {
  const lines = code.split("\n");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [overlayTop, setOverlayTop] = useState<number | null>(null);
  const [measuredLineHeight, setMeasuredLineHeight] = useState<number>(18);
  useEffect(() => {
    if (!editable || typeof errorLine !== "number" || !textareaRef.current) return;
    const target = Math.max(1, Math.min(errorLine, lines.length));
    // compute character index for start of target line
    let pos = 0;
    for (let i = 0; i < target - 1; i++) {
      pos += lines[i].length + 1; // include newline
    }
    const ta = textareaRef.current;
    try {
      ta.focus();
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    } catch (e) {
      // ignore if selection not supported
    }
    // ensure caret is visible in textarea (some browsers scroll to caret on focus)
    setTimeout(() => {
      if (!ta) return;
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || "18");
      setMeasuredLineHeight(lineHeight || 18);
      const top = Math.max(0, (target - 1) * lineHeight - ta.clientHeight / 2);
      ta.scrollTop = top;
      setOverlayTop(Math.max(0, (target - 1) * lineHeight - ta.scrollTop));
    }, 20);
  }, [errorLine, editable, code]);

  // keep overlay position in sync with scrolling and changes
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const update = () => {
      if (typeof errorLine !== 'number') {
        setOverlayTop(null);
        return;
      }
      const target = Math.max(1, Math.min(errorLine, lines.length));
      const lh = parseFloat(getComputedStyle(ta).lineHeight || String(measuredLineHeight)) || measuredLineHeight;
      setMeasuredLineHeight(lh);
      setOverlayTop((target - 1) * lh - ta.scrollTop);
    };
    ta.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      ta.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [errorLine, code, measuredLineHeight]);

  return (
    <div className="code-editor bg-[#0a0f1e] rounded-lg border border-white/10 overflow-hidden shadow-2xl font-mono text-sm h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <span className="ml-2 text-xs text-muted-foreground">script.js</span>
      </div>
      
      <div className="p-4 overflow-auto flex-1 relative">
        <div className="absolute inset-0 p-4">
          {editable ? (
            <div className="relative h-full">
              <textarea
                value={code}
                onChange={(e) => onChange && onChange(e.target.value)}
                ref={textareaRef}
                className="w-full h-full bg-transparent resize-none outline-none text-gray-300 font-mono text-sm"
                spellCheck={false}
              />
              {/* overlay to visually highlight the error line behind the textarea */}
              {typeof errorLine === 'number' && overlayTop !== null && (
                <div className="pointer-events-none absolute inset-0">
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${overlayTop}px`,
                      height: `${measuredLineHeight}px`,
                      background: 'linear-gradient(90deg, rgba(220,38,38,0.06), rgba(220,38,38,0.03))',
                      borderLeft: '3px solid rgba(220,38,38,0.35)',
                      transition: 'top 120ms ease',
                      borderRadius: 2,
                    }}
                  />
                </div>
              )}
              {typeof errorLine === 'number' && (
                <div className="absolute left-3 bottom-3 text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                  Error: line {errorLine}
                </div>
              )}
              {typeof activeLine === 'number' && (
                <div className="absolute right-3 top-3 text-xs text-primary bg-white/5 px-2 py-1 rounded">
                  Line {activeLine} ← Running
                </div>
              )}
            </div>
          ) : (
            lines.map((line, i) => {
              const lineNumber = i + 1;
              const isActive = lineNumber === activeLine;

              const isError = typeof errorLine === 'number' && lineNumber === errorLine;
              return (
                <div 
                  key={i} 
                  className={cn(
                    "relative flex",
                    isActive && "bg-primary/10 -mx-4 px-4 border-l-2 border-primary",
                    isError && "bg-red-600/10 -mx-4 px-4 border-l-2 border-red-500"
                  )}
                >
                <span className="text-white/20 select-none w-8 text-right mr-4 flex-shrink-0">
                  {lineNumber}
                </span>
                <span className={cn(
                  "whitespace-pre text-gray-300",
                  isActive && "text-white font-medium"
                )}>
                  {line || " "}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="active-line-indicator"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary text-xs font-bold"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    ← Running
                  </motion.div>
                )}
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}
