import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SEND_URL = '/.netlify/functions/send-message';

type Conv = {
  id: string;
  visitor_name: string;
  visitor_email: string;
  status: 'active' | 'resolved';
  last_message_at: string | null;
  created_at: string;
  unread: number;
  preview: string;
};

type Msg = {
  id: string;
  sender_type: 'visitor' | 'admin';
  content: string | null;
  message_type: 'text' | 'image' | 'pdf' | 'audio';
  file_url: string | null;
  file_name: string | null;
  duration_seconds: number | null;
  created_at: string;
  read_by_admin: boolean;
};

const fmt = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const fmtRel = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso); const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmt(iso);
  const days = Math.round((now.getTime() - d.getTime()) / 86400000);
  return days < 7 ? `${days}j` : d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' });
};

export default function SupportAdminChat() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('id, visitor_name, visitor_email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) { console.error('Support convs:', error); setLoading(false); return; }

    const convs: Conv[] = await Promise.all((data || []).map(async (c) => {
      const { count } = await supabase.from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id).eq('sender_type', 'visitor').eq('read_by_admin', false);
      const { data: last } = await supabase.from('support_messages')
        .select('content, message_type, created_at').eq('conversation_id', c.id)
        .order('created_at', { ascending: false }).limit(1);
      return {
        ...c,
        last_message_at: last?.[0] ? (last[0] as any).created_at : null,
        unread: count || 0,
        preview: last?.[0] ? (last[0].message_type === 'text' ? (last[0].content || '') : `[${last[0].message_type}]`) : '',
      };
    }));
    setConversations(convs);
    setLoading(false);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    const { data } = await supabase.from('support_messages')
      .select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase.from('support_messages').update({ read_by_admin: true })
      .eq('conversation_id', id).eq('sender_type', 'visitor').eq('read_by_admin', false);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    loadConversations();
    const ch = supabase.channel('support-admin-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, async (payload) => {
        const m = payload.new as Msg;
        if ((m as any).conversation_id === activeId) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_type === 'visitor') {
            await supabase.from('support_messages').update({ read_by_admin: true }).eq('id', m.id);
          }
        } else {
          setConversations(prev => prev.map(c =>
            c.id === (m as any).conversation_id
              ? { ...c, unread: m.sender_type === 'visitor' ? c.unread + 1 : c.unread, preview: m.content || `[${m.message_type}]`, last_message_at: m.created_at }
              : c
          ));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_conversations' }, () => loadConversations())
      .subscribe();
    realtimeRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [activeId, loadConversations]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  }

  async function doSend(payload: Record<string, unknown>) {
    if (!activeId || sending) return;
    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ conversation_id: activeId, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(prev => [...prev, json.message]);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi');
    } finally { setSending(false); }
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    setText('');
    await doSend({ message_type: 'text', content });
  }

  async function sendFile(file: File) {
    if (file.size > 4 * 1024 * 1024) { alert('Fichier trop lourd (max 4 Mo)'); return; }
    const mime = file.type;
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    if (!isImage && !isPdf) { alert('Seuls les images et PDF sont acceptés'); return; }
    const b64: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    await doSend({ message_type: isImage ? 'image' : 'pdf', file_data: b64, file_name: file.name, file_mime: mime });
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
    } catch { alert('Micro non disponible'); }
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setRecording(false); }

  async function toggleResolved() {
    const c = conversations.find(c => c.id === activeId);
    if (!c) return;
    const next = c.status === 'resolved' ? 'active' : 'resolved';
    await supabase.from('support_conversations').update({ status: next }).eq('id', c.id);
    setConversations(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
  }

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#111827', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 280, minWidth: 280, borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', background: '#1f2937' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>Support clients</span>
          <button onClick={loadConversations} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, padding: 2 }} title="Actualiser">↻</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 16, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>Chargement…</div>}
          {!loading && conversations.length === 0 && (
            <div style={{ padding: 24, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              Aucune conversation
            </div>
          )}
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => openConversation(c.id)}
              style={{ padding: '12px 14px', borderBottom: '1px solid #374151', cursor: 'pointer', background: activeId === c.id ? '#374151' : 'transparent', position: 'relative' }}
              onMouseEnter={e => { if (activeId !== c.id) (e.currentTarget as HTMLElement).style.background = '#2d3748'; }}
              onMouseLeave={e => { if (activeId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.visitor_name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{fmtRel(c.last_message_at)}</span>
                  {c.unread > 0 && c.status !== 'resolved' && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center', display: 'inline-block' }}>{c.unread}</span>
                  )}
                  {c.status === 'resolved' && (
                    <span style={{ fontSize: 10, background: '#374151', color: '#6b7280', padding: '1px 6px', borderRadius: 6 }}>résolu</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.preview || c.visitor_email}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      {!activeId ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 36 }}>💬</div>
          <div style={{ fontSize: 14 }}>Sélectionne une conversation</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #374151', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>{activeConv?.visitor_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{activeConv?.visitor_email}</div>
            </div>
            <button
              onClick={toggleResolved}
              style={{ background: activeConv?.status === 'resolved' ? '#374151' : '#065f46', color: activeConv?.status === 'resolved' ? '#9ca3af' : '#6ee7b7', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {activeConv?.status === 'resolved' ? 'Réouvrir' : '✓ Résolu'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, background: '#111827' }}>
            {messages.map(m => {
              const isSent = m.sender_type === 'admin';
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '70%', alignSelf: isSent ? 'flex-end' : 'flex-start' }}>
                  <div style={{ padding: '9px 13px', borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isSent ? '#10b981' : '#1f2937', color: isSent ? '#fff' : '#f3f4f6', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', border: isSent ? 'none' : '1px solid #374151' }}>
                    {m.message_type === 'text' && m.content}
                    {m.message_type === 'image' && m.file_url && (
                      <img src={m.file_url} alt="" style={{ maxWidth: 220, borderRadius: 8, display: 'block', cursor: 'pointer' }} onClick={() => window.open(m.file_url!)} />
                    )}
                    {m.message_type === 'pdf' && m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isSent ? '#fff' : '#10b981', fontWeight: 600, textDecoration: 'none' }}>📄 {m.file_name || 'document.pdf'}</a>
                    )}
                    {m.message_type === 'audio' && m.file_url && (
                      <audio controls src={m.file_url} style={{ maxWidth: 220 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2, padding: '0 4px' }}>{fmt(m.created_at)}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '8px 10px', borderTop: '1px solid #374151', background: '#1f2937' }}>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = ''; }} />
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: '#450a0a', borderRadius: 20, marginBottom: 8, border: '1px solid #7f1d1d' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#fca5a5', flex: 1 }}>Enregistrement… {recordSecs}s</span>
                <button onClick={stopRecording} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Envoyer</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={sending || recording} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Image ou PDF">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Répondre…"
                maxLength={2000}
                disabled={sending || recording}
                style={{ flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: 20, padding: '9px 14px', fontSize: 14, color: '#f3f4f6', outline: 'none', resize: 'none', maxHeight: 80, fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#10b981')}
                onBlur={e => (e.target.style.borderColor = '#374151')}
              />
              {text.trim() ? (
                <button onClick={send} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              ) : (
                <button onClick={recording ? stopRecording : startRecording} disabled={sending} style={{ width: 38, height: 38, borderRadius: '50%', background: recording ? '#ef4444' : '#374151', color: recording ? '#fff' : '#9ca3af', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }} title={recording ? 'Arrêter' : 'Message vocal'}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
