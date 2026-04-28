const { createClient } = require('@supabase/supabase-js');

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

  try {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { post_id, user_id, author_name, content } = body;
    if (!post_id || !user_id || !content?.trim()) return { statusCode: 400, headers: hdrs, body: JSON.stringify({ error: 'Champs manquants' }) };

    const { data: comment, error } = await supabase
      .from('home_comments')
      .insert({ post_id, user_id, author_name: author_name || 'Membre', content: content.trim() })
      .select('*').single();

    if (error) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: error.message }) };

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ comment }) };
  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
