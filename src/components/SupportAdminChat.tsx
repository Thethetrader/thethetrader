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
  const bottomRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('id, visitor_name, visitor_email, status, last_message_at, created_at')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) { console.error('Support convs:', error); setLoading(false); return; }

    const convs: Conv[] = await Promise.all((data || []).map(async (c) => {
      const { count } = await supabase.from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', c.id).eq('sender_type', 'visitor').eq('read_by_admin', false);
      const { data: last } = await supabase.from('support_messages')
        .select('content, message_type').eq('conversation_id', c.id)
        .order('created_at', { ascending: false }).limit(1);
      return {
        ...c,
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
          setMessages(prev => [...prev, m]);
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

  async function send() {
    const content = text.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    setText('');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const res = await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ conversation_id: activeId, message_type: 'text', content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(prev => [...prev, json.message]);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi');
      setText(content);
    } finally { setSending(false); }
  }

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
                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>{fmtRel(c.last_message_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: c.unread > 0 ? 24 : 0 }}>
                {c.preview || c.visitor_email}
              </div>
              {c.status === 'resolved' && (
                <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, background: '#374151', color: '#6b7280', padding: '1px 6px', borderRadius: 6 }}>résolu</span>
              )}
              {c.unread > 0 && c.status !== 'resolved' && (
                <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>{c.unread}</span>
              )}
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

          <div style={{ padding: '10px 12px', borderTop: '1px solid #374151', background: '#1f2937', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Répondre…"
              maxLength={2000}
              disabled={sending}
              style={{ flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: 20, padding: '9px 14px', fontSize: 14, color: '#f3f4f6', outline: 'none', resize: 'none', maxHeight: 80, fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#10b981')}
              onBlur={e => (e.target.style.borderColor = '#374151')}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              style={{ width: 38, height: 38, borderRadius: '50%', background: text.trim() ? '#10b981' : '#374151', color: '#fff', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
