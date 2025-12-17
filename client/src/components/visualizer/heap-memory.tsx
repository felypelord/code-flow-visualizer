import { motion } from "framer-motion";
import { HeapObject } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HeapMemory({ heap }: { heap: HeapObject[] }) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        Heap Memory (Objects)
      </h3>

      <div className="flex-1 overflow-auto p-2 bg-[#0d1220] rounded-lg border border-white/5 relative">
        <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {heap.map((obj) => (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "bg-emerald-950/20 border rounded-lg p-3 font-mono text-sm backdrop-blur-sm transition-colors duration-300",
                obj.highlight ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-emerald-900/30"
              )}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                <span className="text-emerald-400 font-bold text-xs">{obj.className}</span>
                <span className="text-[10px] text-emerald-700 font-bold">#{obj.id}</span>
              </div>

              <div className="space-y-1">
                {obj.properties.map((prop) => (
                  <div key={prop.name} className="flex justify-between text-xs">
                    <span className="text-emerald-200/60">{prop.name}:</span>
                    <span className={cn(
                      "text-emerald-100",
                      prop.changed && "bg-emerald-500/20 px-1 rounded animate-pulse"
                    )}>
                      {String(prop.value)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          
          {heap.length === 0 && (
            <div className="col-span-full py-10 text-center text-white/10 text-sm italic">
              Memória Heap Vazia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
