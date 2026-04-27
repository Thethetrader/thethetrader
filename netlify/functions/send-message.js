import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// Simple in-memory rate limiting (resets on cold start)
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

export default async function handler(req, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const ip = context.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) return new Response(JSON.stringify({ error: 'Trop de messages, réessaie dans une minute.' }), { status: 429, headers });

  // Detect admin via Bearer token
  let isAdmin = false;
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user && user.email === ADMIN_EMAIL) isAdmin = true;
  }

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }); }

  const { conversation_id, visitor_name, visitor_email, message_type = 'text', content, file_data, file_name, file_mime } = body;

  // Validate
  if (!message_type || !['text', 'image', 'pdf', 'audio'].includes(message_type)) {
    return new Response(JSON.stringify({ error: 'message_type invalide' }), { status: 400, headers });
  }
  if (message_type === 'text' && (!content || content.trim().length === 0)) {
    return new Response(JSON.stringify({ error: 'Contenu vide' }), { status: 400, headers });
  }
  if (['image', 'pdf', 'audio'].includes(message_type) && file_data) {
    if (!ALLOWED_MIME.includes(file_mime)) {
      return new Response(JSON.stringify({ error: 'Type de fichier non autorisé' }), { status: 400, headers });
    }
  }

  // Get or create conversation
  let convId = conversation_id;
  if (!convId) {
    if (!visitor_email) return new Response(JSON.stringify({ error: 'visitor_email requis' }), { status: 400, headers });
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ visitor_name: visitor_name || visitor_email.split('@')[0], visitor_email, status: 'active' })
      .select('id')
      .single();
    if (convErr) return new Response(JSON.stringify({ error: convErr.message }), { status: 500, headers });
    convId = conv.id;
  }

  // Handle file upload
  let file_url = null;
  if (['image', 'pdf', 'audio'].includes(message_type) && file_data) {
    const buf = Buffer.from(file_data, 'base64');
    const ext = file_mime.split('/')[1].replace('jpeg', 'jpg').replace('webm', 'webm');
    const path = `${convId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('chat-files').upload(path, buf, { contentType: file_mime, upsert: false });
    if (uploadErr) return new Response(JSON.stringify({ error: uploadErr.message }), { status: 500, headers });
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

  if (msgErr) return new Response(JSON.stringify({ error: msgErr.message }), { status: 500, headers });

  return new Response(JSON.stringify({ message, conversation_id: convId }), { status: 200, headers });
}
