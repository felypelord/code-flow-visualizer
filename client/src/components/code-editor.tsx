import { motion } from "framer-motion";
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
                className="w-full h-full bg-transparent resize-none outline-none text-gray-300 font-mono text-sm"
                spellCheck={false}
              />
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
