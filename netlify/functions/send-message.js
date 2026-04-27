import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bamwcozzfshuozsfmjah.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 20;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { rateLimitMap.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= max) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'audio/webm', 'audio/ogg', 'audio/mp4'];

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const ip = event.headers['x-forwarded-for'] || 'unknown';
  if (isRateLimited(ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Trop de messages, réessaie dans une minute.' }) };

  // Detect admin via Bearer token
  let isAdmin = false;
  const authHeader = event.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user && user.email === ADMIN_EMAIL) isAdmin = true;
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { conversation_id, visitor_name, visitor_email, message_type = 'text', content, file_data, file_name, file_mime } = body;

  if (!message_type || !['text', 'image', 'pdf', 'audio'].includes(message_type)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'message_type invalide' }) };
  }
  if (message_type === 'text' && (!content || content.trim().length === 0)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Contenu vide' }) };
  }
  if (['image', 'pdf', 'audio'].includes(message_type) && file_data && !ALLOWED_MIME.includes(file_mime)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Type de fichier non autorisé' }) };
  }

  // Get or create conversation
  let convId = conversation_id;
  if (!convId) {
    if (!visitor_email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'visitor_email requis' }) };
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ visitor_name: visitor_name || visitor_email.split('@')[0], visitor_email, status: 'active' })
      .select('id')
      .single();
    if (convErr) return { statusCode: 500, headers, body: JSON.stringify({ error: convErr.message }) };
    convId = conv.id;
  }

  // Handle file upload
  let file_url = null;
  if (['image', 'pdf', 'audio'].includes(message_type) && file_data) {
    const buf = Buffer.from(file_data, 'base64');
    const ext = file_mime.split('/')[1].replace('jpeg', 'jpg');
    const path = `${convId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('chat-files').upload(path, buf, { contentType: file_mime, upsert: false });
    if (uploadErr) return { statusCode: 500, headers, body: JSON.stringify({ error: uploadErr.message }) };
    const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path);
    file_url = publicUrl;
  }

  // Insert message
  const { data: message, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_type: isAdmin ? 'admin' : 'visitor',
      message_type,
      content: message_type === 'text' ? content?.trim() : null,
      file_url,
      file_name: file_name || null,
      read_by_admin: isAdmin,
    })
    .select('*')
    .single();

  if (msgErr) return { statusCode: 500, headers, body: JSON.stringify({ error: msgErr.message }) };

  return { statusCode: 200, headers, body: JSON.stringify({ message, conversation_id: convId }) };
};
