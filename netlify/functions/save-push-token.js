import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';

const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: hdrs, body: JSON.stringify({ error: 'Method not allowed' }) };

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { user_key, subscription, role } = body;
  if (!user_key || !subscription) return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'user_key and subscription required' }) };

  const supabase = createClient(SUPABASE_URL, serviceKey);

  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_key, subscription, role: role || 'user', updated_at: new Date().toISOString() }, { onConflict: 'user_key' });

  if (error) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: error.message }) };

  return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
};
