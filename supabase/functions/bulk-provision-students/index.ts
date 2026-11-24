import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type StudentInput = {
  rowNumber?: unknown;
  fullName?: unknown;
  username?: unknown;
  googleEmail?: unknown;
  utNumber?: unknown;
  contactNumber?: unknown;
};

type CleanStudent = {
  rowNumber: number;
  fullName: string;
  username: string;
  googleEmail: string | null;
  utNumber: string;
  contactNumber: string | null;
};

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const usernamePattern = /^[a-z0-9._-]{3,50}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const utPattern = /^[a-z0-9/_-]{2,50}$/i;

const validateStudent = (input: StudentInput, index: number) => {
  const value: CleanStudent = {
    rowNumber: Number.isInteger(input.rowNumber) ? Number(input.rowNumber) : index + 2,
    fullName: clean(input.fullName),
    username: clean(input.username).toLowerCase(),
    googleEmail: clean(input.googleEmail).toLowerCase() || null,
    utNumber: clean(input.utNumber).toUpperCase(),
    contactNumber: clean(input.contactNumber) || null,
  };
  const errors: string[] = [];
  if (value.fullName.length < 2 || value.fullName.length > 150) errors.push('Full name must contain 2-150 characters.');
  if (!usernamePattern.test(value.username)) errors.push('Username must contain 3-50 letters, numbers, dots, underscores or hyphens.');
  if (!utPattern.test(value.utNumber)) errors.push('UT number must contain 2-50 letters, numbers, /, _ or -.');
  if (value.googleEmail && !emailPattern.test(value.googleEmail)) errors.push('Google email is invalid.');
  if (value.contactNumber && value.contactNumber.length > 30) errors.push('Contact number is too long.');
  return { value, errors };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication is required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) return json({ error: 'Provisioning service is not configured.' }, 500);

  const token = authorization.slice('Bearer '.length);
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'Your session is invalid or expired.' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: actor, error: actorError } = await adminClient
    .from('profiles')
    .select('id,role,account_status')
    .eq('id', userData.user.id)
    .single();
  if (actorError || !actor || actor.role !== 'Admin' || actor.account_status !== 'Active') {
    return json({ error: 'Only an active LMS administrator can create accounts.' }, 403);
  }

  let payload: { students?: unknown; initialPassword?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON request.' }, 400);
  }
  const initialPassword = clean(payload.initialPassword);
  if (initialPassword.length < 12 || initialPassword.length > 72 ||
      !/[A-Z]/.test(initialPassword) || !/[a-z]/.test(initialPassword) || !/[0-9]/.test(initialPassword)) {
    return json({ error: 'Initial password must contain 12-72 characters with uppercase, lowercase and a number.' }, 400);
  }
  if (!Array.isArray(payload.students) || payload.students.length === 0 || payload.students.length > 500) {
    return json({ error: 'Provide between 1 and 500 student rows.' }, 400);
  }

  const validated = payload.students.map((item, index) => validateStudent((item ?? {}) as StudentInput, index));
  const seenUsernames = new Set<string>();
  const seenUtNumbers = new Set<string>();
  const seenEmails = new Set<string>();
  for (const item of validated) {
    if (seenUsernames.has(item.value.username)) item.errors.push('Username is duplicated in this file.');
    if (seenUtNumbers.has(item.value.utNumber)) item.errors.push('UT number is duplicated in this file.');
    if (item.value.googleEmail && seenEmails.has(item.value.googleEmail)) item.errors.push('Google email is duplicated in this file.');
    seenUsernames.add(item.value.username);
    seenUtNumbers.add(item.value.utNumber);
    if (item.value.googleEmail) seenEmails.add(item.value.googleEmail);
  }
  const invalid = validated.filter((item) => item.errors.length > 0);
  if (invalid.length) {
    return json({
      error: 'Validation failed. No accounts were created.',
      results: invalid.map((item) => ({ rowNumber: item.value.rowNumber, username: item.value.username, success: false, error: item.errors.join(' ') })),
    }, 400);
  }

  const results: Array<Record<string, unknown>> = [];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  for (const { value } of validated) {
    const authEmail = `${value.username}@auth.unicomtic.local`;
    const { data: existingUsername } = await adminClient
      .from('profiles').select('id').eq('username', value.username).maybeSingle();
    const { data: existingEmail } = value.googleEmail
      ? await adminClient.from('profiles').select('id').eq('google_email', value.googleEmail).maybeSingle()
      : { data: null };
    const { data: existingStudent } = await adminClient
      .from('students').select('id').eq('ut_number', value.utNumber).maybeSingle();
    if (existingUsername || existingEmail || existingStudent) {
      results.push({ rowNumber: value.rowNumber, username: value.username, utNumber: value.utNumber, success: false, error: 'Username, Google email or UT number already exists.' });
      continue;
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: authEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { username: value.username, full_name: value.fullName },
    });
    if (createError || !created.user) {
      results.push({ rowNumber: value.rowNumber, username: value.username, utNumber: value.utNumber, success: false, error: createError?.message ?? 'Account could not be created.' });
      continue;
    }

    const userId = created.user.id;
    const { error: profileError } = await adminClient.from('profiles').update({
      username: value.username,
      full_name: value.fullName,
      google_email: value.googleEmail,
      phone: value.contactNumber,
      role: 'Student',
      account_status: 'Active',
      must_change_password: true,
      temporary_password_expires_at: expiresAt,
    }).eq('id', userId);
    const { error: studentError } = profileError
      ? { error: profileError }
      : await adminClient.from('students').insert({ profile_id: userId, ut_number: value.utNumber, contact_number: value.contactNumber });

    if (profileError || studentError) {
      await adminClient.auth.admin.deleteUser(userId);
      results.push({ rowNumber: value.rowNumber, username: value.username, utNumber: value.utNumber, success: false, error: 'Database record could not be created; the login was rolled back.' });
      continue;
    }
    results.push({ rowNumber: value.rowNumber, username: value.username, utNumber: value.utNumber, success: true, userId });
  }

  const succeeded = results.filter((item) => item.success).length;
  const failed = results.length - succeeded;
  await adminClient.from('audit_logs').insert({
    actor_id: actor.id,
    action: 'BULK_STUDENT_ACCOUNTS_CREATED',
    entity_type: 'student_batch',
    details: { requested: results.length, succeeded, failed, source: 'bulk-provision-students' },
    user_agent: request.headers.get('user-agent'),
  });
  return json({ success: failed === 0, requested: results.length, succeeded, failed, results });
});
