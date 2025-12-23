import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string; isPro?: boolean } | null>(null);
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

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error('login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error('signup failed');
    return true;
  };

  return { user, token, login, logout, signup };
}

export default function Auth() {
  const { user, token, login, logout, signup } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate email
      if (!email || !validateEmail(email)) {
        setError("Invalid Email");
        setIsLoading(false);
        return;
      }

      // Validate password
      if (!password) {
        setError("Password Required");
        setIsLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError("Password Required");
        setIsLoading(false);
        return;
      }

      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(email, password);
        // Auto-login after signup
        await login(email, password);
      }
      
      setOpen(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Hello, {user.email.split('@')[0]}</span>
            <span className="text-xs text-slate-400">{user.isPro ? 'Pro' : 'Free'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="text-xs">
            Log Out
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Sign in
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                {isLoginMode ? "Sign in" : "Create Account"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                {isLoginMode ? 'Enter your email and password to sign in.' : 'Create your account — enter your email and password.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">💡 {isLoginMode ? 'Enter your email' : 'Use your email address'}</p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">🔒 {!isLoginMode ? '10+ chars, mix letters & numbers' : 'Your secure password'}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
              >
                {isLoading ? '...' : (isLoginMode ? 'Sign In' : 'Create Account')}
              </Button>

              {/* Toggle Mode */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">{isLoginMode ? "Don't have an account?" : 'Already have an account?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError(null);
                    setPassword('');
                  }}
                  disabled={isLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-60"
                >
                  {isLoginMode ? "Create Account" : "Sign in"}
                </button>
              </div>

              {/* Security Note */}
              <p className="text-xs text-slate-500 text-center mt-3 leading-relaxed">
                🛡️ Your data is encrypted. We never share your information.
              </p>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
