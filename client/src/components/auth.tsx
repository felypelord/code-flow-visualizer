import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function useAuth() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => setUser(data))
        .catch(() => { setUser(null); setToken(null); localStorage.removeItem('token'); });
    }
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!res.ok) throw new Error('login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    // sync local progress to server
    const keys = Object.keys(localStorage).filter(k => k.startsWith('progress:'));
    for (const k of keys) {
      const val = localStorage.getItem(k);
      if (!val) continue;
      const [,lessonId, language] = k.split(':');
      try { await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` }, body: JSON.stringify({ lessonId, language, index: parseInt(val,10) }) }); } catch(e) { /* ignore */ }
    }
  };

  const signup = async (username: string, password: string) => {
    const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!res.ok) throw new Error('signup failed');
    return true;
  };

  return { user, token, login, logout, signup };
}

export default function Auth() {
  const { user, token, login, logout, signup } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLoginMode) await login(username, password);
      else await signup(username, password);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro');
    }
  };

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">Olá, {user.username}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Sair</Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Entrar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{isLoginMode ? 'Entrar' : 'Criar conta'}</DialogTitle>
              <DialogDescription>{isLoginMode ? 'Faça login para sincronizar seu progresso' : 'Crie uma conta'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-4">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" className="w-full p-2 bg-white/5 rounded" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" type="password" className="w-full p-2 bg-white/5 rounded" />
              {error && <div className="text-sm text-red-400">{error}</div>}
              <div className="flex gap-2 mt-2">
                <Button type="submit">{isLoginMode ? 'Entrar' : 'Criar'}</Button>
                <Button variant="ghost" onClick={() => setIsLoginMode((s) => !s)}>{isLoginMode ? 'Criar conta' : 'Voltar ao login'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
