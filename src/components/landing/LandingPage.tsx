import "./landing-responsive.css";
import { SiteHeader } from "./site-header";
import { HeroSection } from "./hero-section";
import { EcosystemSection } from "./ecosystem-section";
import { ProgramsSection } from "./programs-section";
import { StaffSection } from "./staff-section";
import { ReviewsSection } from "./reviews-section";
import { QualiopiStatsSection } from "./qualiopi-section";
import { TrialSection } from "./trial-section";
import { PostsSection } from "./posts-section";
import { BookingFreebiesRow } from "./booking-freebies";
import { ProblemSection } from "./problem-section";
import { SiteFooter } from "./site-footer";

export function LandingPage({ onOpenAuth }: { onOpenAuth?: () => void }) {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "oklch(0.141 0.005 285.823)",
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
      }}
    >
      <SiteHeader onOpenAuth={onOpenAuth} />
      {/* Logo between header and hero */}
      <div className="landing-logo-wrapper" style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 0, background: "#fff", position: "relative", zIndex: 0 }}>
        <img
          src="/faviconsansfond.webp"
          alt="TPLN"
          fetchPriority="high"
          loading="eager"
          style={{ width: "min(800px, 90vw)", height: "auto", objectFit: "contain" }}
        />
      </div>
      <main>
        <HeroSection onOpenAuth={onOpenAuth} />
        <ProblemSection />

        <EcosystemSection />
        <ProgramsSection />
        <StaffSection />
        <ReviewsSection />

        {/* CTA rapide après reviews */}
        <div className="cta-block-wrapper" style={{ padding: "0 20px 60px", maxWidth: 1400, margin: "0 auto" }}>
          <div className="cta-block-inner" style={{
            borderRadius: 24,
            background: "radial-gradient(120% 100% at 50% 0%, rgba(26, 107, 42, 0.08) 0%, rgba(255,255,255,0) 60%), oklch(0.99 0.002 286)",
            border: "1px solid oklch(0.92 0.004 286.32)",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 8,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, letterSpacing: "0.12px", color: "oklch(0.552 0.016 285.938)", textTransform: "uppercase" }}>
              Ils l'ont fait. Toi aussi tu peux.
            </p>
            <h2 style={{ margin: "8px 0 0", fontSize: 36, fontWeight: 600, lineHeight: "40px", letterSpacing: "-0.03em", color: "oklch(0.141 0.005 285.823)", maxWidth: 600 }}>
              Rejoins les traders qui ont arrêté d'improviser.
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 19, fontWeight: 400, lineHeight: "28.5px", letterSpacing: "-0.02em", color: "oklch(0.21 0.006 285.885)", maxWidth: 480 }}>
              Méthode. Journal. Sessions live. Tout ce qu'il faut pour trader avec rigueur — dès aujourd'hui.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="#trial" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", background: "#1a6b2a", color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", borderRadius: 12, textDecoration: "none", gap: 8 }}>
                Démarrer gratuitement
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8h11M9.5 3.5L14 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#pricing" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", background: "#fff", color: "oklch(0.141 0.005 285.823)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em", borderRadius: 12, textDecoration: "none", border: "1px solid oklch(0.92 0.004 286.32)" }}>
                Voir les offres
              </a>
            </div>
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "oklch(0.552 0.016 285.938)" }}>
              30 jours d'essai gratuit · Sans engagement · Annulation en 1 clic
            </p>
          </div>
        </div>

        <QualiopiStatsSection />
        <TrialSection />
        <PostsSection />
        <BookingFreebiesRow />
      </main>
      <SiteFooter />

      {/* Mobile fixed bottom CTA */}
      <div className="mobile-bottom-cta">
        <a
          href="#trial"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 16px 10px",
            height: 44,
            background: "oklch(0.141 0.005 285.823)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textDecoration: "none",
            borderRadius: 12,
          }}
        >
          Essayer gratuitement
        </a>
      </div>
    </div>
  );
}
