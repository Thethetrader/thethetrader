import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';

const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: hdrs, body: JSON.stringify({ error: 'Method not allowed' }) };

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };

  // Only allow authenticated users (admins) to call this
  const authHeader = event.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return { statusCode: 401, headers: hdrs, body: JSON.stringify({ error: 'Non autorisé' }) };

  const supabase = createClient(SUPABASE_URL, serviceKey);

  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return { statusCode: 401, headers: hdrs, body: JSON.stringify({ error: 'Token invalide' }) };

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: error.message }) };

    const users = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.username || u.email?.split('@')[0] || '',
      created_at: u.created_at,
    }));

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ users }) };
  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
