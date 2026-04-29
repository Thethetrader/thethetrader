import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bamwcozzfshuozsfmjah.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'DELETE') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const body = JSON.parse(event.body || '{}');
  const { conversation_id, visitor_id } = body;

  if (!conversation_id || !visitor_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'conversation_id et visitor_id requis' }) };
  }

  // Verify the conversation belongs to this visitor
  const { data: conv, error: convErr } = await supabase
    .from('support_conversations')
    .select('id, visitor_id')
    .eq('id', conversation_id)
    .eq('visitor_id', visitor_id)
    .maybeSingle();

  if (convErr) return { statusCode: 500, headers, body: JSON.stringify({ error: convErr.message }) };
  if (!conv) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Conversation introuvable ou accès refusé' }) };

  // Delete messages first (foreign key constraint)
  const { error: msgErr } = await supabase
    .from('support_messages')
    .delete()
    .eq('conversation_id', conversation_id);

  if (msgErr) return { statusCode: 500, headers, body: JSON.stringify({ error: msgErr.message }) };

  // Delete the conversation
  const { error: delErr } = await supabase
    .from('support_conversations')
    .delete()
    .eq('id', conversation_id);

  if (delErr) return { statusCode: 500, headers, body: JSON.stringify({ error: delErr.message }) };

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
