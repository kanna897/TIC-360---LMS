'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useStore } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/permissions';

const passwordChecks = (password: string) => [
  { label: '12–72 characters', valid: password.length >= 12 && password.length <= 72 },
  { label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
  { label: 'At least one lowercase letter', valid: /[a-z]/.test(password) },
  { label: 'At least one number', valid: /[0-9]/.test(password) },
];

export default function ChangePasswordPage() {
  const { currentAuthUser, currentRole, setCurrentAuthUser } = useStore();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const checks = useMemo(() => passwordChecks(password), [password]);
  const valid = checks.every((check) => check.valid) && password === confirmation;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!valid) {
      setError('Complete every password requirement and confirm the same password.');
      return;
    }

    setLoading(true);
    const { data, error: functionError } = await supabase.functions.invoke('change-initial-password', {
      body: { password },
    });

    if (functionError || !data?.success) {
      setError(data?.error || 'Password could not be changed. Please try again.');
      setLoading(false);
      return;
    }

    if (currentAuthUser) {
      setCurrentAuthUser({ ...currentAuthUser, mustChangePassword: false });
    }
    setSuccess(true);
    setTimeout(() => window.location.assign(getDefaultRouteForRole(currentRole)), 900);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-lg items-center py-8">
      <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-[#102A43] px-6 py-7 text-white sm:px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5B923] text-[#102A43]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#F5B923]">First login security</p>
          <h1 className="mt-2 text-2xl font-black">Create your private password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Your temporary password cannot open the LMS dashboard. Create a new password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8">
          <div>
            <label htmlFor="new-password" className="text-sm font-bold text-[#102A43]">New password</label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#102A43]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="text-sm font-bold text-[#102A43]">Confirm password</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20"
              required
            />
          </div>

          <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            {checks.map((check) => (
              <div key={check.label} className={`flex items-center gap-2 text-xs ${check.valid ? 'text-emerald-700' : 'text-slate-500'}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {check.label}
              </div>
            ))}
          </div>

          {confirmation && password !== confirmation && (
            <p className="text-sm text-red-600">The passwords do not match.</p>
          )}
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Password changed. Opening your dashboard…</p>}

          <button
            type="submit"
            disabled={!valid || loading || success}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B923] px-4 py-3 text-sm font-extrabold text-[#102A43] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {loading ? 'Securing account…' : 'Change password and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
