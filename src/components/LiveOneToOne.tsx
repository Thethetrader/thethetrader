import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

const SEND_URL = '/.netlify/functions/send-message';
const GET_URL = '/.netlify/functions/get-conversation';
const POLL_MS = 4000;
const MAX_FILE_MB = 4;

type Msg = {
  id: string;
  sender_type: 'visitor' | 'admin';
  content: string | null;
  message_type: 'text' | 'image' | 'pdf' | 'audio';
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

interface ChatProps {
  conversationId: string;
  senderType: 'admin' | 'visitor';
  senderName: string;
  senderEmail: string;
}

function SessionChat({ conversationId, senderType, senderName, senderEmail }: ChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastCreatedAt = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({ conversation_id: conversationId });
      if (lastCreatedAt.current) params.set('since', lastCreatedAt.current);
      const res = await fetch(`${GET_URL}?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.messages?.length) return;
      setMessages(prev => {
        const existingIds = new Set(prev.map((m: Msg) => m.id));
        const fresh = json.messages.filter((m: Msg) => !existingIds.has(m.id));
        if (!fresh.length) return prev;
        if (lastCreatedAt.current === null) {
          lastCreatedAt.current = json.messages[json.messages.length - 1].created_at;
          return json.messages;
        }
        lastCreatedAt.current = fresh[fresh.length - 1].created_at;
        return [...prev, ...fresh];
      });
    } catch {}
  }, [conversationId]);

  useEffect(() => {
    lastCreatedAt.current = null;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendText = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          visitor_name: senderName,
          visitor_email: senderEmail,
          sender_type: senderType,
          message_type: 'text',
          content: text.trim(),
        }),
      });
      setText('');
      setTimeout(fetchMessages, 300);
    } catch {} finally { setSending(false); }
  };

  const sendFile = async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) return;
    setSending(true);
    try {
      const isImage = file.type.startsWith('image/');
      const b64 = await toBase64(file);
      await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          visitor_name: senderName,
          visitor_email: senderEmail,
          sender_type: senderType,
          message_type: isImage ? 'image' : 'pdf',
          file_data: b64,
          file_name: file.name,
          file_mime: file.type,
        }),
      });
      setTimeout(fetchMessages, 300);
    } catch {} finally { setSending(false); }
  };

  const isSent = (m: Msg) => m.sender_type === senderType;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, margin: 'auto' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div>Aucun message pour l'instant</div>
          </div>
        )}
        {messages.map(m => {
          const sent = isSent(m);
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: sent ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '78%' }}>
                {m.message_type === 'image' && m.file_url ? (
                  <img src={m.file_url} alt="" style={{ maxWidth: '100%', borderRadius: 10, display: 'block' }} />
                ) : m.message_type === 'pdf' && m.file_url ? (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, background: sent ? '#10b981' : '#374151', color: '#fff', padding: '8px 12px', borderRadius: 10, fontSize: 13, textDecoration: 'none' }}>
                    📄 {m.file_name || 'Fichier'}
                  </a>
                ) : (
                  <div style={{ background: sent ? '#10b981' : '#1f2937', color: '#fff', padding: '8px 12px', borderRadius: sent ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.4, border: sent ? 'none' : '1px solid #374151' }}>
                    {m.content}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, textAlign: sent ? 'right' : 'left' }}>{fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid #374151', background: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf"
          onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = ''; }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
          </svg>
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendText())}
          placeholder="Message..."
          style={{ flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: 20, padding: '8px 14px', fontSize: 14, color: '#f9fafb', outline: 'none' }}
        />
        <button
          onClick={sendText}
          disabled={!text.trim() || sending}
          style={{ background: text.trim() ? '#10b981' : '#374151', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.2s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

interface SessionRoomProps {
  isAdmin: boolean;
  otherName?: string;
  onEnd?: () => void;
  conversationId?: string;
  senderType: 'admin' | 'visitor';
  senderName: string;
  senderEmail: string;
}

function SessionRoom({ isAdmin, otherName, onEnd, conversationId, senderType, senderName, senderEmail }: SessionRoomProps) {
  const [tab, setTab] = useState<'video' | 'chat'>('video');

  const allTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);
  const remoteVideo = allTracks.find(t => !t.participant.isLocal);
  const localVideo = allTracks.find(t => t.participant.isLocal);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-gray-700 bg-gray-800 flex-shrink-0" style={{ height: 52 }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-white font-medium">Session avec {otherName || (isAdmin ? 'Utilisateur' : 'Admin')}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab toggle */}
          {conversationId && (
            <div style={{ display: 'flex', background: '#111827', borderRadius: 8, padding: 2, gap: 2 }}>
              <button
                onClick={() => setTab('video')}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: tab === 'video' ? '#374151' : 'transparent', color: tab === 'video' ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: 13 }}
              >
                📹
              </button>
              <button
                onClick={() => setTab('chat')}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: tab === 'chat' ? '#374151' : 'transparent', color: tab === 'chat' ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: 13 }}
              >
                💬
              </button>
            </div>
          )}
          <button
            onClick={onEnd}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
          >
            Terminer
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'video' ? (
        <>
          <div className="flex-1 relative bg-black overflow-hidden">
            {remoteVideo ? (
              <VideoTrack trackRef={remoteVideo} className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
                <p className="text-sm">En attente de {isAdmin ? "l'utilisateur" : "l'admin"}...</p>
              </div>
            )}
            {localVideo && (
              <div style={{ position: 'absolute', bottom: 10, right: 10, width: 90, height: 120, borderRadius: 8, overflow: 'hidden', border: '2px solid #374151', background: '#000' }}>
                <VideoTrack trackRef={localVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <TrackToggle source={Track.Source.Microphone} className="flex flex-col items-center gap-1 text-xs text-gray-300" />
            <TrackToggle source={Track.Source.Camera} className="flex flex-col items-center gap-1 text-xs text-gray-300" />
          </div>
        </>
      ) : (
        conversationId ? (
          <SessionChat
            conversationId={conversationId}
            senderType={senderType}
            senderName={senderName}
            senderEmail={senderEmail}
          />
        ) : null
      )}
    </div>
  );
}

export interface LiveOneToOneProps {
  roomName: string;
  userId: string;
  identity?: string;
  isAdmin?: boolean;
  otherName?: string;
  onEnd?: () => void;
  conversationId?: string;
  senderName?: string;
  senderEmail?: string;
}

export default function LiveOneToOne({ roomName, userId, identity, isAdmin = false, otherName, onEnd, conversationId, senderName, senderEmail }: LiveOneToOneProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId, identity, isPublisher: isAdmin }),
      });
      if (!res.ok) throw new Error('Erreur token');
      const data = await res.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch {
      setError('Impossible de rejoindre la session.');
    } finally {
      setLoading(false);
    }
  }, [roomName, userId, identity, isAdmin]);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 gap-3">
        <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
        <span className="text-sm">Connexion...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <p className="text-sm">{error}</p>
        <button onClick={fetchToken} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">
          Réessayer
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) return null;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      style={{ height: '100%' }}
    >
      <RoomAudioRenderer />
      <SessionRoom
        isAdmin={isAdmin}
        otherName={otherName}
        onEnd={onEnd}
        conversationId={conversationId}
        senderType={isAdmin ? 'admin' : 'visitor'}
        senderName={senderName || (isAdmin ? 'Admin' : 'Utilisateur')}
        senderEmail={senderEmail || ''}
      />
    </LiveKitRoom>
  );
}
