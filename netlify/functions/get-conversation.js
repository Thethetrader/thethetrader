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
  const visitor_email = params.visitor_email;
  const since = params.since;

  // Lookup conversation by visitor_email (used when localStorage was cleared)
  if (!conversation_id && visitor_email) {
    const { data: conv, error: convErr } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('visitor_email', visitor_email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (convErr) return { statusCode: 500, headers, body: JSON.stringify({ error: convErr.message }) };
    if (!conv) return { statusCode: 200, headers, body: JSON.stringify({ conversation_id: null, messages: [] }) };
    const { data: messages, error: msgErr } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    if (msgErr) return { statusCode: 500, headers, body: JSON.stringify({ error: msgErr.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ conversation_id: conv.id, messages: messages || [] }) };
  }

  if (!conversation_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'conversation_id requis' }) };

  let query = supabase.from('support_messages').select('*').eq('conversation_id', conversation_id).order('created_at', { ascending: true });
  if (since) query = query.gt('created_at', since);

  const { data: messages, error } = await query;
  if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

  return { statusCode: 200, headers, body: JSON.stringify({ messages: messages || [] }) };
};
