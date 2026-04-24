export function ProblemSection() {
  return (
    <div className="mx-auto" style={{ maxWidth: 1400, padding: "40px 20px 0" }}>
      <section
        className="problem-section-inner"
        style={{
          borderRadius: 24,
          background: "oklch(0.10 0.01 260)",
          border: "1px solid oklch(0.18 0.01 260)",
          padding: "56px 64px",
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
              color: "oklch(0.65 0.18 25)",
              marginBottom: 16,
            }}
          >
            Le problème
          </span>

          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: "0 0 24px",
              lineHeight: "1.1",
            }}
          >
            Le trading est<br />devenu flou.
          </h2>

          <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {["Indicateurs partout.", "Stratégies qui changent.", "Aucune structure claire."].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.55)", fontSize: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.65 0.18 25)", flexShrink: 0, display: "block" }} />
                {item}
              </li>
            ))}
          </ul>

          <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", margin: "0 0 14px" }}>
            Pourquoi la majorité échoue ?
          </p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Pas de cadre", "Pas de constance", "Pas de mesure", "Trop d'improvisation"].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.40)", fontSize: 15 }}>
                <span style={{ fontSize: 13, color: "oklch(0.65 0.18 25)" }}>✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "oklch(0.22 0.01 260)", alignSelf: "stretch" }} />

        {/* Right: La solution */}
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "oklch(0.72 0.17 145)",
              marginBottom: 16,
            }}
          >
            La solution
          </span>

          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: "0 0 24px",
              lineHeight: "1.1",
            }}
          >
            TPLN remet<br />de la structure.
          </h2>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Un modèle simple.", desc: "Un cadre clair applicable dès le premier trade." },
              { label: "Des règles précises.", desc: "Chaque décision suit un protocole défini." },
              { label: "Une exécution disciplinée.", desc: "La méthode prime sur l'émotion." },
              { label: "Un système mesurable.", desc: "Tu suis tes progrès en temps réel." },
            ].map(({ label, desc }) => (
              <li key={label} style={{ display: "flex", gap: 14 }}>
                <span style={{ marginTop: 3, width: 16, height: 16, borderRadius: "50%", background: "oklch(0.72 0.17 145)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div>
                  <span style={{ color: "#ffffff", fontWeight: 600, fontSize: 15 }}>{label}</span>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginLeft: 6 }}>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  );
}
