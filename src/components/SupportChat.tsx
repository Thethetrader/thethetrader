import { useState, useEffect, useRef, useCallback } from 'react';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCreatedAt = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveConvId = (cid: string) => {
    setConversationId(cid);
    localStorage.setItem(storageKey(userId), cid);
  };

  const basePayload = () => ({
    conversation_id: conversationId ?? undefined,
    visitor_name: visitorName || userEmail.split('@')[0],
    visitor_email: userEmail,
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
    const file_data = await toBase64(file);
    await doSend({ message_type: isImage ? 'image' : 'pdf', file_data, file_name: file.name, file_mime: mime });
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
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 100) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const b64 = (reader.result as string).split(',')[1];
          await doSend({ message_type: 'audio', file_data: b64, file_name: 'vocal.webm', file_mime: mimeType });
        };
        reader.readAsDataURL(blob);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setRecordSecs(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>T</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            TheThe Trader
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Support — répond rapidement</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, margin: 'auto', paddingTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Comment puis-je t'aider ?</div>
            <div>Envoie un message ci-dessous.</div>
          </div>
        )}
        {messages.map((m) => {
          const isSent = m.sender_type === 'visitor';
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '78%', alignSelf: isSent ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding: m.message_type === 'text' ? '10px 14px' : '6px', borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isSent ? '#10b981' : '#fff', color: isSent ? '#fff' : '#0f172a', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.07)' }}>
                {m.message_type === 'text' && m.content}
                {m.message_type === 'image' && m.file_url && (
                  <img src={m.file_url} alt="image" style={{ maxWidth: 220, borderRadius: 12, display: 'block', cursor: 'pointer' }} onClick={() => window.open(m.file_url!)} />
                )}
                {m.message_type === 'pdf' && m.file_url && (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isSent ? '#fff' : '#10b981', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
                    📄 {m.file_name || 'document.pdf'}
                  </a>
                )}
                {m.message_type === 'audio' && m.file_url && (
                  <audio controls src={m.file_url} style={{ maxWidth: 220, display: 'block' }} />
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, padding: '0 4px' }}>{fmtTime(m.created_at)}</div>
            </div>
          );
        })}
        {error && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: '4px 8px' }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: '#fef2f2', borderRadius: 20, marginBottom: 8, border: '1px solid #fecaca' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#dc2626', flex: 1 }}>Enregistrement… {recordSecs}s</span>
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
            style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 20, padding: '9px 14px', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 80, fontFamily: 'inherit', background: '#f8f9fa', color: '#0f172a' }}
            onFocus={e => (e.target.style.borderColor = '#10b981')}
            onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
          />

          {/* Mic or Send */}
          {text.trim() ? (
            <button onClick={send} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          ) : (
            <button onClick={recording ? stopRecording : startRecording} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: recording ? '#ef4444' : '#e2e8f0', color: recording ? '#fff' : '#64748b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }} title={recording ? 'Arrêter' : 'Message vocal'}>
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
