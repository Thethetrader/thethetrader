const RESOURCES = [
  {
    id: "replay",
    title: "Replays de sessions live",
    desc: "Revivez nos meilleures sessions d'exécution en direct. Analysez chaque décision, chaque setup validé par la méthode TPLN.",
    cta: "Accéder",
    href: "#trial",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.1)" />
        <polygon points="34,28 58,40 34,52" fill="white" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: "journal",
    title: "Journal de trading TPLN",
    desc: "Le template professionnel utilisé dans nos sessions. Suivez vos trades, mesurez votre edge et progressez avec structure.",
    cta: "Télécharger",
    href: "#trial",
    bg: "linear-gradient(135deg, #0a9ef3 0%, #006fba 100%)",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="18" y="14" width="44" height="54" rx="4" fill="rgba(255,255,255,0.15)" />
        <rect x="24" y="22" width="20" height="3" rx="1.5" fill="white" opacity="0.8" />
        <rect x="24" y="30" width="32" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="24" y="36" width="28" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="24" y="42" width="32" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="24" y="48" width="24" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="24" y="54" width="20" height="2" rx="1" fill="white" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "methode",
    title: "Guide de la méthode TPLN",
    desc: "Les fondamentaux de la méthode TPLN en PDF. Structure, confluences, gestion du risque — tout ce qu'il faut pour commencer.",
    cta: "Télécharger",
    href: "#trial",
    bg: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="20" y="12" width="36" height="48" rx="3" fill="rgba(255,255,255,0.15)" />
        <rect x="26" y="20" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
        <rect x="26" y="28" width="20" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="26" y="33" width="24" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="26" y="38" width="18" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="26" y="44" width="22" height="2" rx="1" fill="white" opacity="0.5" />
        <rect x="20" y="64" width="36" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
  },
  {
    id: "newsletter",
    title: "Newsletter trading hebdo",
    desc: "Chaque semaine : les setups de la semaine, l'analyse macro, et les opportunités identifiées par TheTheTrader.",
    cta: "S'abonner",
    href: "#trial",
    bg: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="14" y="24" width="52" height="36" rx="4" fill="rgba(255,255,255,0.15)" />
        <path d="M14 28l26 18 26-18" stroke="white" strokeWidth="2.5" strokeOpacity="0.8" fill="none" />
      </svg>
    ),
  },
];

export function FreeResourcesSection() {
  return (
    <section style={{ padding: "100px 0 80px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, letterSpacing: "0.1em", color: "oklch(0.552 0.016 285.938)", textTransform: "uppercase" }}>
            Contenus gratuits
          </p>
          <h2
            style={{
              margin: "0 0 20px",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "oklch(0.141 0.005 285.823)",
            }}
          >
            Voir toutes les ressources gratuites
          </h2>
          <p style={{ margin: 0, maxWidth: 560, marginLeft: "auto", marginRight: "auto", fontSize: 18, lineHeight: "28px", color: "oklch(0.442 0.017 285.786)" }}>
            Des outils concrets, des replays de sessions et des guides pour trader avec méthode — sans débourser un centime.
          </p>
        </div>

        {/* Resource grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 0,
            border: "1px solid #e8e8e8",
            borderRadius: 16,
            overflow: "hidden",
          }}
          className="resources-grid"
        >
          {RESOURCES.map((r, i) => (
            <div
              key={r.id}
              style={{
                borderRight: i % 2 === 0 ? "1px solid #e8e8e8" : "none",
                borderBottom: i < 2 ? "1px solid #e8e8e8" : "none",
              }}
            >
              {/* Image zone */}
              <div
                style={{
                  background: r.bg,
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {r.icon}
              </div>

              {/* Content zone */}
              <div style={{ padding: "28px 32px 32px" }}>
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "oklch(0.141 0.005 285.823)",
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{
                    margin: "0 0 20px",
                    fontSize: 15,
                    lineHeight: "22px",
                    color: "oklch(0.442 0.017 285.786)",
                  }}
                >
                  {r.desc}
                </p>
                <a
                  href={r.href}
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
                  {r.cta}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .resources-grid {
            grid-template-columns: 1fr !important;
          }
          .resources-grid > div {
            border-right: none !important;
            border-bottom: 1px solid #e8e8e8 !important;
          }
          .resources-grid > div:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>
    </section>
  );
}
