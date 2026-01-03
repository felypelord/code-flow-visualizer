import { motion, AnimatePresence } from "framer-motion";
import { StackFrame } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CallStack({ stack }: { stack: StackFrame[] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        {t("visualizer.callStack", "Call Stack")}
      </h3>
      
      <div className="flex-1 overflow-auto flex flex-col-reverse gap-2 p-1">
        <AnimatePresence>
          {stack.map((frame) => (
            <motion.div
              key={frame.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "border rounded-md p-3 font-mono text-sm relative overflow-hidden",
                frame.active 
                  ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                  : "bg-card/40 border-white/5 opacity-60"
              )}
            >
              {frame.active && (
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              )}
              
              <div className="flex justify-between items-center mb-2">
                <span className={cn("font-bold", frame.active ? "text-blue-400" : "text-gray-400")}>
                  {frame.name}
                </span>
                {frame.active && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                    {t("visualizer.active", "ACTIVE")}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {frame.variables.map((v) => (
                  <div key={v.name} className="flex justify-between items-center text-xs group">
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{v.name}:</span>
                    <span className={cn(
                      "font-medium", 
                      v.type === 'reference' ? "text-emerald-400 italic" : "text-amber-200",
                      v.changed && "bg-white/10 px-1 rounded animate-pulse"
                    )}>
                      {String(v.value)}
                    </span>
                  </div>
                ))}
                {frame.variables.length === 0 && (
                  <span className="text-xs text-white/20 italic">{t("visualizer.empty", "empty")}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {stack.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-white/10 text-sm italic border-2 border-dashed border-white/5 rounded-lg m-2">
            {t("visualizer.emptyStack", "Empty stack")}
          </div>
        )}
      </div>
    </div>
  );
}
