'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { signInWithSupabase } from '@/lib/auth';

function LoginForm() {
  const searchParams = useSearchParams();
  const { setCurrentRole, setCurrentAuthUser, orgProfile, students } = useStore();

  const [activeTab, setActiveTab] = useState<'student' | 'staff'>(
    searchParams.get('type') === 'staff' ? 'staff' : 'student'
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (tab: 'student' | 'staff') => {
    setActiveTab(tab);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await signInWithSupabase(identifier, password, students);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      // Set role and current authenticated user in store and localStorage
      setCurrentRole(res.user.role);
      setCurrentAuthUser(res.user);

      setIsSuccess(true);
      setTimeout(() => {
        const requestedPath = searchParams.get('next');
        const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : res.user?.role === 'Student' ? '/portal' : '/';
        window.location.assign(safePath);
      }, 700);
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during authentication.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top return link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Home</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student Register</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border border-slate-700 shadow-2xl ring-4 ring-blue-500/20 p-1 mb-1">
            <img
              src="/logo-badge.jpg"
              alt="TIC360 Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>TIC360</span>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activeTab === 'student' ? 'Student Portal' : 'Staff Portal'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{orgProfile.orgName} • {orgProfile.trustName}</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Staff / Admin</span>
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {activeTab === 'student' ? 'Student Portal Sign In' : 'Administrative Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'student'
                ? 'Enter the email address linked to your student account'
                : 'Enter your official administrative or faculty email credentials'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {activeTab === 'student' ? 'Student Email' : 'Official Email'}
              </label>
              <div className="relative">
                {activeTab === 'student' ? (
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'student' ? 'student@example.com' : 'name@unicomtic.lk'}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Authentication verified! Entering {activeTab === 'student' ? 'Student Portal' : 'Workspace'}...</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-xs font-bold"
              disabled={isSuccess || isLoading}
              rightIcon={
                isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {isLoading
                ? 'Verifying with Supabase...'
                : isSuccess
                ? 'Signing In...'
                : activeTab === 'student'
                ? 'Enter Student Portal'
                : 'Sign In as Staff'}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
              <span className="text-[11px]">Haven&apos;t registered yet as a trainee?</span>
              <Link
                href="/register"
                className="font-bold text-white hover:text-emerald-300 underline shrink-0"
              >
                Register Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TIC360 Trainee Authentication & Blossom Trust MIS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading TIC360 Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
