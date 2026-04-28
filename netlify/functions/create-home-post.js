const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const TYPE_LABELS = { achat: '📈 Achat', suivi_trade: '📊 Suivi de trade', news: '📰 News', info: 'ℹ️ Info' };

async function sendPush(subscription, title, body) {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return;
  try {
    webpush.setVapidDetails('mailto:support@thethetrader.com', vapidPublic, vapidPrivate);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: '/FAVICON.png', badge: '/FAVICON.png', tag: 'home-feed' })
    );
  } catch (_) {}
}

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';
const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: hdrs, body: JSON.stringify({ error: 'Method not allowed' }) };

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'Not configured' }) };

  const supabase = createClient(SUPABASE_URL, serviceKey);

  const authHeader = event.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return { statusCode: 401, headers: hdrs, body: JSON.stringify({ error: 'Non autorisé' }) };

  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
  if (authErr || !user) return { statusCode: 401, headers: hdrs, body: JSON.stringify({ error: 'Non autorisé' }) };

  try {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { type, content, image_data, image_mime } = body;
    const VALID_TYPES = ['achat', 'suivi_trade', 'news', 'info'];
    if (!VALID_TYPES.includes(type)) return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Type invalide' }) };
    if (!content?.trim()) return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Contenu requis' }) };

    let image_url = null;
    if (image_data && image_mime) {
      const buf = Buffer.from(image_data, 'base64');
      const ext = image_mime.split('/')[1].replace('jpeg', 'jpg');
      const path = `home/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('chat-files').upload(path, buf, { contentType: image_mime });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path);
        image_url = publicUrl;
      }
    }

    const { data: post, error } = await supabase
      .from('home_posts')
      .insert({ type, content: content.trim(), image_url, author_name: 'Admin' })
      .select('*').single();

    if (error) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: error.message }) };

    // Push notifications to all users (best-effort)
    try {
      const { data: tokens } = await supabase.from('push_tokens').select('subscription').neq('role', 'admin');
      if (tokens?.length) {
        const title = TYPE_LABELS[type] || 'Nouvelle publication';
        const preview = content.trim().length > 80 ? content.trim().slice(0, 80) + '…' : content.trim();
        await Promise.allSettled(tokens.map(t => t.subscription ? sendPush(t.subscription, title, preview) : null));
      }
    } catch (_) {}

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ post: { ...post, reactions: [], comments: [] } }) };
  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
