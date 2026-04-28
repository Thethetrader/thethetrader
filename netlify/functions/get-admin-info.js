const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';

const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs, body: '' };

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'no service key' }) };

  const supabase = createClient(SUPABASE_URL, serviceKey);

  // 1. Try user_profiles where role = 'admin'
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, avatar_url')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (profile?.name) {
    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ name: profile.name, avatar_url: profile.avatar_url || null }) };
  }

  // 2. Fallback: find admin in auth.users via user metadata
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const adminUser = users?.find(u =>
    u.user_metadata?.role === 'admin' ||
    u.app_metadata?.role === 'admin' ||
    u.email?.includes('admin') // last resort
  );

  if (adminUser) {
    const name = adminUser.user_metadata?.name || adminUser.email?.split('@')[0] || 'Admin';
    const avatar_url = adminUser.user_metadata?.avatar_url || null;

    // Upsert the profile with service key so it works next time
    await supabase.from('user_profiles').upsert({
      id: adminUser.id,
      name,
      email: adminUser.email,
      role: 'admin',
      avatar_url,
      updated_at: new Date().toISOString(),
    }).select();

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ name, avatar_url }) };
  }

  return { statusCode: 200, headers: hdrs, body: JSON.stringify({ name: null, avatar_url: null }) };
};
