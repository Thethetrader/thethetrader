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
      <main>
        <HeroSection onOpenAuth={onOpenAuth} />
        <ProblemSection />
        <EcosystemSection />
        <ProgramsSection />
        <StaffSection />
        <ReviewsSection />
        <QualiopiStatsSection />
        <TrialSection />
        <PostsSection />
        <BookingFreebiesRow />
      </main>
      <SiteFooter />
    </div>
  );
}
