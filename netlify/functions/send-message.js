import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > 60_000) { rateLimitMap.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= 20) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'audio/webm', 'audio/ogg', 'audio/mp4'];

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

  const supabase = createClient(SUPABASE_URL, serviceKey);

  try {
    const ip = event.headers['x-forwarded-for'] || 'unknown';
    if (isRateLimited(ip)) return { statusCode: 429, headers: hdrs, body: JSON.stringify({ error: 'Trop de messages, réessaie dans une minute.' }) };

    let isAdmin = false;
    const authHeader = event.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
      if (user) isAdmin = true;
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { conversation_id, visitor_name, visitor_email, message_type = 'text', content, file_data, file_name, file_mime } = body;

    if (!['text', 'image', 'pdf', 'audio'].includes(message_type))
      return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'message_type invalide' }) };
    if (message_type === 'text' && (!content || !content.trim()))
      return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Contenu vide' }) };

    let convId = conversation_id;
    if (!convId) {
      if (!visitor_email) return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'visitor_email requis' }) };
      const { data: conv, error: convErr } = await supabase
        .from('support_conversations')
        .insert({ visitor_name: visitor_name || visitor_email.split('@')[0], visitor_email, status: 'active' })
        .select('id').single();
      if (convErr) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'conv: ' + convErr.message }) };
      convId = conv.id;
    }

    let file_url = null;
    if (['image', 'pdf', 'audio'].includes(message_type) && file_data) {
      if (!ALLOWED_MIME.includes(file_mime))
        return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Type de fichier non autorisé' }) };
      const buf = Buffer.from(file_data, 'base64');
      const ext = file_mime.split('/')[1].replace('jpeg', 'jpg');
      const { error: uploadErr } = await supabase.storage.from('chat-files').upload(`${convId}/${Date.now()}.${ext}`, buf, { contentType: file_mime });
      if (uploadErr) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'upload: ' + uploadErr.message }) };
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(`${convId}/${Date.now()}.${ext}`);
      file_url = publicUrl;
    }

    const { data: message, error: msgErr } = await supabase
      .from('support_messages')
      .insert({ conversation_id: convId, sender_type: isAdmin ? 'admin' : 'visitor', message_type, content: message_type === 'text' ? content.trim() : null, file_url, file_name: file_name || null, read_by_admin: isAdmin })
      .select('*').single();

    if (msgErr) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'msg: ' + msgErr.message }) };

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ message, conversation_id: convId }) };

  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
