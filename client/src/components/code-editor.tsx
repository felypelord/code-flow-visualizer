import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  activeLine: number; // 1-indexed
}

export default function CodeEditor({ code, activeLine }: CodeEditorProps) {
  const lines = code.split("\n");

  return (
    <div className="bg-[#0a0f1e] rounded-lg border border-white/10 overflow-hidden shadow-2xl font-mono text-sm h-full flex flex-col">
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
          {lines.map((line, i) => {
            const lineNumber = i + 1;
            const isActive = lineNumber === activeLine;

            return (
              <div 
                key={i} 
                className={cn(
                  "relative flex",
                  isActive && "bg-primary/10 -mx-4 px-4 border-l-2 border-primary"
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
          })}
        </div>
      </div>
    </div>
  );
}
