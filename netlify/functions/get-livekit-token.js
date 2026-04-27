const crypto = require('crypto');
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

function b64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function createLiveKitJwt({ apiKey, apiSecret, identity, roomName, canPublish, canSubscribe, ttl = 14400 }) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: apiKey,
    sub: identity,
    iat: now,
    nbf: now,
    exp: now + ttl,
    video: { roomJoin: true, room: roomName, canPublish, canSubscribe },
  };
  const payload = b64url(JSON.stringify(claims));
  const sig = crypto
    .createHmac('sha256', apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${payload}.${sig}`;
}

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
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing roomName or userId' }) };
  }

  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'LIVEKIT_API_KEY ou LIVEKIT_API_SECRET manquant' }) };
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, plan_type')
      .eq('user_id', userId)
      .single();

    const isAdmin = profile?.role === 'admin';
    const plan = profile?.plan_type || 'journal';

    const accessRule = ROOM_ACCESS[roomName];
    if (accessRule === 'premium' && !isAdmin && plan === 'journal') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Premium required' }) };
    }
    if (accessRule === 'admin' && !isAdmin) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Admin only' }) };
    }

    const token = createLiveKitJwt({
      apiKey: LIVEKIT_API_KEY,
      apiSecret: LIVEKIT_API_SECRET,
      identity: identity || userId,
      roomName,
      canPublish: isAdmin && isPublisher,
      canSubscribe: true,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, url: process.env.LIVEKIT_URL }),
    };
  } catch (err) {
    console.error('LiveKit token error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
