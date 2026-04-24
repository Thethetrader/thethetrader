import { useState } from "react";
import { StaticPageLayout } from "./StaticPageLayout";

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <StaticPageLayout title="Contact">
      <p style={{ marginBottom: 40 }}>
        Une question sur la méthode TPLN, un problème technique ou tu souhaites réserver une session 1:1 ? Remplis le formulaire ci-dessous, nous te répondrons sous 24h.
      </p>

      {sent ? (
        <div style={{ padding: 32, borderRadius: 16, background: "oklch(0.97 0.05 145)", border: "1px solid oklch(0.85 0.1 145)", color: "oklch(0.3 0.1 145)", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>✓ Message envoyé !</p>
          <p style={{ margin: "8px 0 0" }}>Nous te répondrons dans les plus brefs délais.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
          <input
            type="text"
            placeholder="Ton prénom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ height: 48, padding: "0 16px", fontSize: 15, border: "1px solid oklch(0.92 0.004 286.32)", borderRadius: 10, background: "#fff", outline: "none" }}
          />
          <input
            type="email"
            placeholder="Ton email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={{ height: 48, padding: "0 16px", fontSize: 15, border: "1px solid oklch(0.92 0.004 286.32)", borderRadius: 10, background: "#fff", outline: "none" }}
          />
          <textarea
            placeholder="Ton message..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            rows={5}
            style={{ padding: "12px 16px", fontSize: 15, border: "1px solid oklch(0.92 0.004 286.32)", borderRadius: 10, background: "#fff", outline: "none", resize: "vertical" }}
          />
          <button
            type="submit"
            style={{ height: 48, padding: "0 24px", fontSize: 15, fontWeight: 600, color: "#fff", background: "oklch(0.21 0.006 285.885)", border: "none", borderRadius: 10, cursor: "pointer" }}
          >
            Envoyer le message
          </button>
        </form>
      )}

      <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ padding: 24, borderRadius: 14, border: "1px solid oklch(0.92 0.004 286.32)" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>Session 1:1</p>
          <p style={{ margin: 0, fontSize: 14, color: "oklch(0.55 0.01 286)" }}>Coaching individuel — 250€/h. Réserve via le formulaire en précisant "Session 1:1" dans ton message.</p>
        </div>
        <div style={{ padding: 24, borderRadius: 14, border: "1px solid oklch(0.92 0.004 286.32)" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>Support technique</p>
          <p style={{ margin: 0, fontSize: 14, color: "oklch(0.55 0.01 286)" }}>Problème d'accès, bug ou question sur ton compte. Réponse sous 24h en jours ouvrés.</p>
        </div>
      </div>
    </StaticPageLayout>
  );
}
