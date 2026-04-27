import { useState } from 'react';

interface Props {
  onClose: () => void;
  username: string;
  email: string;
  plan: string | null;
  profileImage: string | null;
  onLogout: () => void;
}

const planLabel = (plan: string | null) => {
  if (!plan || plan === 'public') return 'Membre Public';
  if (plan === 'premium') return 'Membre Premium';
  if (plan === 'journal') return 'Membre Journal';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

const planColor = (plan: string | null) => plan && plan !== 'public' ? '#10b981' : '#64748b';

function Row({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', cursor: onClick ? 'pointer' : 'default', borderBottom: '1px solid #f1f5f9', background: '#fff' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#f8fafb'; }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
    >
      <span style={{ color: danger ? '#ef4444' : '#374151', flexShrink: 0, width: 22, display: 'flex', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, color: danger ? '#ef4444' : '#0f172a' }}>{label}</span>
      {onClick && !danger && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>}
    </div>
  );
}

export default function MonCompteModal({ onClose, username, email, plan, profileImage, onLogout }: Props) {
  const [view, setView] = useState<'menu' | 'profil'>('menu');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />

      {/* Panel (slides from right on mobile, centered modal on desktop) */}
      <div style={{
        position: 'relative', zIndex: 1, background: '#f8fafc', width: '100%', maxWidth: 400,
        marginLeft: 'auto', height: '100%', display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          {view === 'profil' ? (
            <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 0, display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          ) : (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 0, display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {view === 'profil' ? username : 'Mon compte'}
          </h2>
        </div>

        {view === 'menu' && (
          <>
            {/* Profile row */}
            <div
              onClick={() => setView('profil')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', marginTop: 12 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafb'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profileImage
                  ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>{username}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: planColor(plan), background: plan && plan !== 'public' ? '#d1fae5' : '#f1f5f9', padding: '2px 10px', borderRadius: 20 }}>
                  {planLabel(plan)}
                </span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            {/* Trading section */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', padding: '4px 20px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trading</p>
              <div style={{ borderTop: '1px solid #f1f5f9' }}>
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-4l-2 4h8l-2-4z"/></svg>} label="Devenir membre Premium" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Messagerie instantanée" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>} label="Solution automatisée" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>} label="Mes Brokers" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} label="Notifications" />
              </div>
            </div>

            {/* Général section */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', padding: '4px 20px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Général</p>
              <div style={{ borderTop: '1px solid #f1f5f9' }}>
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} label="Mentions légales" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Inviter des amis" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16l.19.92z"/></svg>} label="Nous contacter" />
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Se déconnecter" onClick={onLogout} danger />
              </div>
            </div>

            <div style={{ height: 40 }} />
          </>
        )}

        {view === 'profil' && (
          <>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px 20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profileImage
                  ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                }
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ margin: '0 16px', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              {[
                { label: 'Pseudo', value: username },
                { label: 'Adresse mail', value: email },
                { label: 'Mot de passe', value: '••••••••' },
                { label: 'Statut', value: planLabel(plan), color: planColor(plan) },
              ].map((f, i, arr) => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 18px', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#0f172a' }}>{f.label}</span>
                  <span style={{ fontSize: 14, color: f.color || '#64748b' }}>{f.value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 32 }} />

            <button
              onClick={onLogout}
              style={{ margin: '0 16px', padding: '14px', background: 'none', border: 'none', color: '#ef4444', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}
            >
              Se déconnecter
            </button>
            <div style={{ height: 40 }} />
          </>
        )}
      </div>
    </div>
  );
}
