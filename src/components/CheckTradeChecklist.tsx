import { useState } from 'react';

export default function CheckTradeChecklist() {
  const [b1, setB1] = useState(false);
  const [b2a, setB2a] = useState(false);
  const [b2b, setB2b] = useState(false);
  const [b3, setB3] = useState(false);
  const [rr, setRr] = useState(false);

  const allOk = b1 && b2a && b2b && b3 && rr;

  const handleReset = () => {
    setB1(false); setB2a(false); setB2b(false); setB3(false); setRr(false);
  };

  const items = [
    { label: 'B1 Accumulation', value: b1, set: setB1 },
    { label: 'B2 Extrémité / Sweep ITHL + Disp', value: b2a, set: setB2a },
    { label: 'B2 Fake MSS / ITMSS', value: b2b, set: setB2b },
    { label: 'B3 Sweep ITHL (fin C2 / open C3)', value: b3, set: setB3 },
    { label: 'RR ≥ 1:2', value: rr, set: setRr },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        border: `1.5px solid ${allOk ? '#10b981' : '#e2e8f0'}`,
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: allOk ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : '#f8fafc',
          borderBottom: `1px solid ${allOk ? '#10b981' : '#e2e8f0'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{allOk ? '✅' : '📋'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: allOk ? '#065f46' : '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>TPLN CHECK</span>
          </div>
          {allOk && <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 20 }}>SETUP VALIDÉ</span>}
        </div>

        {/* Checklist */}
        <div style={{ padding: '8px 0' }}>
          {items.map(({ label, value, set }) => (
            <label key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
              cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              background: value ? 'rgba(16,185,129,0.04)' : 'transparent',
              transition: 'background 0.15s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, border: `2px solid ${value ? '#10b981' : '#cbd5e1'}`,
                background: value ? '#10b981' : '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: value ? '#065f46' : '#334155', flex: 1 }}>{label}</span>
              <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} style={{ display: 'none' }} />
            </label>
          ))}
        </div>

        {/* Reset */}
        <div style={{ padding: '12px 20px 16px' }}>
          <button
            onClick={handleReset}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: 'transparent', border: '1px solid #e2e8f0',
              color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/>
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
