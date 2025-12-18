import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import Layout from "@/components/layout";

export default function AdminPage() {
  const { user, loading } = useUser();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("granted");
  const [adminToken, setAdminToken] = useState("");
  const [result, setResult] = useState<{ token?: string; error?: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div>Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="mb-6">Acesso somente para administradores.</p>

        <div className="max-w-xl space-y-4">
          <h2 className="text-xl font-semibold">Conceder Pro (gera token)</h2>
          <div className="space-y-2">
            <label className="block text-sm">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-3 py-2 bg-white/5 border-white/10 text-white" placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded border px-3 py-2 bg-white/5 border-white/10 text-white">
              <option value="granted">granted</option>
              <option value="paid">paid</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm">ADMIN_API_TOKEN</label>
            <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} className="w-full rounded border px-3 py-2 bg-white/5 border-white/10 text-white" placeholder="cole o token do admin" />
          </div>
          <div>
            <button
              className="px-4 py-2 bg-purple-600 rounded text-white"
              onClick={async () => {
                setResult(null);
                try {
                  const res = await fetch("/api/pro/grant", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({ email, status }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || "erro");
                  setResult({ token: data?.token });
                } catch (e: any) {
                  setResult({ error: e?.message || "erro" });
                }
              }}
            >
              Gerar token
            </button>
          </div>

          {result?.token && (
            <div className="text-sm">
              <div className="mb-1">Token gerado:</div>
              <div className="font-mono bg-black/30 text-white px-3 py-2 rounded inline-block">{result.token}</div>
            </div>
          )}
          {result?.error && <div className="text-red-300">{result.error}</div>}
        </div>
      </div>
    </Layout>
  );
}
