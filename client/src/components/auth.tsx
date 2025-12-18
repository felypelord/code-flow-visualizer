import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COUNTRIES = [
  'Argentina', 'Australia', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'France', 'Germany',
  'India', 'Indonesia', 'Italy', 'Japan', 'Mexico', 'Nigeria', 'Philippines', 'Portugal', 'South Africa',
  'Spain', 'United Kingdom', 'United States'
];

function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string; firstName?: string; isPro?: boolean } | null>(null);
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
    // sync local progress to server
    const keys = Object.keys(localStorage).filter(k => k.startsWith('progress:'));
    for (const k of keys) {
      const val = localStorage.getItem(k);
      if (!val) continue;
      const [,lessonId, language] = k.split(':');
      try { await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` }, body: JSON.stringify({ lessonId, language, index: parseInt(val,10) }) }); } catch(e) { /* ignore */ }
    }
  };

  return { user, token, login, logout };
}

export default function Auth() {
  const { user, token, login, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'login' | 'signup-form' | 'signup-verify' | 'forgot-email' | 'forgot-verify' | 'forgot-password'>('login');

  // Form 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Form 2: Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  
  // Verification code
  const [verificationCode, setVerificationCode] = useState('');
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !validateEmail(email)) {
        setError(t.invalidEmail || 'Invalid email');
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError(t.passwordRequired || 'Password required');
        setIsLoading(false);
        return;
      }

      await login(email, password);
      setOpen(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !validateEmail(email)) {
        setError(t.invalidEmail || 'Invalid email');
        setIsLoading(false);
        return;
      }

      if (!firstName.trim()) {
        setError('First name is required');
        setIsLoading(false);
        return;
      }

      if (!lastName.trim()) {
        setError('Last name is required');
        setIsLoading(false);
        return;
      }

      if (!dateOfBirth) {
        setError('Date of birth is required');
        setIsLoading(false);
        return;
      }

      if (!country.trim()) {
        setError('Country is required');
        setIsLoading(false);
        return;
      }

      if (!validatePassword(password)) {
        setError(t.passwordRequired || 'Password must be 10+ chars with letters and numbers');
        setIsLoading(false);
        return;
      }

      // Send verification code
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          country,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send code');
      }

      setStep('signup-verify');
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Verification code must be 6 digits');
        setIsLoading(false);
        return;
      }

      // Verify code
      const verifyRes = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      // Complete signup
      const signupRes = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          country,
          password,
        }),
      });

      if (!signupRes.ok) {
        const data = await signupRes.json();
        throw new Error(data.message || 'Failed to create account');
      }

      const data = await signupRes.json();
      localStorage.setItem('token', data.token);
      await login(email, password);

      setOpen(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setCountry('');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Handlers
  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !validateEmail(email)) {
        setError(t.invalidEmail || 'Invalid email');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send reset code');
      }

      setStep('forgot-verify');
      setVerificationCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Verification code must be 6 digits');
        setIsLoading(false);
        return;
      }

      const verifyRes = await fetch('/api/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Invalid verification code');
      }

      setStep('forgot-password');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!newPassword) {
        setError(t.passwordRequired || 'New password required');
        setIsLoading(false);
        return;
      }

      if (!validatePassword(newPassword)) {
        setError(t.passwordRequired || 'Password must be 10+ chars with letters and numbers');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reset password');
      }

      // Auto-login after password reset
      await login(email, newPassword);
      setOpen(false);
      setEmail('');
      setPassword('');
      setNewPassword('');
      setVerificationCode('');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{t.hello || 'Hello'}, {user.firstName || user.email.split('@')[0]}</span>
            <span className="text-xs text-slate-400">{user.isPro ? 'Pro' : 'Free'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="text-xs">
            {t.logOut || 'Logout'}
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              {t.signIn || 'Sign In'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-slate-950 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                {step === 'login' 
                  ? (t.signIn || 'Sign In')
                  : step === 'signup-form' ? (t.createAccount || 'Create Account')
                  : step === 'signup-verify' ? '📧 Verify Email'
                  : step === 'forgot-email' ? '🔑 Reset Password'
                  : step === 'forgot-verify' ? '📧 Verify Code'
                  : '🔐 New Password'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                {step === 'login'
                  ? (t.signInDescription || 'Enter your email and password')
                  : step === 'signup-form'
                    ? (t.createAccountDescription || 'Create your account with email')
                    : step === 'signup-verify' ? 'Enter the 6-digit code sent to your email'
                    : step === 'forgot-email' ? 'Enter your email to receive a reset code'
                    : step === 'forgot-verify' ? 'Enter the code sent to your email'
                    : 'Enter your new password'}
              </DialogDescription>
            </DialogHeader>

            {step === 'login' ? (
              // LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-200 block">
                    {t.emailLabel || 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder || 'your@email.com'}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-200 block">
                    {t.passwordLabel || 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder || '••••••••••'}
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
                </div>

                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isLoading ? '...' : (t.signInButton || 'Sign In')}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    {t.toggleMode || "Don't have an account?"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('signup-form');
                      setError(null);
                      setPassword('');
                      setEmail('');
                    }}
                    disabled={isLoading}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-60"
                  >
                    {t.createAccount || 'Create Account'}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('forgot-email');
                      setError(null);
                      setPassword('');
                      setEmail('');
                    }}
                    disabled={isLoading}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-60"
                  >
                    🔑 Forgot password?
                  </button>
                </div>
              </form>
            ) : step === 'signup-form' ? (
              // SIGNUP FORM
              <form onSubmit={handleSendVerificationCode} className="space-y-3 mt-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200 block">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200 block">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    disabled={isLoading}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm pr-8"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 text-sm"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">🔒 10+ chars, mix letters & numbers</p>
                </div>

                {error && (
                  <div className="flex gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 rounded text-sm disabled:opacity-60"
                >
                  {isLoading ? '...' : 'Send Verification Code'}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-60"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            ) : step === 'signup-verify' ? (
              // SIGNUP VERIFICATION CODE FORM
              <form onSubmit={handleVerifyCode} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center text-lg tracking-widest font-mono"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isLoading ? '...' : 'Verify & Create Account'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('signup-form');
                    setError(null);
                    setVerificationCode('');
                  }}
                  disabled={isLoading}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 py-2"
                >
                  Back to form
                </button>
              </form>
            ) : step === 'forgot-email' ? (
              // FORGOT PASSWORD - EMAIL FORM
              <form onSubmit={handleForgotPasswordEmail} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-200 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isLoading ? '...' : 'Send Reset Code'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(null);
                    setEmail('');
                  }}
                  disabled={isLoading}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 py-2"
                >
                  Back to login
                </button>
              </form>
            ) : step === 'forgot-verify' ? (
              // FORGOT PASSWORD - VERIFY CODE FORM
              <form onSubmit={handleVerifyResetCode} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center text-lg tracking-widest font-mono"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isLoading ? '...' : 'Verify Code'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot-email');
                    setError(null);
                    setVerificationCode('');
                  }}
                  disabled={isLoading}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 py-2"
                >
                  Back to form
                </button>
              </form>
            ) : (
              // FORGOT PASSWORD - SET NEW PASSWORD FORM
              <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-200 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10 text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">🔒 10+ chars, mix letters & numbers</p>
                </div>

                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  {isLoading ? '...' : 'Reset Password'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(null);
                    setEmail('');
                    setNewPassword('');
                    setVerificationCode('');
                  }}
                  disabled={isLoading}
                  className="w-full text-xs text-slate-400 hover:text-slate-300 py-2"
                >
                  Back to login
                </button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
