import type { ReactNode } from "react";

export function StaticPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "inherit" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid oklch(0.92 0.004 286.32)", padding: "0 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/TPLNFAVICONFINAL.png" alt="TPLN" width={32} height={32} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>TPLN</span>
          </a>
          <a href="/" style={{ fontSize: 14, color: "oklch(0.442 0.017 285.786)", textDecoration: "none" }}>← Retour à l'accueil</a>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 20px 120px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: "oklch(0.141 0.005 285.823)", marginBottom: 40 }}>
          {title}
        </h1>
        <div style={{ fontSize: 16, lineHeight: "26px", color: "oklch(0.35 0.01 286)" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
