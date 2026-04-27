import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

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

async function sendPush(subscription, title, body) {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return;
  try {
    webpush.setVapidDetails('mailto:support@thethetrader.com', vapidPublic, vapidPrivate);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: '/FAVICON.png', badge: '/FAVICON.png', tag: 'support-chat' })
    );
  } catch (e) {
    // Subscription expirée ou invalide — best effort
  }
}

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

    const { conversation_id, visitor_name, visitor_email, visitor_id, message_type = 'text', content, file_data, file_name, file_mime, duration_seconds } = body;

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
      const storagePath = `${convId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('chat-files').upload(storagePath, buf, { contentType: file_mime });
      if (uploadErr) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'upload: ' + uploadErr.message }) };
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(storagePath);
      file_url = publicUrl;
    }

    const { data: message, error: msgErr } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: convId,
        sender_type: isAdmin ? 'admin' : 'visitor',
        message_type,
        content: message_type === 'text' ? content.trim() : null,
        file_url,
        file_name: file_name || null,
        duration_seconds: duration_seconds || null,
        read_by_admin: isAdmin,
      })
      .select('*').single();

    if (msgErr) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'msg: ' + msgErr.message }) };

    // Envoyer notification push au destinataire (best-effort)
    const preview = message_type === 'text'
      ? (content.trim().length > 80 ? content.trim().slice(0, 80) + '…' : content.trim())
      : message_type === 'image' ? '📷 Image'
      : message_type === 'pdf' ? '📄 PDF'
      : '🎙️ Message vocal';

    if (isAdmin) {
      // Admin → notifier le visiteur
      const userKey = visitor_id || visitor_email;
      if (userKey) {
        const { data: row } = await supabase.from('push_tokens').select('subscription').eq('user_key', userKey).single();
        if (row?.subscription) await sendPush(row.subscription, 'Support', preview);
      }
    } else {
      // Visiteur → notifier l'admin
      const { data: rows } = await supabase.from('push_tokens').select('subscription').eq('role', 'admin').order('updated_at', { ascending: false }).limit(1);
      if (rows?.[0]?.subscription) {
        const senderName = visitor_name || visitor_email?.split('@')[0] || 'Utilisateur';
        await sendPush(rows[0].subscription, `💬 ${senderName}`, preview);
      }
    }

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ message, conversation_id: convId }) };

  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
