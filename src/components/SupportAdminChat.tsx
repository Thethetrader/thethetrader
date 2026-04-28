import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import LiveOneToOne from './LiveOneToOne';

function AudioPlayer({ src, isSent }: { src: string; isSent: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const accent = isSent ? '#fff' : '#10b981';
  const bg = isSent ? 'rgba(255,255,255,0.2)' : '#374151';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 200 }}>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => { const a = audioRef.current; if (a) setProgress(a.currentTime / (a.duration || 1) * 100); }}
        onLoadedMetadata={() => { const a = audioRef.current; if (a) setDuration(a.duration); }}
        onEnded={() => { setPlaying(false); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: '50%', background: accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isSent ? '#10b981' : '#111827' }}>
        {playing
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ height: 3, background: bg, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: accent, borderRadius: 2, transition: 'width 0.1s' }} />
        </div>
        <span style={{ fontSize: 11, color: isSent ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>{fmt(duration)}</span>
      </div>
    </div>
  );
}

const SEND_URL = '/.netlify/functions/send-message';
const GET_USERS_URL = '/.netlify/functions/get-users';

type UserItem = { id: string; email: string; name: string };

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
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDrop, setShowUserDrop] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [sessionActive, setSessionActive] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [recordSecs, setRecordSecs] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load admin user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.id) setAdminUserId(data.session.user.id);
    });
  }, []);

  const startSession = useCallback(async () => {
    if (!activeId || !adminUserId) return;
    const roomName = `session-${activeId}`;
    await supabase.from('live_sessions').upsert({
      conversation_id: activeId,
      room_name: roomName,
      status: 'active',
    }, { onConflict: 'conversation_id' });
    setSessionActive(true);
  }, [activeId, adminUserId]);

  const endSession = useCallback(async () => {
    if (!activeId) return;
    await supabase.from('live_sessions').update({ status: 'ended' }).eq('conversation_id', activeId);
    setSessionActive(false);
  }, [activeId]);

  const loadUsers = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) return;
    const res = await fetch(GET_USERS_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const json = await res.json();
    setUsers(json.users || []);
  }, []);

  const startConversationWith = useCallback(async (u: UserItem) => {
    setShowUserDrop(false);
    setUserSearch('');
    // Check if conversation already exists
    const { data } = await supabase.from('support_conversations').select('id').eq('visitor_email', u.email).limit(1);
    if (data?.length) {
      openConversation(data[0].id);
    } else {
      // Create new conversation
      const { data: conv } = await supabase.from('support_conversations')
        .insert({ visitor_name: u.name || u.email.split('@')[0], visitor_email: u.email, status: 'active' })
        .select('id').single();
      if (conv) { await loadConversations(); openConversation(conv.id); }
    }
  }, []);

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
    setMobilePane('chat');
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
    loadUsers();
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

    const localUrl = URL.createObjectURL(file);
    const tempId = `tmp_${Date.now()}`;
    const tempMsg: Msg = { id: tempId, sender_type: 'admin', content: null, message_type: isImage ? 'image' : 'pdf', file_url: localUrl, file_name: file.name, duration_seconds: null, created_at: new Date().toISOString(), read_by_admin: true };
    setMessages(prev => [...prev, tempMsg]);

    const b64: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    if (!activeId || sending) { setMessages(prev => prev.filter(m => m.id !== tempId)); URL.revokeObjectURL(localUrl); return; }
    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ conversation_id: activeId, message_type: isImage ? 'image' : 'pdf', file_data: b64, file_name: file.name, file_mime: mime }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(prev => prev.map(m => m.id === tempId ? json.message : m));
      URL.revokeObjectURL(localUrl);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      URL.revokeObjectURL(localUrl);
      alert(err.message || 'Erreur envoi');
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ display: 'flex', height: '100%', background: '#111827', overflow: 'hidden' }}>

      {/* Sidebar — cachée sur mobile en mode chat */}
      <div style={{ width: isMobile ? '100%' : 280, minWidth: isMobile ? 0 : 280, borderRight: '1px solid #374151', display: isMobile && mobilePane === 'chat' ? 'none' : 'flex', flexDirection: 'column', background: '#1f2937' }}>
        <div style={{ padding: '0 14px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 61, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>Support clients</span>
          <button onClick={loadConversations} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, padding: 2 }} title="Actualiser">↻</button>
        </div>

        {/* User picker */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #374151', position: 'relative' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}
            onClick={() => { setShowUserDrop(v => !v); if (!showUserDrop) setUserSearch(''); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style={{ fontSize: 13, color: '#6b7280', flex: 1 }}>Nouveau message…</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          {showUserDrop && (
            <div style={{ position: 'absolute', left: 12, right: 12, top: '100%', zIndex: 50, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #374151' }}>
                <input
                  autoFocus
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur…"
                  style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: '#f3f4f6', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {users
                  .filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.name.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => (
                    <div
                      key={u.id}
                      onClick={() => startConversationWith(u)}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #2d3748' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#374151')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>{u.name || u.email.split('@')[0]}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{u.email}</div>
                    </div>
                  ))
                }
                {users.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: 16, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Aucun résultat</div>
                )}
              </div>
            </div>
          )}
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

      {/* Main — caché sur mobile en mode liste */}
      {(!activeId || (isMobile && mobilePane === 'list')) ? (
        <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 36 }}>💬</div>
          <div style={{ fontSize: 14 }}>Sélectionne une conversation</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '0 16px', borderBottom: '1px solid #374151', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, height: 61, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {isMobile && (
                <button onClick={() => setMobilePane('list')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv?.visitor_name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{activeConv?.visitor_email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={sessionActive ? endSession : startSession}
                style={{ background: sessionActive ? '#7f1d1d' : '#1e3a5f', color: sessionActive ? '#fca5a5' : '#93c5fd', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
                {sessionActive ? 'Terminer' : 'Session'}
              </button>
              <button
                onClick={toggleResolved}
                style={{ background: activeConv?.status === 'resolved' ? '#374151' : '#065f46', color: activeConv?.status === 'resolved' ? '#9ca3af' : '#6ee7b7', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {activeConv?.status === 'resolved' ? 'Réouvrir' : '✓ Résolu'}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, background: '#111827' }}>
            {messages.map(m => {
              const isSent = m.sender_type === 'admin';
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '70%', alignSelf: isSent ? 'flex-end' : 'flex-start', marginLeft: isSent ? 'auto' : '0', marginRight: isSent ? '0' : 'auto' }}>
                  <div style={{ padding: '9px 13px', borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isSent ? '#10b981' : '#1f2937', color: isSent ? '#fff' : '#f3f4f6', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', border: isSent ? 'none' : '1px solid #374151' }}>
                    {m.message_type === 'text' && m.content}
                    {m.message_type === 'image' && m.file_url && (
                      <img src={m.file_url} alt="" style={{ maxWidth: 220, borderRadius: 8, display: 'block', cursor: 'pointer' }} onClick={() => window.open(m.file_url!)} />
                    )}
                    {m.message_type === 'pdf' && m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isSent ? '#fff' : '#10b981', fontWeight: 600, textDecoration: 'none' }}>📄 {m.file_name || 'document.pdf'}</a>
                    )}
                    {m.message_type === 'audio' && m.file_url && (
                      <AudioPlayer src={m.file_url} isSent={isSent} />
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

      {/* Overlay session vidéo */}
      {sessionActive && activeId && adminUserId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#111827', display: 'flex', flexDirection: 'column' }}>
          <LiveOneToOne
            roomName={`session-${activeId}`}
            userId={adminUserId}
            identity="Admin"
            isAdmin
            otherName={activeConv?.visitor_name}
            onEnd={endSession}
          />
        </div>
      )}
    </div>
  );
}
