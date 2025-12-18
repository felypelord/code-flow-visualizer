import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import Layout from "@/components/layout";

export default function AdminPage() {
  const { user, loading } = useUser();
  const [, setLocation] = useLocation();

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
        <p>Acesso somente para administradores.</p>
      </div>
    </Layout>
  );
}
