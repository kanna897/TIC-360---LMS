'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, ShieldCheck, Upload, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type StudentRow = {
  rowNumber: number;
  fullName: string;
  username: string;
  googleEmail: string;
  utNumber: string;
  contactNumber: string;
  errors: string[];
};

type ProvisionResult = {
  rowNumber: number;
  username: string;
  utNumber?: string;
  success: boolean;
  error?: string;
};

type ProvisionResponse = {
  error?: string;
  requested?: number;
  succeeded?: number;
  failed?: number;
  results?: ProvisionResult[];
};

const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const textValue = (value: unknown) => String(value ?? '').trim();
const aliases: Record<string, keyof Omit<StudentRow, 'rowNumber' | 'errors'>> = {
  fullname: 'fullName', name: 'fullName', studentname: 'fullName',
  username: 'username', user: 'username', loginusername: 'username',
  googleemail: 'googleEmail', email: 'googleEmail', gmail: 'googleEmail',
  utnumber: 'utNumber', utno: 'utNumber', studentid: 'utNumber',
  contactnumber: 'contactNumber', contact: 'contactNumber', phone: 'contactNumber', mobilenumber: 'contactNumber',
};

const validateRows = (rawRows: Record<string, unknown>[]) => {
  const usernames = new Set<string>();
  const utNumbers = new Set<string>();
  const emails = new Set<string>();
  return rawRows.map((raw, index): StudentRow => {
    const mapped: Partial<StudentRow> = {};
    for (const [header, value] of Object.entries(raw)) {
      const key = aliases[normalizeHeader(header)];
      if (key) mapped[key] = textValue(value);
    }
    const row: StudentRow = {
      rowNumber: index + 2,
      fullName: mapped.fullName ?? '',
      username: (mapped.username ?? '').toLowerCase(),
      googleEmail: (mapped.googleEmail ?? '').toLowerCase(),
      utNumber: (mapped.utNumber ?? '').toUpperCase(),
      contactNumber: mapped.contactNumber ?? '',
      errors: [],
    };
    if (row.fullName.length < 2) row.errors.push('Full Name required');
    if (!/^[a-z0-9._-]{3,50}$/i.test(row.username)) row.errors.push('Invalid Username');
    if (!/^[a-z0-9/_-]{2,50}$/i.test(row.utNumber)) row.errors.push('Invalid UT Number');
    if (row.googleEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.googleEmail)) row.errors.push('Invalid Email');
    if (usernames.has(row.username)) row.errors.push('Duplicate Username');
    if (utNumbers.has(row.utNumber)) row.errors.push('Duplicate UT Number');
    if (row.googleEmail && emails.has(row.googleEmail)) row.errors.push('Duplicate Email');
    usernames.add(row.username);
    utNumbers.add(row.utNumber);
    if (row.googleEmail) emails.add(row.googleEmail);
    return row;
  });
};

const downloadWorkbook = (rows: Record<string, unknown>[], filename: string, sheetName: string) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

export default function BulkStudentAccountsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [filename, setFilename] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [provisionedPassword, setProvisionedPassword] = useState('');
  const [result, setResult] = useState<ProvisionResponse | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const invalidCount = useMemo(() => rows.filter((row) => row.errors.length > 0).length, [rows]);
  const passwordValid = initialPassword.length >= 12 && initialPassword.length <= 72 && /[A-Z]/.test(initialPassword) && /[a-z]/.test(initialPassword) && /[0-9]/.test(initialPassword);

  const downloadTemplate = () => downloadWorkbook([
    { 'Full Name': 'Sample Student', Username: 'sample.student', 'Google Email': 'student@gmail.com', 'UT Number': 'UT0001', 'Contact Number': '0771234567' },
  ], 'TIC360-student-import-template.xlsx', 'Students');

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage(''); setResult(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      if (parsed.length === 0) throw new Error('The selected file has no student rows.');
      if (parsed.length > 500) throw new Error('One import can contain a maximum of 500 students.');
      setRows(validateRows(parsed));
      setFilename(file.name);
    } catch (error) {
      setRows([]); setFilename('');
      setMessage(error instanceof Error ? error.message : 'The file could not be read.');
    }
  };

  const createAccounts = async () => {
    if (!rows.length || invalidCount || !passwordValid) return;
    setBusy(true); setMessage(''); setResult(null);
    const { data, error } = await supabase.functions.invoke<ProvisionResponse>('bulk-provision-students', {
      body: {
        initialPassword,
        students: rows.map(({ errors: _errors, ...row }) => row),
      },
    });
    setBusy(false);
    if (error) {
      const context = error.context as Response | undefined;
      let details: ProvisionResponse | null = null;
      try { details = context ? await context.json() as ProvisionResponse : null; } catch { /* response was not JSON */ }
      setResult(details);
      setMessage(details?.error ?? error.message);
      return;
    }
    setResult(data);
    if ((data?.succeeded ?? 0) > 0) {
      setProvisionedPassword(initialPassword);
      setInitialPassword('');
    }
  };

  const exportCreatedCredentials = () => {
    const successful = result?.results?.filter((item) => item.success) ?? [];
    if (!successful.length) return;
    downloadWorkbook(successful.map((item) => ({ Username: item.username, 'UT Number': item.utNumber ?? '', 'Temporary Password': provisionedPassword })), 'TIC360-created-student-accounts.xlsx', 'Credentials');
    setProvisionedPassword('');
  };

  return (
    <div className="space-y-6 text-slate-700">
      <section className="rounded-3xl bg-[#102A43] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#F5B923]/40 bg-[#F5B923]/10 px-3 py-1 text-xs font-bold text-[#F5B923]"><ShieldCheck className="h-4 w-4" /> ADMIN ONLY</div>
            <h1 className="text-2xl font-black sm:text-3xl">Bulk Student Account Creation</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Upload an Excel or CSV file, validate every row, preview the data and securely provision up to 500 student logins.</p>
          </div>
          <button onClick={downloadTemplate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15"><Download className="h-4 w-4" /> Download template</button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-[#102A43]">1. Select student file</h2>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-[#0D9488] hover:bg-teal-50/40">
            <Upload className="h-8 w-8 text-[#0D9488]" /><span className="mt-3 font-bold text-[#102A43]">Choose Excel or CSV</span><span className="mt-1 text-xs text-slate-500">.xlsx, .xls or .csv · maximum 500 rows</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="sr-only" />
          </label>
          {filename && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><FileSpreadsheet className="h-4 w-4" /> {filename}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-[#102A43]">2. Set temporary password</h2>
          <input type="password" autoComplete="new-password" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} placeholder="Minimum 12 characters" className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-100" />
          <p className={`mt-2 text-xs ${initialPassword && !passwordValid ? 'text-red-600' : 'text-slate-500'}`}>12–72 characters with uppercase, lowercase and a number. Students must change it on first login; it expires in 7 days.</p>
          <button onClick={createAccounts} disabled={!rows.length || invalidCount > 0 || !passwordValid || busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} {busy ? 'Creating accounts…' : `Create ${rows.length || ''} student accounts`}
          </button>
        </div>
      </section>

      {message && <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><span>{message}</span></div>}

      {result && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-extrabold text-[#102A43]">Provisioning result</h2><p className="mt-1 text-sm text-slate-500">Created {result.succeeded ?? 0} · Failed {result.failed ?? 0} · Requested {result.requested ?? result.results?.length ?? 0}</p></div>
          {(result.succeeded ?? 0) > 0 && provisionedPassword && <button onClick={exportCreatedCredentials} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700"><Download className="h-4 w-4" /> One-time credential export</button>}
        </div>
        {!!result.results?.length && <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[640px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Row</th><th className="p-3">Username</th><th className="p-3">UT Number</th><th className="p-3">Status</th><th className="p-3">Details</th></tr></thead><tbody>{result.results.map((item, index) => <tr key={`${item.rowNumber}-${index}`} className="border-t border-slate-100"><td className="p-3">{item.rowNumber}</td><td className="p-3 font-semibold">{item.username}</td><td className="p-3">{item.utNumber}</td><td className="p-3">{item.success ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-4 w-4" /> Created</span> : <span className="text-red-700">Failed</span>}</td><td className="p-3 text-slate-500">{item.error ?? 'Ready for first login'}</td></tr>)}</tbody></table></div>}
      </section>}

      {!!rows.length && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-extrabold text-[#102A43]">3. Review import</h2><p className="mt-1 text-sm text-slate-500">{rows.length} rows · {invalidCount ? `${invalidCount} rows need correction` : 'All rows pass local validation'}</p></div>{invalidCount === 0 && <CheckCircle2 className="h-6 w-6 text-green-600" />}</div>
        <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border border-slate-200"><table className="w-full min-w-[900px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Row</th><th className="p-3">Full Name</th><th className="p-3">Username</th><th className="p-3">Google Email</th><th className="p-3">UT Number</th><th className="p-3">Contact</th><th className="p-3">Validation</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber} className={`border-t border-slate-100 ${row.errors.length ? 'bg-red-50' : ''}`}><td className="p-3">{row.rowNumber}</td><td className="p-3 font-semibold">{row.fullName}</td><td className="p-3">{row.username}</td><td className="p-3">{row.googleEmail || '—'}</td><td className="p-3">{row.utNumber}</td><td className="p-3">{row.contactNumber || '—'}</td><td className={`p-3 text-xs font-semibold ${row.errors.length ? 'text-red-700' : 'text-green-700'}`}>{row.errors.join(', ') || 'Valid'}</td></tr>)}</tbody></table></div>
      </section>}
    </div>
  );
}
