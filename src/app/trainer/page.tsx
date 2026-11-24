'use client';

import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useStore } from '@/lib/store';

const WORKSPACE_ITEMS = [
  { label: 'My Students', icon: Users, note: 'Available after trainer assignments are migrated.' },
  { label: 'My Subjects', icon: BookOpenCheck, note: 'Restricted to assigned subjects and groups.' },
  { label: 'Class Timetable', icon: CalendarDays, note: 'Monthly and weekly views will appear here.' },
  { label: 'Student Submissions', icon: ClipboardList, note: 'Only submissions from assigned learners.' },
  { label: 'Evaluations', icon: FileCheck2, note: 'Marks remain hidden until Admin approval.' },
  { label: 'Notifications', icon: Bell, note: 'Academic updates and approval responses.' },
];

export default function TrainerDashboardPage() {
  const { currentAuthUser } = useStore();

  return (
    <div className="space-y-6 text-slate-700">
      <section className="rounded-3xl bg-[#102A43] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5B923]">Trainer workspace</p>
            <h1 className="mt-2 text-2xl font-black">Welcome, {currentAuthUser?.fullName || 'Trainer'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Your workspace is intentionally assignment-scoped. Admin features and unassigned learner
              information are not exposed.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-xs font-bold text-teal-200">
            <ShieldCheck className="h-4 w-4" /> Protected access
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WORKSPACE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 text-[#0D9488]" />
              <h2 className="mt-4 font-extrabold text-[#102A43]">{item.label}</h2>
              <p className="mt-2 text-sm leading-5 text-slate-500">{item.note}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
