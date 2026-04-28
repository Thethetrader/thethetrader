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

  // Try every possible way to find the admin profile
  const attempts = [
    () => supabase.from('user_profiles').select('name, avatar_url').eq('role', 'admin').limit(1).maybeSingle(),
    () => supabase.from('user_profiles').select('name, avatar_url').eq('user_type', 'admin').limit(1).maybeSingle(),
    () => supabase.from('user_profiles').select('name, avatar_url').ilike('role', '%admin%').limit(1).maybeSingle(),
  ];

  for (const attempt of attempts) {
    const { data } = await attempt();
    if (data?.name) {
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ name: data.name, avatar_url: data.avatar_url || null }) };
    }
  }

  return { statusCode: 200, headers: hdrs, body: JSON.stringify({ name: null, avatar_url: null }) };
};
