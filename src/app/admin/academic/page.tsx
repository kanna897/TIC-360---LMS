'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarRange, CheckCircle2, FolderTree, Layers3, Loader2, Plus, RefreshCw, School, UsersRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Course = { id: number; code: string; name: string; description: string | null; duration_months: number; is_active: boolean };
type Batch = { id: number; course_id: number; name: string; academic_year: number; start_date: string; end_date: string | null; status: string };
type Group = { id: number; batch_id: number; name: string; is_active: boolean };
type Subject = { id: number; course_id: number; code: string; name: string; description: string | null; stage: number; is_common: boolean; is_active: boolean };
type Module = { id: number; subject_id: number; title: string; description: string | null; sort_order: number; is_active: boolean };
type Tab = 'courses' | 'batches' | 'groups' | 'subjects' | 'modules';

const TABS: Array<{ key: Tab; label: string; icon: typeof School }> = [
  { key: 'courses', label: 'Courses', icon: School },
  { key: 'batches', label: 'Batches', icon: CalendarRange },
  { key: 'groups', label: 'Groups', icon: UsersRound },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'modules', label: 'Modules', icon: Layers3 },
];

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-100';

export default function AcademicStructurePage() {
  const [tab, setTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [courseResult, batchResult, groupResult, subjectResult, moduleResult] = await Promise.all([
      supabase.from('courses').select('id,code,name,description,duration_months,is_active').order('code'),
      supabase.from('batches').select('id,course_id,name,academic_year,start_date,end_date,status').order('start_date', { ascending: false }),
      supabase.from('groups').select('id,batch_id,name,is_active').order('name'),
      supabase.from('subjects').select('id,course_id,code,name,description,stage,is_common,is_active').order('stage').order('code'),
      supabase.from('modules').select('id,subject_id,title,description,sort_order,is_active').order('sort_order'),
    ]);
    const error = courseResult.error || batchResult.error || groupResult.error || subjectResult.error || moduleResult.error;
    if (error) setMessage({ kind: 'error', text: error.message });
    setCourses((courseResult.data ?? []) as Course[]);
    setBatches((batchResult.data ?? []) as Batch[]);
    setGroups((groupResult.data ?? []) as Group[]);
    setSubjects((subjectResult.data ?? []) as Subject[]);
    setModules((moduleResult.data ?? []) as Module[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { setForm({}); setMessage(null); }, [tab]);

  const counts = useMemo(() => ({ courses: courses.length, batches: batches.length, groups: groups.length, subjects: subjects.length, modules: modules.length }), [courses, batches, groups, subjects, modules]);
  const value = (key: string) => String(form[key] ?? '');
  const setValue = (key: string, next: string | boolean) => setForm((current) => ({ ...current, [key]: next }));
  const courseName = (id: number) => courses.find((item) => item.id === id)?.name ?? 'Unknown course';
  const batchName = (id: number) => batches.find((item) => item.id === id)?.name ?? 'Unknown batch';
  const subjectName = (id: number) => subjects.find((item) => item.id === id)?.name ?? 'Unknown subject';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage(null);
    let response: { error: { message: string } | null };
    if (tab === 'courses') response = await supabase.from('courses').insert({ code: value('code').trim().toUpperCase(), name: value('name').trim(), description: value('description').trim() || null, duration_months: Number(value('duration') || 9) });
    else if (tab === 'batches') response = await supabase.from('batches').insert({ course_id: Number(value('courseId')), name: value('name').trim(), academic_year: Number(value('year')), start_date: value('startDate'), end_date: value('endDate') || null, status: 'Upcoming' });
    else if (tab === 'groups') response = await supabase.from('groups').insert({ batch_id: Number(value('batchId')), name: value('name') });
    else if (tab === 'subjects') response = await supabase.from('subjects').insert({ course_id: Number(value('courseId')), code: value('code').trim().toUpperCase(), name: value('name').trim(), description: value('description').trim() || null, stage: Number(value('stage')), is_common: Boolean(form.isCommon) });
    else response = await supabase.from('modules').insert({ subject_id: Number(value('subjectId')), title: value('title').trim(), description: value('description').trim() || null, sort_order: Number(value('sortOrder') || 0) });
    setSaving(false);
    if (response.error) { setMessage({ kind: 'error', text: response.error.message }); return; }
    setMessage({ kind: 'success', text: `${TABS.find((item) => item.key === tab)?.label.slice(0, -1)} created successfully.` });
    setForm({});
    await loadData();
  };

  const toggleActive = async (table: 'courses' | 'groups' | 'subjects' | 'modules', id: number, current: boolean) => {
    setMessage(null);
    const update = table === 'groups'
      ? { is_active: !current }
      : { is_active: !current, updated_at: new Date().toISOString() };
    const { error } = await supabase.from(table).update(update).eq('id', id);
    if (error) setMessage({ kind: 'error', text: error.message });
    else { setMessage({ kind: 'success', text: `Status changed to ${current ? 'inactive' : 'active'}.` }); await loadData(); }
  };

  return (
    <div className="space-y-6 text-slate-700">
      <section className="overflow-hidden rounded-3xl bg-[#102A43] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F5B923]/40 bg-[#F5B923]/10 px-3 py-1 text-xs font-bold text-[#F5B923]"><FolderTree className="h-4 w-4" /> ADMIN ACADEMIC FOUNDATION</div><h1 className="text-2xl font-black sm:text-3xl">Academic Structure</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Configure the hierarchy used by enrolments, trainer assignments, learning content, assessments and reports.</p></div>
          <button onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{TABS.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setTab(key)} className={`rounded-2xl border p-4 text-left transition ${tab === key ? 'border-[#0D9488] bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className="flex items-center justify-between"><Icon className={`h-5 w-5 ${tab === key ? 'text-[#0D9488]' : 'text-slate-400'}`} /><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{counts[key]}</span></div><p className="mt-3 font-extrabold text-[#102A43]">{label}</p></button>)}</section>

      {message && <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${message.kind === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}><CheckCircle2 className="h-5 w-5 shrink-0" />{message.text}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Plus className="h-5 w-5 text-[#0D9488]" /><h2 className="font-extrabold text-[#102A43]">Add {TABS.find((item) => item.key === tab)?.label.slice(0, -1)}</h2></div>
          <div className="mt-5 space-y-4">
            {tab === 'courses' && <><Field label="Course code"><input required maxLength={30} value={value('code')} onChange={(e) => setValue('code', e.target.value)} placeholder="ICT-DIP" className={inputClass} /></Field><Field label="Course name"><input required maxLength={150} value={value('name')} onChange={(e) => setValue('name', e.target.value)} placeholder="Diploma in ICT" className={inputClass} /></Field><Field label="Duration (months)"><input required type="number" min="1" max="60" value={value('duration') || '9'} onChange={(e) => setValue('duration', e.target.value)} className={inputClass} /></Field><Description value={value('description')} onChange={(next) => setValue('description', next)} /></>}
            {tab === 'batches' && <><CourseSelect courses={courses} value={value('courseId')} onChange={(next) => setValue('courseId', next)} /><Field label="Batch name"><input required maxLength={100} value={value('name')} onChange={(e) => setValue('name', e.target.value)} placeholder="January 2027" className={inputClass} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Academic year"><input required type="number" min="2020" max="2100" value={value('year')} onChange={(e) => setValue('year', e.target.value)} className={inputClass} /></Field><Field label="Start date"><input required type="date" value={value('startDate')} onChange={(e) => setValue('startDate', e.target.value)} className={inputClass} /></Field></div><Field label="End date (optional)"><input type="date" min={value('startDate')} value={value('endDate')} onChange={(e) => setValue('endDate', e.target.value)} className={inputClass} /></Field></>}
            {tab === 'groups' && <><Field label="Batch"><select required value={value('batchId')} onChange={(e) => setValue('batchId', e.target.value)} className={inputClass}><option value="">Select batch</option>{batches.map((item) => <option key={item.id} value={item.id}>{courseName(item.course_id)} — {item.name}</option>)}</select></Field><Field label="Group"><select required value={value('name')} onChange={(e) => setValue('name', e.target.value)} className={inputClass}><option value="">Select group</option><option>Group A</option><option>Group B</option></select></Field></>}
            {tab === 'subjects' && <><CourseSelect courses={courses} value={value('courseId')} onChange={(next) => setValue('courseId', next)} /><div className="grid grid-cols-[1fr_90px] gap-3"><Field label="Subject code"><input required maxLength={30} value={value('code')} onChange={(e) => setValue('code', e.target.value)} placeholder="ICT101" className={inputClass} /></Field><Field label="Stage"><select required value={value('stage')} onChange={(e) => setValue('stage', e.target.value)} className={inputClass}><option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></Field></div><Field label="Subject name"><input required maxLength={150} value={value('name')} onChange={(e) => setValue('name', e.target.value)} className={inputClass} /></Field><Description value={value('description')} onChange={(next) => setValue('description', next)} /><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(form.isCommon)} onChange={(e) => setValue('isCommon', e.target.checked)} className="h-4 w-4 accent-[#0D9488]" /> Common subject for the course</label></>}
            {tab === 'modules' && <><Field label="Subject"><select required value={value('subjectId')} onChange={(e) => setValue('subjectId', e.target.value)} className={inputClass}><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></Field><Field label="Module title"><input required maxLength={180} value={value('title')} onChange={(e) => setValue('title', e.target.value)} className={inputClass} /></Field><Field label="Display order"><input type="number" min="0" max="999" value={value('sortOrder') || '0'} onChange={(e) => setValue('sortOrder', e.target.value)} className={inputClass} /></Field><Description value={value('description')} onChange={(next) => setValue('description', next)} /></>}
          </div>
          <button disabled={saving || (tab !== 'courses' && courses.length === 0)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {saving ? 'Saving…' : 'Save record'}</button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-[#102A43]">Configured {TABS.find((item) => item.key === tab)?.label}</h2>{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D9488]" /></div> : <RecordList tab={tab} courses={courses} batches={batches} groups={groups} subjects={subjects} modules={modules} courseName={courseName} batchName={batchName} subjectName={subjectName} toggleActive={toggleActive} />}</div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Description({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <Field label="Description (optional)"><textarea rows={3} maxLength={500} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} /></Field>; }
function CourseSelect({ courses, value, onChange }: { courses: Course[]; value: string; onChange: (value: string) => void }) { return <Field label="Course"><select required value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}><option value="">Select course</option>{courses.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></Field>; }

function RecordList({ tab, courses, batches, groups, subjects, modules, courseName, batchName, subjectName, toggleActive }: { tab: Tab; courses: Course[]; batches: Batch[]; groups: Group[]; subjects: Subject[]; modules: Module[]; courseName: (id: number) => string; batchName: (id: number) => string; subjectName: (id: number) => string; toggleActive: (table: 'courses' | 'groups' | 'subjects' | 'modules', id: number, current: boolean) => Promise<void> }) {
  const items = tab === 'courses' ? courses : tab === 'batches' ? batches : tab === 'groups' ? groups : tab === 'subjects' ? subjects : modules;
  if (!items.length) return <div className="mt-5 flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center"><FolderTree className="h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-500">No records configured yet.</p></div>;
  return <div className="mt-4 max-h-[570px] space-y-3 overflow-auto pr-1">{items.map((raw) => {
    const item = raw as Course & Batch & Group & Subject & Module;
    const active = 'is_active' in raw ? Boolean(item.is_active) : item.status === 'Active';
    let title = ''; let subtitle = '';
    if (tab === 'courses') { title = `${item.code} — ${item.name}`; subtitle = `${item.duration_months} months`; }
    else if (tab === 'batches') { title = item.name; subtitle = `${courseName(item.course_id)} · ${item.academic_year} · ${item.start_date}`; }
    else if (tab === 'groups') { title = item.name; subtitle = batchName(item.batch_id); }
    else if (tab === 'subjects') { title = `${item.code} — ${item.name}`; subtitle = `${courseName(item.course_id)} · Stage ${item.stage}${item.is_common ? ' · Common' : ''}`; }
    else { title = item.title; subtitle = `${subjectName(item.subject_id)} · Order ${item.sort_order}`; }
    return <article key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><h3 className="truncate font-bold text-[#102A43]">{title}</h3><p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p></div>{tab === 'batches' ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{item.status}</span> : <button onClick={() => void toggleActive(tab as 'courses' | 'groups' | 'subjects' | 'modules', item.id, active)} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${active ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{active ? 'Active' : 'Inactive'}</button>}</article>;
  })}</div>;
}
