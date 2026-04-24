export function ProblemSection() {
  const dark = "oklch(0.141 0.005 285.823)";
  const body = "oklch(0.21 0.006 285.885)";
  const muted = "oklch(0.552 0.016 285.938)";

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 24,
    padding: "0 10px",
    background: "oklch(0.967 0.001 286.375)",
    color: body,
    fontSize: 12,
    lineHeight: "12px",
    fontWeight: 500,
    letterSpacing: "0.12px",
    borderRadius: 9999,
    marginBottom: 16,
  };

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
          <span style={badgeStyle}>Le problème</span>

          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              lineHeight: "40px",
              letterSpacing: "-0.03em",
              color: dark,
              margin: "0 0 16px",
            }}
          >
            Le trading est devenu flou.
          </h2>

          <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {["Indicateurs partout.", "Stratégies qui changent.", "Aucune structure claire."].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 12, color: body, fontSize: 19, fontWeight: 400, lineHeight: "28.5px", letterSpacing: "-0.02em" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: muted, flexShrink: 0, display: "block" }} />
                {item}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12px", textTransform: "uppercase", color: muted, margin: "0 0 12px" }}>
            Pourquoi la majorité échoue ?
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Pas de cadre", "Pas de constance", "Pas de mesure", "Trop d'improvisation"].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: muted, fontSize: 17, fontWeight: 400, lineHeight: "25px", letterSpacing: "-0.02em" }}>
                <span style={{ fontSize: 13, color: muted, lineHeight: 1, flexShrink: 0 }}>✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "oklch(0.92 0.004 286.32)", alignSelf: "stretch" }} />

        {/* Right: La solution */}
        <div>
          <span style={badgeStyle}>La solution</span>

          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              lineHeight: "40px",
              letterSpacing: "-0.03em",
              color: dark,
              margin: "0 0 16px",
            }}
          >
            TPLN remet de la structure.
          </h2>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Un modèle simple.", desc: "Un cadre clair applicable dès le premier trade." },
              { label: "Des règles précises.", desc: "Chaque décision suit un protocole défini." },
              { label: "Une exécution disciplinée.", desc: "La méthode prime sur l'émotion." },
              { label: "Un système mesurable.", desc: "Tu suis tes progrès en temps réel." },
            ].map(({ label, desc }) => (
              <li key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ marginTop: 5, width: 15, height: 15, borderRadius: "50%", background: dark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <p style={{ margin: 0, fontSize: 19, fontWeight: 400, lineHeight: "28.5px", letterSpacing: "-0.02em", color: body }}>
                  <strong style={{ fontWeight: 600, color: dark }}>{label}</strong>{" "}{desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
