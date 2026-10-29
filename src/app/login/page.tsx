'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid credentials. Please verify your email and password.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'labincharge' | 'hod') => {
    if (role === 'admin') {
      setEmail('admin@superiorcollegemc.com');
      setPassword('Superior2026!');
    } else if (role === 'labincharge') {
      setEmail('labincharge@superiorcollegemc.com');
      setPassword('Superior2026!');
    } else {
      setEmail('hod@superiorcollegemc.com');
      setPassword('Superior2026!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Superior College Header Banner */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="bg-white rounded-2xl py-3 px-6 mx-auto mb-4 max-w-[260px] shadow-lg flex items-center justify-center">
            <Image
              src="/images/superior-logo.png"
              alt="Superior College Logo"
              width={240}
              height={64}
              className="h-11 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Superior Lab Tracker</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Superior College, Mian Channu — Punjab, Pakistan
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-blue-300 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Drive Academic Portal</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@superiorcollegemc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Tracker'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Institutional Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              College Staff Access Accounts
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-900 text-[11px]">Administrator</div>
                <div className="text-[9px] text-slate-500 truncate">admin@...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('labincharge')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-900 text-[11px]">Lab Incharge</div>
                <div className="text-[9px] text-slate-500 truncate">labincharge@...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hod')}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-900 text-[11px]">HOD / Viewer</div>
                <div className="text-[9px] text-slate-500 truncate">hod@...</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Default college staff password: <span className="font-mono text-slate-600">Superior2026!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
