import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
  username: string;
  email: string;
  plan: string | null;
  profileImage: string | null;
  notificationsEnabled: boolean;
  onLogout: () => void;
  onToggleNotifications: () => void;
  onNavigateToSupport: () => void;
  onUpdateUsername: (name: string) => Promise<void>;
  onUpdatePhoto: (file: File) => void;
}

type View = 'menu' | 'profil' | 'mdp' | 'contact';

const BG = '#111827';
const CARD = '#1f2937';
const BORDER = '#374151';
const TEXT = '#f9fafb';
const MUTED = '#9ca3af';
const GREEN = '#10b981';

const planLabel = (plan: string | null) => {
  if (!plan || plan === 'public') return 'Membre Public';
  if (plan === 'premium') return 'Membre Premium ⭐';
  if (plan === 'journal') return 'Membre Journal';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

const planBg = (plan: string | null) => plan && plan !== 'public' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.2)';
const planColor = (plan: string | null) => plan && plan !== 'public' ? GREEN : MUTED;

function Row({ icon, label, right, onClick, danger }: { icon: React.ReactNode; label: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: onClick ? 'pointer' : 'default', borderBottom: `1px solid ${BORDER}`, background: 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#2d3748'; }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <span style={{ color: danger ? '#ef4444' : MUTED, flexShrink: 0, width: 22, display: 'flex', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, color: danger ? '#ef4444' : TEXT }}>{label}</span>
      {right ?? (onClick && !danger && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>)}
    </div>
  );
}

export default function MonCompteModal({ onClose, username, email, plan, profileImage, notificationsEnabled, onLogout, onToggleNotifications, onNavigateToSupport, onUpdateUsername, onUpdatePhoto }: Props) {
  const [view, setView] = useState<View>('menu');
  const [editUsername, setEditUsername] = useState(username);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Mot de passe
  const [mdpStep, setMdpStep] = useState<'form' | 'sent'>('form');
  const [newMdp, setNewMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [mdpError, setMdpError] = useState('');
  const [mdpLoading, setMdpLoading] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);

  async function saveName() {
    if (!editUsername.trim() || editUsername === username) { setEditingName(false); return; }
    setSavingName(true);
    await onUpdateUsername(editUsername.trim());
    setSavingName(false);
    setEditingName(false);
  }

  async function changePassword() {
    setMdpError('');
    if (newMdp.length < 6) { setMdpError('Minimum 6 caractères'); return; }
    if (newMdp !== confirmMdp) { setMdpError('Les mots de passe ne correspondent pas'); return; }
    setMdpLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newMdp });
    setMdpLoading(false);
    if (error) { setMdpError(error.message); return; }
    setMdpStep('sent');
  }

  function shareApp() {
    const url = 'https://tradingpourlesnuls.com';
    const text = 'Découvre TPLN — Trading Pour Les Nuls 🚀';
    if (navigator.share) {
      navigator.share({ title: text, url });
    } else {
      navigator.clipboard?.writeText(url);
      alert('Lien copié !');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 1, background: BG, width: '100%', maxWidth: 400, marginLeft: 'auto', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(0,0,0,0.5)', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={view === 'menu' ? onClose : () => setView('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT, padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, margin: 0 }}>
            {view === 'menu' ? 'Mon compte' : view === 'profil' ? 'Mon profil' : view === 'mdp' ? 'Mot de passe' : 'Nous contacter'}
          </h2>
        </div>

        {/* ── MENU ── */}
        {view === 'menu' && (<>
          {/* Profile row */}
          <div onClick={() => setView('profil')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: CARD, cursor: 'pointer', borderBottom: `1px solid ${BORDER}`, marginTop: 12 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2d3748'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = CARD}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#374151', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: TEXT, marginBottom: 4 }}>{username}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: planColor(plan), background: planBg(plan), padding: '2px 10px', borderRadius: 20 }}>{planLabel(plan)}</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          {/* Trading */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, padding: '4px 20px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trading</p>
            <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>} label="Devenir membre Premium" />
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Messagerie" onClick={onNavigateToSupport} />
              <Row
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
                label="Notifications"
                onClick={onToggleNotifications}
                right={
                  <div style={{ width: 42, height: 24, borderRadius: 12, background: notificationsEnabled ? GREEN : '#374151', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: notificationsEnabled ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                }
              />
            </div>
          </div>

          {/* Général */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, padding: '4px 20px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Général</p>
            <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>} label="Inviter des amis" onClick={shareApp} />
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16l.19.92z"/></svg>} label="Nous contacter" onClick={() => setView('contact')} />
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Se déconnecter" onClick={onLogout} danger />
            </div>
          </div>
          <div style={{ height: 40 }} />
        </>)}

        {/* ── PROFIL ── */}
        {view === 'profil' && (<>
          {/* Avatar + edit */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 20px' }}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#374151', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${GREEN}` }}>
                {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              </div>
              <button onClick={() => photoRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: GREEN, border: `2px solid ${BG}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpdatePhoto(f); e.target.value = ''; }} />
            </div>
          </div>

          {/* Fields */}
          <div style={{ margin: '0 16px', background: CARD, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
            {/* Pseudo editable */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: TEXT, width: 120 }}>Pseudo</span>
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <input value={editUsername} onChange={e => setEditUsername(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    style={{ flex: 1, background: '#374151', border: `1px solid ${GREEN}`, borderRadius: 8, padding: '5px 10px', color: TEXT, fontSize: 14, outline: 'none' }} />
                  <button onClick={saveName} disabled={savingName} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{savingName ? '…' : '✓'}</button>
                  <button onClick={() => setEditingName(false)} style={{ background: '#374151', color: MUTED, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 13, cursor: 'pointer' }}>✗</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: MUTED }}>{username}</span>
                  <button onClick={() => { setEditUsername(username); setEditingName(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREEN, padding: 2 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              )}
            </div>
            {[
              { label: 'Email', value: email },
              { label: 'Mot de passe', value: '••••••••' },
              { label: 'Abonnement', value: planLabel(plan), color: planColor(plan) },
            ].map((f, i, arr) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>{f.label}</span>
                {f.label === 'Mot de passe' ? (
                  <button onClick={() => setView('mdp')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREEN, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {f.value} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ) : (
                  <span style={{ fontSize: 14, color: f.color || MUTED }}>{f.value}</span>
                )}
              </div>
            ))}
          </div>

          <button onClick={onLogout} style={{ margin: '24px 16px 8px', padding: '14px', background: 'none', border: `1px solid #ef4444`, borderRadius: 10, color: '#ef4444', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center', width: 'calc(100% - 32px)' }}>
            Se déconnecter
          </button>
          <div style={{ height: 40 }} />
        </>)}

        {/* ── MOT DE PASSE ── */}
        {view === 'mdp' && (<>
          <div style={{ padding: '24px 20px', flex: 1 }}>
            {mdpStep === 'sent' ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p style={{ color: GREEN, fontWeight: 600, fontSize: 16 }}>Mot de passe mis à jour !</p>
                <button onClick={() => setView('profil')} style={{ marginTop: 24, background: GREEN, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Retour</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: MUTED, fontSize: 14, marginBottom: 4 }}>Choisissez un nouveau mot de passe</p>
                <input type="password" placeholder="Nouveau mot de passe" value={newMdp} onChange={e => setNewMdp(e.target.value)}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', color: TEXT, fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
                <input type="password" placeholder="Confirmer le mot de passe" value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)}
                  style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', color: TEXT, fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
                {mdpError && <p style={{ color: '#ef4444', fontSize: 13 }}>{mdpError}</p>}
                <button onClick={changePassword} disabled={mdpLoading} style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                  {mdpLoading ? 'Mise à jour…' : 'Modifier le mot de passe'}
                </button>
              </div>
            )}
          </div>
        </>)}

        {/* ── NOUS CONTACTER ── */}
        {view === 'contact' && (<>
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: MUTED, fontSize: 14, marginBottom: 8 }}>Choisis comment nous contacter</p>

            {[
              { label: 'Chat Support', icon: '💬', sub: 'Répond rapidement', action: onNavigateToSupport },
              { label: 'WhatsApp', icon: '📱', sub: '+33 X XX XX XX XX', action: () => window.open('https://wa.me/33XXXXXXXXX') },
              { label: 'Instagram', icon: '📸', sub: '@tradingpourlesnuls', action: () => window.open('https://instagram.com/tradingpourlesnuls') },
              { label: 'Twitter / X', icon: '🐦', sub: '@tradingpourlesnuls', action: () => window.open('https://twitter.com/tradingpourlesnuls') },
            ].map(item => (
              <div key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2d3748'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = CARD}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{item.sub}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
          <div style={{ height: 40 }} />
        </>)}
      </div>
    </div>
  );
}
