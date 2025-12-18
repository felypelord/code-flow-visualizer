import { lazy, Suspense } from "react";
import Layout from "@/components/layout";

const ProDebuggerLazy = lazy(() =>
  import("@/components/visualizer/pro-debugger").then((m) => ({ default: m.ProDebugger }))
);

export default function ProPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
        <Suspense fallback={<div className="text-center p-8">Carregando debugger...</div>}>
          <ProDebuggerLazy />
        </Suspense>
      </div>
    </Layout>
  );
}
