export function ProblemSection() {
  const dark = "oklch(0.141 0.005 285.823)";
  const mid = "oklch(0.45 0.01 286)";
  const light = "oklch(0.552 0.016 285.938)";

  return (
    <div className="mx-auto" style={{ maxWidth: 1400, padding: "40px 20px 0" }}>
      <section
        className="problem-section-inner"
        style={{
          borderRadius: 24,
          background:
            "radial-gradient(120% 100% at 100% 0%, rgba(255, 82, 165, 0.10) 0%, rgba(255,255,255,0) 60%), oklch(0.99 0.002 286)",
          border: "1px solid oklch(0.92 0.004 286.32)",
          padding: "48px 56px",
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          gap: "0 48px",
          alignItems: "start",
        }}
      >
        {/* Left: Le problème */}
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.55 0.18 25)",
              marginBottom: 14,
            }}
          >
            Le problème
          </span>

          <h2
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: dark,
              margin: "0 0 20px",
              lineHeight: "1.15",
            }}
          >
            Le trading est devenu flou.
          </h2>

          <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {["Indicateurs partout.", "Stratégies qui changent.", "Aucune structure claire."].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: mid, fontSize: 15 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(0.55 0.18 25)", flexShrink: 0, display: "block" }} />
                {item}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: light, margin: "0 0 12px" }}>
            Pourquoi la majorité échoue ?
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
            {["Pas de cadre", "Pas de constance", "Pas de mesure", "Trop d'improvisation"].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 9, color: mid, fontSize: 14 }}>
                <span style={{ fontSize: 12, color: "oklch(0.55 0.18 25)", fontWeight: 700, lineHeight: 1 }}>✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "oklch(0.92 0.004 286.32)", alignSelf: "stretch" }} />

        {/* Right: La solution */}
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.45 0.15 145)",
              marginBottom: 14,
            }}
          >
            La solution
          </span>

          <h2
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: dark,
              margin: "0 0 20px",
              lineHeight: "1.15",
            }}
          >
            TPLN remet de la structure.
          </h2>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Un modèle simple.", desc: "Un cadre clair applicable dès le premier trade." },
              { label: "Des règles précises.", desc: "Chaque décision suit un protocole défini." },
              { label: "Une exécution disciplinée.", desc: "La méthode prime sur l'émotion." },
              { label: "Un système mesurable.", desc: "Tu suis tes progrès en temps réel." },
            ].map(({ label, desc }) => (
              <li key={label} style={{ display: "flex", gap: 12 }}>
                <span style={{ marginTop: 2, width: 16, height: 16, borderRadius: "50%", background: "oklch(0.141 0.005 285.823)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div>
                  <span style={{ color: dark, fontWeight: 600, fontSize: 15 }}>{label}</span>
                  <span style={{ color: light, fontSize: 14, marginLeft: 6 }}>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
