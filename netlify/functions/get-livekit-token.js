const { createClient } = require('@supabase/supabase-js');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ROOM_ACCESS = {
  'stream-public': 'all',
  'stream-premium': 'premium',
  'stream-admin': 'admin',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { roomName, userId, identity, isPublisher = false } = body;

  if (!roomName || !userId) {
    return { statusCode: 400, body: 'Missing roomName or userId' };
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'LIVEKIT_API_KEY / LIVEKIT_API_SECRET manquants dans Netlify' }),
    };
  }

  try {
    // Dynamic import for ESM-only livekit-server-sdk
    const { AccessToken } = await import('livekit-server-sdk');

    // Fetch user profile to check plan and role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, plan_type')
      .eq('user_id', userId)
      .single();

    const isAdmin = profile?.role === 'admin';
    const plan = profile?.plan_type || 'journal';

    // Check access for the requested room
    const accessRule = ROOM_ACCESS[roomName];
    if (accessRule === 'premium' && !isAdmin && plan === 'journal') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Premium required' }) };
    }
    if (accessRule === 'admin' && !isAdmin) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Admin only' }) };
    }

    const canPublish = isAdmin && isPublisher;

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: identity || userId,
      ttl: 14400,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
      canPublishData: isAdmin,
    });

    const jwt = await token.toJwt();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: jwt, url: process.env.LIVEKIT_URL }),
    };
  } catch (err) {
    console.error('LiveKit token error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
