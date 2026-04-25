import { useState } from "react";
import { SiteHeader } from "../landing/site-header";
import { SiteFooter } from "../landing/site-footer";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  padding: "0 18px",
  fontSize: 15,
  border: "1px solid #e2e2e2",
  borderRadius: 10,
  background: "#fff",
  outline: "none",
  color: "oklch(0.141 0.005 285.823)",
  boxSizing: "border-box",
};

export function ContactPage({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", display: "flex", flexDirection: "column" }}>
      <SiteHeader onOpenAuth={onOpenAuth} />

      <main style={{ flex: 1 }}>
        {/* Hero header */}
        <div
          style={{
            background: "linear-gradient(135deg, #e8eaf6 0%, #f4f5f7 50%, #f5f0eb 100%)",
            padding: "100px 20px 72px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", color: "oklch(0.442 0.017 285.786)", textTransform: "uppercase" }}>
            Contact
          </p>
          <h1
            style={{
              margin: "0 0 20px",
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "oklch(0.141 0.005 285.823)",
            }}
          >
            Besoin d'informations ?
          </h1>
          <p style={{ margin: "0 auto 40px", maxWidth: 520, fontSize: 18, lineHeight: "28px", color: "oklch(0.442 0.017 285.786)" }}>
            Notre équipe est là pour vous aider. Remplis le formulaire ci-dessous, nous te répondrons sous 24h.
          </p>

          {/* Contact pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 24px",
              background: "#fff",
              borderRadius: 9999,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              fontSize: 15,
              color: "oklch(0.141 0.005 285.823)",
            }}
          >
            <span>Pour toute question :</span>
            <a href="mailto:contact@thethetrader.com" style={{ fontWeight: 600, color: "oklch(0.141 0.005 285.823)", textDecoration: "none" }}>
              contact@thethetrader.com
            </a>
            <span style={{ color: "oklch(0.8 0 0)" }}>·</span>
            <a href="tel:+33623948053" style={{ fontWeight: 600, color: "oklch(0.141 0.005 285.823)", textDecoration: "none" }}>
              📞 06 23 94 80 53
            </a>
          </div>
        </div>

        {/* Two-column content */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "60px 20px 100px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
          className="contact-grid"
        >
          {/* LEFT — Form */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 22, color: "oklch(0.141 0.005 285.823)" }}>Message envoyé !</p>
                <p style={{ margin: 0, color: "oklch(0.442 0.017 285.786)" }}>Nous te répondrons dans les plus brefs délais.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  type="text"
                  placeholder="Nom"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Sujet"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={inputStyle}
                />
                <textarea
                  placeholder="Message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={6}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "14px 18px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    height: 52,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    background: "oklch(0.141 0.005 285.823)",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    marginTop: 4,
                  }}
                >
                  Envoyer
                </button>
              </form>
            )}
          </div>

          {/* RIGHT — FAQ card */}
          <div
            style={{
              background: "linear-gradient(160deg, #f5f0eb 0%, #ede8e2 100%)",
              borderRadius: 20,
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
              minHeight: 380,
              justifyContent: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: "30px", letterSpacing: "-0.02em", color: "oklch(0.141 0.005 285.823)", maxWidth: 280 }}>
              Découvrez les réponses aux questions les plus fréquentes.
            </h2>
            <a
              href="/faq/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 15,
                fontWeight: 600,
                color: "oklch(0.141 0.005 285.823)",
                textDecoration: "none",
              }}
            >
              Consulter notre FAQ
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <div style={{ marginTop: 16 }}>
              <img
                src="/faviconsansfond.png"
                alt="TPLN"
                style={{ width: 260, height: 260, objectFit: "contain", opacity: 0.85 }}
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
