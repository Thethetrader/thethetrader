export function StaffSection() {
  return (
    <section
      className="staff"
      style={{ padding: "160px 0 128px", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <div style={{ display: "grid", placeItems: "center", paddingBottom: 64 }}>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: "52.8px",
              letterSpacing: "-0.04em",
              color: "oklch(0.141 0.005 285.823)",
              textAlign: "center",
              maxWidth: 680,
              margin: 0,
            }}
          >
            Formez-vous auprès de votre{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              expert
            </span>
          </h2>
          <p
            style={{
              fontSize: 20,
              fontWeight: 400,
              lineHeight: "28px",
              letterSpacing: "-0.02em",
              color: "oklch(0.21 0.006 285.885)",
              textAlign: "center",
              maxWidth: 760,
              paddingTop: 24,
              margin: 0,
            }}
          >
            Trader depuis 3 ans, je simplifie les sujets complexes et je vous accompagne pour vous aider à réussir.
          </p>
        </div>

        <div
          className="flex justify-center"
          style={{ gap: 40, alignItems: "center" }}
        >
          {/* Photo card */}
          <div
            style={{
              width: 360,
              height: 500,
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "inset 0 0 0 1px oklch(0.92 0.004 286 / 0.6)",
              background: "oklch(0.967 0.003 264.542 / 0.5)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 360,
                height: 500,
                display: "grid",
                alignItems: "end",
              }}
            >
              <img
                src="/images/staff/alexandre@2x.png"
                alt="TheTheTrader"
                width={360}
                height={500}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                  objectPosition: "bottom",
                }}
              />
            </div>
          </div>

          {/* About card */}
          <div
            style={{
              maxWidth: 640,
              padding: 40,
              borderRadius: 20,
              border: "1px solid oklch(0.92 0.004 286.32)",
              background: "oklch(0.98 0 0)",
            }}
          >
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: "40px",
                letterSpacing: "-0.03em",
                color: "oklch(0.141 0.005 285.823)",
                margin: 0,
                marginBottom: 24,
              }}
            >
              À propos de TheTheTrader
            </h2>
            <div
              style={{
                fontSize: 17,
                fontWeight: 400,
                lineHeight: "26px",
                color: "oklch(0.35 0.005 285)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <p style={{ margin: 0 }}>
                Trader depuis 3 ans. Des milliers d&apos;heures d&apos;écran.
              </p>
              <p style={{ margin: 0 }}>
                J&apos;ai testé les indicateurs. Les stratégies miracles. Les systèmes compliqués.
              </p>
              <p style={{ margin: 0 }}>
                Rien ne fonctionne durablement sans structure.
              </p>
              <p style={{ margin: 0 }}>
                TPLN n&apos;est pas né d&apos;une promesse. Il est né d&apos;un constat : la constance vient du cadre.
              </p>
              <p style={{ margin: 0, fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>
                Aujourd&apos;hui je partage :
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  "Une méthode claire",
                  "Une exécution expliquée",
                  "Un environnement structuré",
                  "Un suivi réel de performance",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 16,
                      lineHeight: "22px",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "oklch(0.5 0.15 260)",
                        flexShrink: 0,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p style={{ margin: 0, marginTop: 8 }}>
                Pas de marketing agressif. Pas de promesses irréalistes. Uniquement du travail structuré.
              </p>
            </div>

            {/* Social icons */}
            <div className="flex" style={{ gap: 12, marginTop: 28 }}>
              {/* X / Twitter */}
              <a
                href="#"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "oklch(0.92 0.004 286.32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.35 0.005 285)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "oklch(0.92 0.004 286.32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.35 0.005 285)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              {/* TikTok */}
              <a
                href="#"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "oklch(0.92 0.004 286.32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "oklch(0.35 0.005 285)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.16 8.16 0 005.58 2.2V11.7a4.85 4.85 0 01-3.58-1.59V6.69h3.58z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
