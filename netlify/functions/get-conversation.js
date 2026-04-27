import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const url = new URL(req.url);
  const conversation_id = url.searchParams.get('conversation_id');
  const since = url.searchParams.get('since');

  if (!conversation_id) return new Response(JSON.stringify({ error: 'conversation_id requis' }), { status: 400, headers });

  let query = supabase.from('messages').select('*').eq('conversation_id', conversation_id).order('created_at', { ascending: true });
  if (since) query = query.gt('created_at', since);

  const { data: messages, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });

  return new Response(JSON.stringify({ messages: messages || [] }), { status: 200, headers });
}
