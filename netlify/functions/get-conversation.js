import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bamwcozzfshuozsfmjah.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const params = event.queryStringParameters || {};
  const conversation_id = params.conversation_id;
  const since = params.since;

  if (!conversation_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'conversation_id requis' }) };

  let query = supabase.from('support_messages').select('*').eq('conversation_id', conversation_id).order('created_at', { ascending: true });
  if (since) query = query.gt('created_at', since);

  const { data: messages, error } = await query;
  if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

  return { statusCode: 200, headers, body: JSON.stringify({ messages: messages || [] }) };
};
