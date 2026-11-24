'use client';

import {
  BellRing,
  BookOpenCheck,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileBadge2,
  GraduationCap,
  LibraryBig,
  LockKeyhole,
  MonitorPlay,
  Smartphone,
  Users,
} from 'lucide-react';

const MODULES = [
  { name: 'Users & Bulk Accounts', area: 'Foundation', icon: Users, state: 'Build next', detail: 'Admin, trainer and student identities with mandatory password change.' },
  { name: 'Academic Structure', area: 'Foundation', icon: GraduationCap, state: 'Active', detail: 'Admin-managed courses, batches, groups, subjects and modules.' },
  { name: 'Approval Centre', area: 'Core LMS', icon: ClipboardCheck, state: 'Planned', detail: 'One review history for content, assignments, results and announcements.' },
  { name: 'Learning Materials', area: 'Core LMS', icon: LibraryBig, state: 'Planned', detail: 'Private files, links, exercises and completion tracking.' },
  { name: 'Assignments & Quizzes', area: 'Core LMS', icon: BookOpenCheck, state: 'Planned', detail: 'Submissions, evaluation, resubmission and result approval.' },
  { name: 'Timetables', area: 'Class Management', icon: CalendarDays, state: 'Planned', detail: 'Monthly PDF plus admin-managed weekly timetable.' },
  { name: 'Notifications', area: 'Communication', icon: BellRing, state: 'Planned', detail: 'In-app, email, WhatsApp and push delivery history.' },
  { name: 'Finance & Blossom Trust', area: 'Admin Control', icon: CircleDollarSign, state: 'Existing logic', detail: 'Payments and settlements remain under Admin control.' },
  { name: 'Career & Graduate Tracking', area: 'Admin Control', icon: BriefcaseBusiness, state: 'Existing logic', detail: 'Career outcomes, follow-ups and restricted reports.' },
  { name: 'Certificates', area: 'Admin Control', icon: FileBadge2, state: 'Planned', detail: 'Approved PDF issue, QR verification, revoke and reissue.' },
  { name: 'Video & Recorded Classes', area: 'Learning', icon: MonitorPlay, state: 'Planned', detail: 'Trainer upload with Admin approval and learner progress.' },
  { name: 'Mobile Application', area: 'Delivery', icon: Smartphone, state: 'Future phase', detail: 'Native app after the secure LMS API and PWA are stable.' },
];

const STATUS_CLASS: Record<string, string> = {
  Active: 'bg-green-50 text-green-700 border-green-200',
  'Existing logic': 'bg-teal-50 text-teal-700 border-teal-200',
  'Build next': 'bg-amber-50 text-amber-800 border-amber-200',
  Planned: 'bg-slate-100 text-slate-700 border-slate-200',
  'Future phase': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function AdminControlPage() {
  return (
    <div className="space-y-6 text-slate-700">
      <section className="overflow-hidden rounded-3xl bg-[#102A43] text-white shadow-xl">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F5B923]/40 bg-[#F5B923]/10 px-3 py-1 text-xs font-bold text-[#F5B923]">
              <Bot className="h-4 w-4" /> UNICOM TIC LMS FOUNDATION
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Admin Control Centre</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
              The standalone LMS keeps exactly three login roles. Finance, Blossom Trust, career,
              certificates, timetables, video learning, mobile and notification capabilities are
              governed here as Admin-controlled modules.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-8 w-8 text-[#F5B923]" />
              <div>
                <p className="font-bold">Security boundary</p>
                <p className="text-xs text-slate-300">UI rules + server verification + Supabase RLS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <article key={module.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102A43] text-[#F5B923]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASS[module.state]}`}>
                  {module.state}
                </span>
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#0D9488]">{module.area}</p>
              <h2 className="mt-1 text-base font-extrabold text-[#102A43]">{module.name}</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">{module.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0D9488]" />
          <div>
            <h2 className="font-bold text-[#102A43]">Foundation rule now active</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Legacy staff roles are not accepted as LMS roles. Trainer access remains restricted
              until assignment-aware database policies are implemented and tested.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
