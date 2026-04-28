import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = '/.netlify/functions';

export type PostType = 'achat' | 'suivi_trade' | 'news' | 'info';

const POST_CONFIG: Record<PostType, { label: string; color: string; lightBg: string; emoji: string }> = {
  achat:       { label: 'Achat',           color: '#10b981', lightBg: 'rgba(16,185,129,0.12)', emoji: '📈' },
  suivi_trade: { label: 'Suivi de trade',  color: '#f97316', lightBg: 'rgba(249,115,22,0.12)',  emoji: '📊' },
  news:        { label: 'News',            color: '#3b82f6', lightBg: 'rgba(59,130,246,0.12)',  emoji: '📰' },
  info:        { label: 'Info',            color: '#a78bfa', lightBg: 'rgba(167,139,250,0.12)', emoji: 'ℹ️' },
};

const QUICK_EMOJIS = ['❤️', '🔥', '👍', '🎯'];

interface Reaction { id: string; post_id: string; user_id: string; emoji: string; }
interface Comment  { id: string; post_id: string; user_id: string; author_name: string; content: string; created_at: string; }
interface Post {
  id: string;
  type: PostType;
  content: string;
  image_url: string | null;
  author_name: string;
  created_at: string;
  reactions: Reaction[];
  comments: Comment[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

interface Props {
  isAdmin: boolean;
  userId: string;
  username: string;
  sessionToken?: string;
}

export default function HomeFeed({ isAdmin, userId, username, sessionToken }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Create post form state
  const [newType, setNewType] = useState<PostType>('info');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/get-home-posts`);
      const json = await res.json();
      if (json.posts) setPosts(json.posts);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(',')[1];
      setNewImage({ data: base64, mime: file.type, preview: result });
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!newContent.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/create-home-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ type: newType, content: newContent, image_data: newImage?.data, image_mime: newImage?.mime }),
      });
      const json = await res.json();
      if (json.post) {
        setPosts(prev => [json.post, ...prev]);
        setNewContent('');
        setNewImage(null);
        setShowCreate(false);
      }
    } catch {}
    setPosting(false);
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    const uid = userId || 'anon';
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const has = p.reactions.some(r => r.user_id === uid && r.emoji === emoji);
      const reactions = has
        ? p.reactions.filter(r => !(r.user_id === uid && r.emoji === emoji))
        : [...p.reactions, { id: Date.now().toString(), post_id: postId, user_id: uid, emoji }];
      return { ...p, reactions };
    }));
    try {
      await fetch(`${API}/add-home-reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, emoji, user_id: uid }),
      });
    } catch {}
  };

  const submitComment = async (postId: string) => {
    const content = commentInput[postId]?.trim();
    if (!content) return;
    const uid = userId || 'anon';
    const tempComment: Comment = { id: Date.now().toString(), post_id: postId, user_id: uid, author_name: username || 'Membre', content, created_at: new Date().toISOString() };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, tempComment] } : p));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    try {
      await fetch(`${API}/add-home-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: uid, author_name: username || 'Membre', content }),
      });
    } catch {}
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group posts by day
  const grouped: { key: string; label: string; posts: Post[] }[] = [];
  posts.forEach(post => {
    const key = dayKey(post.created_at);
    const group = grouped.find(g => g.key === key);
    if (group) group.posts.push(post);
    else grouped.push({ key, label: formatDate(post.created_at), posts: [post] });
  });

  return (
    <div style={{ background: '#111827', minHeight: '100%', color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Accueil</h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{ width: 38, height: 38, borderRadius: '50%', background: '#3b82f6', border: 'none', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >+</button>
        )}
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
        {(Object.entries(POST_CONFIG) as [PostType, typeof POST_CONFIG[PostType]][]).map(([type, cfg]) => (
          <span key={type} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, background: cfg.lightBg, border: `1px solid ${cfg.color}`, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
            {cfg.emoji} {cfg.label}
          </span>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Chargement…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Aucune publication pour l'instant</div>
      ) : (
        <div style={{ padding: '0 0 100px' }}>
          {grouped.map(group => (
            <div key={group.key}>
              <div style={{ padding: '16px 16px 8px', fontSize: 20, fontWeight: 700, color: '#fff' }}>{group.label}</div>
              {group.posts.map(post => {
                const cfg = POST_CONFIG[post.type] || POST_CONFIG.info;
                const uid = userId || 'anon';
                const expanded = expandedComments.has(post.id);
                return (
                  <div key={post.id} style={{ margin: '0 12px 12px', borderRadius: 12, background: '#1f2937', overflow: 'hidden', borderLeft: `4px solid ${cfg.color}` }}>
                    {/* Post header */}
                    <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{formatTime(post.created_at)}</span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '0 14px 10px', fontSize: 14, color: '#e5e7eb', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.content}</div>

                    {/* Image */}
                    {post.image_url && (
                      <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
                    )}

                    {/* Reactions */}
                    <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {QUICK_EMOJIS.map(emoji => {
                        const count = post.reactions.filter(r => r.emoji === emoji).length;
                        const mine = post.reactions.some(r => r.user_id === uid && r.emoji === emoji);
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(post.id, emoji)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: mine ? `1.5px solid ${cfg.color}` : '1.5px solid #374151', background: mine ? cfg.lightBg : 'transparent', cursor: 'pointer', fontSize: 13, color: '#e5e7eb', transition: 'all 0.15s' }}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span style={{ fontSize: 12, color: mine ? cfg.color : '#9ca3af', fontWeight: 600 }}>{count}</span>}
                          </button>
                        );
                      })}
                      {/* Comment toggle */}
                      <button
                        onClick={() => toggleComments(post.id)}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: '1.5px solid #374151', background: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>{post.comments.length || ''}</span>
                      </button>
                    </div>

                    {/* Comments */}
                    {expanded && (
                      <div style={{ borderTop: '1px solid #374151' }}>
                        {post.comments.map(c => (
                          <div key={c.id} style={{ padding: '8px 14px', borderBottom: '1px solid #1f2937' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{c.author_name}</span>
                              <span style={{ fontSize: 10, color: '#6b7280' }}>{formatTime(c.created_at)}</span>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#d1d5db', lineHeight: 1.4 }}>{c.content}</p>
                          </div>
                        ))}
                        {/* Comment input */}
                        <div style={{ display: 'flex', gap: 8, padding: '8px 14px' }}>
                          <input
                            value={commentInput[post.id] || ''}
                            onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                            placeholder="Commenter…"
                            style={{ flex: 1, background: '#374151', border: 'none', borderRadius: 20, padding: '6px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.color, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Create post modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#1f2937', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Nouvelle publication</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Type selector */}
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Type</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {(Object.entries(POST_CONFIG) as [PostType, typeof POST_CONFIG[PostType]][]).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${newType === type ? cfg.color : '#374151'}`, background: newType === type ? cfg.lightBg : '#111827', color: newType === type ? cfg.color : '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                >
                  <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Contenu</p>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Écris ta publication…"
              rows={4}
              style={{ width: '100%', background: '#111827', border: `1.5px solid ${POST_CONFIG[newType].color}40`, borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
            />

            {/* Image */}
            <div style={{ marginTop: 10 }}>
              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
              {newImage ? (
                <div style={{ position: 'relative', marginBottom: 4 }}>
                  <img src={newImage.preview} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 180, objectFit: 'cover' }} />
                  <button onClick={() => setNewImage(null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed #374151', background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Ajouter une photo
                </button>
              )}
            </div>

            <button
              onClick={handlePost}
              disabled={!newContent.trim() || posting}
              style={{ marginTop: 14, width: '100%', padding: '14px', borderRadius: 12, background: POST_CONFIG[newType].color, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: (!newContent.trim() || posting) ? 0.5 : 1, transition: 'opacity 0.15s' }}
            >
              {posting ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
