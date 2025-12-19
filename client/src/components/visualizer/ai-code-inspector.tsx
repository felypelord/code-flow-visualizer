import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Code2, Lightbulb, AlertTriangle, Zap, Lock, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

interface CodeInsight {
  type: "suggestion" | "warning" | "optimization" | "explanation";
  message: string;
  line?: number;
}

export function AICodeInspector() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const isPro = user?.isPro || false;

  const [usageCount, setUsageCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem('ai-inspector-usage') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [code, setCode] = useState(`def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result = result * i
    return result

print(factorial(5))`);

  const [insights, setInsights] = useState<CodeInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeCode = () => {
    if (!isPro && usageCount >= 1) {
      toast({
        title: t.proRequired || "Pro Required",
        description: t.aiInspectorLimit || "You've used your free analysis. Upgrade to Pro for unlimited access.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const newInsights: CodeInsight[] = [];

      // Simple static analysis
      if (code.includes("for") && code.includes("range")) {
        newInsights.push({
          type: "optimization",
          message: "Considere usar list comprehension para código mais Pythônico",
          line: 3,
        });
      }

      if (code.includes("result = result")) {
        newInsights.push({
          type: "suggestion",
          message: "Pode usar operador de atribuição composto (result *= i)",
          line: 4,
        });
      }

      if (code.match(/factorial|fibonacci|prime/i)) {
        newInsights.push({
          type: "explanation",
          message: "Algoritmo recursivo pode causar stack overflow em valores grandes. Considere usar memoização ou solução iterativa.",
        });
      }

      if (code.includes("print(")) {
        newInsights.push({
          type: "suggestion",
          message: "Para logging profissional, considere usar o módulo logging ao invés de print()",
        });
      }

      // Check for missing docstrings
      if ((code.includes("def ") || code.includes("class ")) && !code.includes('"""')) {
        newInsights.push({
          type: "warning",
          message: "Função sem docstring. Adicione documentação para melhor manutenibilidade.",
          line: 1,
        });
      }

      setInsights(newInsights);
      setAnalyzing(false);

      if (!isPro) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('ai-inspector-usage', newCount.toString());
      }
      
      if (newInsights.length === 0) {
        toast({ title: t.analysisComplete || "Analysis Complete", description: t.noSuggestions || "No suggestions found. Code looks good!" });
      }
    }, 1500);
  };

  const getInsightIcon = (type: CodeInsight["type"]) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="w-4 h-4 text-blue-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "optimization":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "explanation":
        return <Code2 className="w-4 h-4 text-purple-400" />;
    }
  };

  const getInsightStyle = (type: CodeInsight["type"]) => {
    switch (type) {
      case "suggestion":
        return "bg-blue-500/10 border-blue-400/30 text-blue-100";
      case "warning":
        return "bg-yellow-500/10 border-yellow-400/30 text-yellow-100";
      case "optimization":
        return "bg-amber-500/10 border-amber-400/30 text-amber-100";
      case "explanation":
        return "bg-purple-500/10 border-purple-400/30 text-purple-100";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 rounded-3xl border border-purple-400/20 shadow-2xl shadow-purple-500/10 relative">
      {/* Pro Lock Overlay */}
      {!isPro && usageCount >= 1 && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-3xl z-10 flex items-center justify-center">
          <Card className="p-8 bg-gradient-to-br from-purple-900/90 to-slate-900/90 border-2 border-purple-400/50 shadow-2xl max-w-md text-center">
            <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{t.proRequired || "Pro Required"}</h3>
            <p className="text-purple-100/80 mb-6">
              {t.aiInspectorLimitReached || "You've used your free analysis. Upgrade to Pro for unlimited AI-powered code analysis."}
            </p>
            <Button
              className="bg-gradient-to-r from-purple-400 to-purple-600 text-black font-semibold hover:from-purple-500 hover:to-purple-700"
              onClick={() => setLocation("/pro")}
            >
              <Crown className="w-4 h-4 mr-2" />
              {t.upgradeToPro || "Upgrade to Pro"}
            </Button>
            <p className="text-xs text-purple-200/60 mt-4">
              {usageCount}/1 {t.freeAnalysesUsed || "free analyses used"}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-200 text-xs font-semibold w-fit">
          <Sparkles className="w-4 h-4" /> {t.aiCodeInspector || "IA Code Inspector"} - {t.intelligentAnalysis || "Intelligent Analysis"}
          {!isPro && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">({1 - usageCount} {t.freeLeft || "free left"})</span>}
        </div>
        <h1 className="text-3xl font-bold text-white">{t.aiCodeInspectorTitle || "AI Code Inspector"}</h1>
        <p className="text-sm text-purple-100/90">
          {t.aiCodeInspectorDesc || "Automatic analysis with optimization suggestions, warnings, and algorithm explanations."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Code Editor */}
        <Card className="p-4 bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-400/30 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">{t.yourCode || "Your Code"}</h2>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-400 to-purple-600 text-black"
              onClick={analyzeCode}
              disabled={analyzing || (!isPro && usageCount >= 1)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {analyzing ? (t.analyzing || "Analyzing...") : (t.analyze || "Analyze")}
            </Button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 p-3 border rounded-lg font-mono text-sm bg-black/60 text-purple-50 border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400/60"
            placeholder={t.pasteCodeHere || "Paste your Python code here..."}
          />

          <div className="mt-3 text-xs text-purple-200/70 space-y-1">
            <p>💡 {t.inspectorFeatures || "The Inspector analyzes your code and provides:"}</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>{t.optimizationSuggestions || "Optimization suggestions"}</li>
              <li>{t.potentialIssueWarnings || "Warnings about potential issues"}</li>
              <li>{t.algorithmExplanations || "Algorithm explanations"}</li>
              <li>{t.bestPracticesTips || "Best practices tips"}</li>
            </ul>
          </div>
        </Card>

        {/* Insights Panel */}
        <Card className="p-4 bg-gradient-to-b from-slate-900 to-purple-950/20 border border-purple-400/30 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Insights da IA</h2>
            {insights.length > 0 && (
              <span className="text-sm text-purple-200/80">
                {insights.length} {insights.length === 1 ? "insight" : "insights"}
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <Sparkles className="w-16 h-16 text-purple-400/30 mb-4" />
                <p className="text-purple-200/70 text-sm">
                  Clique em "Analisar" para receber insights da IA sobre seu código
                </p>
              </div>
            ) : (
              insights.map((insight, idx) => (
                <Card
                  key={idx}
                  className={`p-4 border ${getInsightStyle(insight.type)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {insight.type}
                        </span>
                        {insight.line && (
                          <span className="text-xs px-2 py-0.5 rounded bg-black/30 font-mono">
                            Linha {insight.line}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{insight.message}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Stats */}
      {insights.length > 0 && (
        <Card className="p-4 bg-purple-500/10 border-purple-400/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-300">
                {insights.filter((i) => i.type === "suggestion").length}
              </div>
              <div className="text-xs text-blue-200/80">Sugestões</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">
                {insights.filter((i) => i.type === "warning").length}
              </div>
              <div className="text-xs text-yellow-200/80">Avisos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-300">
                {insights.filter((i) => i.type === "optimization").length}
              </div>
              <div className="text-xs text-amber-200/80">Otimizações</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300">
                {insights.filter((i) => i.type === "explanation").length}
              </div>
              <div className="text-xs text-purple-200/80">Explicações</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
