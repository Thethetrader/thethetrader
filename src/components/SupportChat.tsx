import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeSupportPush } from '../utils/support-push';

const SEND_URL = '/.netlify/functions/send-message';
const GET_URL = '/.netlify/functions/get-conversation';
const POLL_MS = 5000;
const MAX_FILE_MB = 4;

type Msg = {
  id: string;
  sender_type: 'visitor' | 'admin';
  content: string | null;
  message_type: 'text' | 'image' | 'pdf' | 'audio';
  file_url: string | null;
  file_name: string | null;
  duration_seconds: number | null;
  created_at: string;
};

interface Props {
  userId: string;
  userEmail: string;
  visitorName: string;
  onNewAdminMessage?: () => void;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function storageKey(userId: string) { return `tplnchat_conv_${userId}`; }

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function postSend(payload: Record<string, unknown>) {
  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error || 'Erreur réseau');
  return json as { message: Msg; conversation_id: string };
}

export default function SupportChat({ userId, userEmail, visitorName, onNewAdminMessage }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(() => localStorage.getItem(storageKey(userId)));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [adminName, setAdminName] = useState('Support');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCreatedAt = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordSecsRef = useRef(0);

  const saveConvId = (cid: string) => {
    setConversationId(cid);
    localStorage.setItem(storageKey(userId), cid);
  };

  const basePayload = () => ({
    conversation_id: conversationId ?? undefined,
    visitor_name: visitorName || userEmail.split('@')[0],
    visitor_email: userEmail,
    visitor_id: userId,
  });

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const params = new URLSearchParams({ conversation_id: convId });
      if (lastCreatedAt.current) params.set('since', lastCreatedAt.current);
      const res = await fetch(`${GET_URL}?${params}`);
      if (!res.ok) return;
      const json = await res.json() as { messages: Msg[] };
      if (!json.messages?.length) return;
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const fresh = json.messages.filter((m: Msg) => !existingIds.has(m.id));
        if (!fresh.length) return prev;
        if (fresh.some((m: Msg) => m.sender_type === 'admin')) onNewAdminMessage?.();
        if (lastCreatedAt.current === null) {
          if (json.messages.length) lastCreatedAt.current = json.messages[json.messages.length - 1].created_at;
          return json.messages;
        }
        lastCreatedAt.current = fresh[fresh.length - 1].created_at;
        return [...prev, ...fresh];
      });
    } catch {}
  }, [onNewAdminMessage]);

  useEffect(() => {
    if (!conversationId) return;
    lastCreatedAt.current = null;
    fetchMessages(conversationId);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    pollRef.current = setInterval(() => fetchMessages(conversationId), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId, fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    supabase.from('user_profiles').select('name, avatar_url').eq('role', 'admin').limit(1).single()
      .then(({ data }) => {
        if (data?.name) setAdminName(data.name);
        if (data?.avatar_url) setAdminAvatar(data.avatar_url);
      });
  }, []);

  useEffect(() => {
    if (userId) subscribeSupportPush(userId, 'user');
  }, [userId]);

  async function doSend(payload: Record<string, unknown>) {
    setSending(true);
    setError('');
    try {
      const json = await postSend({ ...basePayload(), ...payload });
      if (!conversationId) saveConvId(json.conversation_id);
      setMessages(prev => [...prev, json.message]);
      lastCreatedAt.current = json.message.created_at;
    } catch (err: any) {
      if (conversationId && (err.message?.includes('foreign key') || err.message?.includes('violates') || err.message?.includes('conv'))) {
        localStorage.removeItem(storageKey(userId));
        setConversationId(null);
        setMessages([]);
        lastCreatedAt.current = null;
      }
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally { setSending(false); }
  }

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    await doSend({ message_type: 'text', content });
  }

  async function sendFile(file: File) {
    const mb = file.size / 1024 / 1024;
    if (mb > MAX_FILE_MB) { setError(`Fichier trop lourd (max ${MAX_FILE_MB} Mo)`); return; }
    const mime = file.type;
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    if (!isImage && !isPdf) { setError('Seuls les images et PDF sont acceptés'); return; }

    // Aperçu immédiat
    const localUrl = URL.createObjectURL(file);
    const tempId = `tmp_${Date.now()}`;
    const tempMsg: Msg = { id: tempId, sender_type: 'visitor', content: null, message_type: isImage ? 'image' : 'pdf', file_url: localUrl, file_name: file.name, duration_seconds: null, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    const file_data = await toBase64(file);
    setSending(true);
    setError('');
    try {
      const json = await postSend({ ...basePayload(), message_type: isImage ? 'image' : 'pdf', file_data, file_name: file.name, file_mime: mime });
      if (!conversationId) saveConvId(json.conversation_id);
      // Remplace le message temporaire par le vrai
      setMessages(prev => prev.map(m => m.id === tempId ? json.message : m));
      lastCreatedAt.current = json.message.created_at;
      URL.revokeObjectURL(localUrl);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      URL.revokeObjectURL(localUrl);
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally { setSending(false); }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        const duration = recordSecsRef.current;
        setRecordSecs(0);
        recordSecsRef.current = 0;
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 100) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const b64 = (reader.result as string).split(',')[1];
          await doSend({ message_type: 'audio', file_data: b64, file_name: 'vocal.webm', file_mime: mimeType, duration_seconds: duration });
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordSecsRef.current = 0;
      recordTimerRef.current = setInterval(() => {
        recordSecsRef.current += 1;
        setRecordSecs(s => s + 1);
      }, 1000);
    } catch { setError('Micro non disponible'); }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const btnStyle = (active = true): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: active ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s',
    background: 'transparent', color: '#94a3b8',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: '#1f2937', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
          {adminAvatar ? <img src={adminAvatar} alt={adminName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : adminName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 6 }}>
            {adminName}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Support — répond rapidement</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, margin: 'auto', paddingTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#9ca3af' }}>Comment puis-je t'aider ?</div>
            <div>Envoie un message ci-dessous.</div>
          </div>
        )}
        {messages.map((m) => {
          const isSent = m.sender_type === 'visitor';
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: isSent ? 'flex-end' : 'flex-start', marginLeft: isSent ? 'auto' : '0', marginRight: isSent ? '0' : 'auto' }}>
              <div style={{ padding: m.message_type === 'text' ? '10px 14px' : '6px', borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isSent ? '#10b981' : '#1f2937', color: '#f9fafb', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', border: isSent ? 'none' : '1px solid #374151' }}>
                {m.message_type === 'text' && m.content}
                {m.message_type === 'image' && m.file_url && (
                  <img src={m.file_url} alt="image" style={{ maxWidth: 220, borderRadius: 12, display: 'block', cursor: 'pointer' }} onClick={() => window.open(m.file_url!)} />
                )}
                {m.message_type === 'pdf' && m.file_url && (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
                    📄 {m.file_name || 'document.pdf'}
                  </a>
                )}
                {m.message_type === 'audio' && m.file_url && (
                  <audio controls src={m.file_url} style={{ maxWidth: 220, display: 'block' }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, padding: '0 4px' }}>{fmtTime(m.created_at)}</div>
            </div>
          );
        })}
        {error && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: '4px 8px' }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', background: '#1f2937', borderTop: '1px solid #374151' }}>
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', borderRadius: 20, marginBottom: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#fca5a5', flex: 1 }}>Enregistrement… {recordSecs}s</span>
            <button onClick={stopRecording} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Envoyer</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {/* File attachment */}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = ''; }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={sending || recording} style={{ ...btnStyle(!sending && !recording) }} title="Image ou PDF">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {/* Text */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Écrire ici..."
            maxLength={2000}
            disabled={sending || recording}
            style={{ flex: 1, border: '1px solid #374151', borderRadius: 20, padding: '9px 14px', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 80, fontFamily: 'inherit', background: '#111827', color: '#f9fafb' }}
            onFocus={e => (e.target.style.borderColor = '#10b981')}
            onBlur={e => (e.target.style.borderColor = '#374151')}
          />

          {/* Mic or Send */}
          {text.trim() ? (
            <button onClick={send} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          ) : (
            <button onClick={recording ? stopRecording : startRecording} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: recording ? '#ef4444' : '#374151', color: recording ? '#fff' : '#9ca3af', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }} title={recording ? 'Arrêter' : 'Message vocal'}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
