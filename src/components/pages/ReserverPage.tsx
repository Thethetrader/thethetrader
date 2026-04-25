import { useState } from "react";
import { SiteHeader } from "../landing/site-header";
import { SiteFooter } from "../landing/site-footer";

export function ReserverPage({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column" }}>
      <SiteHeader onOpenAuth={onOpenAuth} />

      <main style={{ flex: 1 }}>

        {/* Hero card */}
        <div style={{ maxWidth: 1100, margin: "48px auto 32px", padding: "0 20px" }}>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "#fff",
              border: "1px solid #e8e8e8",
            }}
            className="reserver-hero-grid"
          >
            {/* Left: copy */}
            <div style={{ padding: "56px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h1
                style={{
                  margin: "0 0 24px",
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  color: "oklch(0.141 0.005 285.823)",
                }}
              >
                Un appel.<br />Une direction claire.
              </h1>
              <p style={{ margin: 0, fontSize: 17, lineHeight: "26px", color: "oklch(0.442 0.017 285.786)", maxWidth: 400 }}>
                Un appel de 20 minutes pour comprendre où tu en es, ce qui bloque, et comment la méthode TPLN peut t'aider à trader avec structure dès maintenant.
              </p>
            </div>

            {/* Right: logo */}
            <div
              style={{
                background: "#fff",
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
              }}
            >
              <img src="/faviconsansfond.png" alt="TPLN" style={{ width: "min(260px, 70%)", height: "auto", objectFit: "contain" }} />
            </div>
          </div>
        </div>

        {/* Two option cards */}
        <div
          style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          className="reserver-cards-grid"
        >

          {/* Card 1: Phone */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: "36px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "oklch(0.141 0.005 285.823)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.63a16 16 0 006.29 6.29l1.95-1.95a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#fff", background: "oklch(0.141 0.005 285.823)", padding: "4px 10px", borderRadius: 9999, textTransform: "uppercase" }}>
                Gratuit
              </span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 16, color: "oklch(0.442 0.017 285.786)" }}>Prendre contact par téléphone.</p>
            <a href="tel:+33623948053" style={{ fontSize: 22, fontWeight: 700, color: "oklch(0.141 0.005 285.823)", textDecoration: "none", letterSpacing: "-0.02em" }}>
              06 23 94 80 53
            </a>
          </div>

          {/* Card 2: Booking form */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: "36px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "oklch(0.141 0.005 285.823)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3"/>
                  <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3"/>
                  <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3"/>
                  <line x1="8" y1="18" x2="8" y2="18" strokeWidth="3"/>
                  <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#fff", background: "oklch(0.141 0.005 285.823)", padding: "4px 10px", borderRadius: 9999, textTransform: "uppercase" }}>
                Gratuit
              </span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 16, color: "oklch(0.442 0.017 285.786)" }}>Planifier un rendez-vous.</p>

            {sent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "oklch(0.141 0.005 285.823)" }}>✓ Demande envoyée !</p>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "oklch(0.442 0.017 285.786)" }}>Je te recontacte dans les 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ height: 44, padding: "0 14px", fontSize: 14, border: "1px solid #e2e2e2", borderRadius: 8, outline: "none", boxSizing: "border-box", width: "100%" }}
                />
                <input
                  type="email"
                  placeholder="Ton email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ height: 44, padding: "0 14px", fontSize: 14, border: "1px solid #e2e2e2", borderRadius: 8, outline: "none", boxSizing: "border-box", width: "100%" }}
                />
                <input
                  type="tel"
                  placeholder="Ton numéro de téléphone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ height: 44, padding: "0 14px", fontSize: 14, border: "1px solid #e2e2e2", borderRadius: 8, outline: "none", boxSizing: "border-box", width: "100%" }}
                />
                <button
                  type="submit"
                  style={{ height: 44, fontSize: 14, fontWeight: 600, color: "#fff", background: "oklch(0.141 0.005 285.823)", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 4 }}
                >
                  Demander un rappel →
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />

      <style>{`
        @media (max-width: 768px) {
          .reserver-hero-grid { grid-template-columns: 1fr !important; }
          .reserver-hero-grid > div:last-child { min-height: 200px !important; }
          .reserver-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
