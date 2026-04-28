const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bamwcozzfshuozsfmjah.supabase.co';
const hdrs = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: hdrs, body: '' };

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: 'Not configured' }) };

  const supabase = createClient(SUPABASE_URL, serviceKey);

  try {
    const { data: posts, error } = await supabase
      .from('home_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: error.message }) };

    const postIds = (posts || []).map(p => p.id);
    let reactions = [];
    let comments = [];

    if (postIds.length > 0) {
      const { data: r } = await supabase.from('home_reactions').select('*').in('post_id', postIds);
      reactions = r || [];
      const { data: c } = await supabase.from('home_comments').select('*').in('post_id', postIds).order('created_at', { ascending: true });
      comments = c || [];
    }

    const postsWithData = (posts || []).map(post => ({
      ...post,
      reactions: reactions.filter(r => r.post_id === post.id),
      comments: comments.filter(c => c.post_id === post.id),
    }));

    return { statusCode: 200, headers: hdrs, body: JSON.stringify({ posts: postsWithData }) };
  } catch (e) {
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
