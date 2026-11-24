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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return json({ error: 'Authentication is required.' }, 401);
  }

  let payload: { password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON request.' }, 400);
  }

  const password = typeof payload.password === 'string' ? payload.password : '';
  if (password.length < 12 || password.length > 72) {
    return json({ error: 'Password must contain between 12 and 72 characters.' }, 400);
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return json({ error: 'Password must include uppercase, lowercase and numeric characters.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return json({ error: 'Password service is not configured.' }, 500);
  }

  const token = authorization.slice('Bearer '.length);
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: 'Your session is invalid or expired.' }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id,account_status,must_change_password,temporary_password_expires_at')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile || profile.account_status !== 'Active') {
    return json({ error: 'Your LMS account is not active.' }, 403);
  }
  if (!profile.must_change_password) {
    return json({ error: 'The initial password was already changed.' }, 409);
  }
  if (
    profile.temporary_password_expires_at &&
    new Date(profile.temporary_password_expires_at).getTime() < Date.now()
  ) {
    return json({ error: 'The temporary password has expired. Contact an administrator.' }, 403);
  }

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(
    userData.user.id,
    { password }
  );
  if (passwordError) {
    return json({ error: 'Password could not be updated.' }, 500);
  }

  const changedAt = new Date().toISOString();
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      must_change_password: false,
      first_login_completed_at: changedAt,
      last_password_change_at: changedAt,
      temporary_password_expires_at: null,
      updated_at: changedAt,
    })
    .eq('id', userData.user.id);

  if (updateError) {
    return json({ error: 'Password changed, but account state could not be finalized. Try again.' }, 500);
  }

  await adminClient.from('audit_logs').insert({
    actor_id: userData.user.id,
    action: 'INITIAL_PASSWORD_CHANGED',
    entity_type: 'profile',
    entity_id: userData.user.id,
    details: { source: 'change-initial-password' },
  });

  return json({ success: true });
});
