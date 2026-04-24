import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ChatBubbleIcon,
  ConstructIcon,
  PeopleIcon,
  SchoolIcon,
} from "./icons";

type Pillar = "learning" | "coachings" | "community" | "resources";

const PILLAR_BG: Record<Pillar, string> = {
  learning: "rgb(236, 246, 255)",
  coachings: "rgb(252, 236, 222)",
  community: "rgb(246, 241, 253)",
  resources: "rgb(235, 252, 235)",
};

const COPY: Record<
  Pillar,
  { badge: string; Icon: (p: { className?: string }) => ReactNode; h3: ReactNode; p: ReactNode }
> = {
  learning: {
    badge: "Journal TPLN",
    Icon: (p) => <SchoolIcon {...p} />,
    h3: <>Mesure ta performance réelle.</>,
    p: (
      <>
        Il mesure la qualité de tes décisions, pas seulement le résultat.
        <br />
        <br />
        <strong>Un amateur espère.</strong>
        <br />
        <strong>Un trader discipliné mesure.</strong>
        <br />
        <br />
        Ce que tu répètes.
        <br />
        Ce que tu dois corriger.
        <br />
        Ce qui te fait réellement progresser
      </>
    ),
  },
  coachings: {
    badge: "Modèle TPLN",
    Icon: (p) => <PeopleIcon {...p} />,
    h3: (
      <>
        Un modèle clair.
        <br />
        Reproductible.
        <br />
        Maîtrisé.
      </>
    ),
    p: (
      <>
        TPLN repose sur un cadre simple à comprendre, mais précis dans son exécution.
        <br />
        <br />
        Pas d&apos;indicateurs inutiles.
        <br />
        Pas de complexité artificielle.
        <br />
        <br />
        Un modèle structuré que tu peux appliquer avec constance.
        <br />
        <br />
        Tu comprends la logique.
        <br />
        Tu sais quoi valider.
        <br />
        Tu sais quand exécuter.
      </>
    ),
  },
  community: {
    badge: "Sessions Live",
    Icon: (p) => <ChatBubbleIcon {...p} />,
    h3: <>Exécution quotidienne en direct. TPLN</>,
    p: (
      <>
        Voir le modèle appliqué change tout.
        <br />
        <br />
        Sessions live 5 jours par semaine.
        <br />
        Opportunités détaillées en temps réel.
        <br />
        Notification immédiate via l&apos;application.
        <br />
        Transparence totale grâce au journal des performances partagées.
      </>
    ),
  },
  resources: {
    badge: "Application",
    Icon: (p) => <ConstructIcon {...p} />,
    h3: <>Application mobile TPLN</>,
    p: (
      <>
        L&apos;application TPLN centralise tout.
        <br />
        Exécution, live, journal, historique.
        <br />
        Un seul environnement.
        <br />
        Sans dispersion.
      </>
    ),
  },
};

const PILLARS: Pillar[] = ["learning", "coachings", "community", "resources"];

const LEARNING_TILES: { src: string; kind: "img" | "video"; poster?: string }[] = [
  { src: "/images/hero/hero-tpln-1.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-1.webp", kind: "img" },
  { src: "/images/hero/hero-tpln-2.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-2.webp", kind: "img" },
  { src: "/images/hero/hero-tpln-3.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-3.webp", kind: "img" },
  { src: "/images/hero/hero-tpln.mov", kind: "video" },
  { src: "/images/hero/hero-tpln-1.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-1.webp", kind: "img" },
];

const MOBILE_LEARNING_TILES: { src: string; kind: "img" | "video" }[] = [
  { src: "/images/hero/hero-tpln-1.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-1.webp", kind: "img" },
  { src: "/images/hero/hero-tpln.mov", kind: "video" },
  { src: "/images/hero/hero-tpln-2.webp", kind: "img" },
  { src: "/images/hero/hero-mobile-2.webp", kind: "img" },
  { src: "/images/hero/hero-tpln-3.webp", kind: "img" },
];

function Tile({
  src,
  kind,
  poster,
}: {
  src: string;
  kind: "img" | "video";
  poster?: string;
}) {
  return (
    <div
      style={{
        width: 372,
        height: 209.25,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "rgba(24, 0, 231, 0.04) 0px 8px 12px 0px",
        background: "#fff",
      }}
    >
      {kind === "img" ? (
        <img
          src={src}
          alt=""
          width={372}
          height={210}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          <source src={src} type={src.endsWith(".mov") ? "video/mp4" : "video/webm"} />
          {!src.endsWith(".mov") && <source src={src.replace(".webm", ".mp4")} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}

function baseVisualStyle(pillar: Pillar, initialTranslate: string): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    background: PILLAR_BG[pillar],
    borderRadius: 24,
    overflow: "hidden",
    transform: `translateY(${initialTranslate})`,
    opacity: 1,
    visibility: "visible",
    transition: "opacity 0.3s ease, visibility 0s linear 0s",
    willChange: "transform, opacity",
  };
}

const JOURNAL_TILES = [
  { icon: "BarChart", title: "Performance chiffrée", desc: "Métriques précises de tes résultats" },
  { icon: "Clock", title: "Discipline par session", desc: "Mesure ta rigueur réelle, pas ton ressenti." },
  { icon: "AlertTriangle", title: "Erreurs comportementales", desc: "Détecte les schémas qui sabotent ta performance." },
  { icon: "TrendingUp", title: "Drawdown maîtrisé", desc: "Contrôle ton risque. Protège ton capital." },
  { icon: "CheckCircle", title: "Performance mesurée", desc: "Win rate, profit factor, rentabilité réelle." },
  { icon: "Check", title: "Qualité d'exécution", desc: "Précision de tes entrées et sorties" },
];

const JOURNAL_ICONS: Record<string, React.ReactNode> = {
  BarChart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
  ),
  Clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  AlertTriangle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  TrendingUp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  ),
  CheckCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
};

function JournalTile({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border: "1px solid oklch(0.92 0.004 286.32)",
        background: "oklch(0.98 0 0)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "oklch(0.95 0.02 260)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "oklch(0.5 0.15 260)",
        }}
      >
        {JOURNAL_ICONS[icon]}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: "17px",
          color: "oklch(0.141 0.005 285.823)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "16px",
          color: "oklch(0.552 0.016 285.938)",
        }}
      >
        {desc}
      </div>
    </div>
  );
}

function LearningVisual({
  innerRef,
}: {
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={innerRef} style={baseVisualStyle("learning", "0%")}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 320,
          display: "grid",
          gridTemplateColumns: "repeat(3, 372px)",
          gridTemplateRows: "repeat(3, 209.25px)",
          gap: 32,
          transform:
            "matrix(0.840991, -0.103842, 0.194158, 0.845724, -273.456, -1.62392)",
          transformOrigin: "0 0",
        }}
      >
        {LEARNING_TILES.map((t) => (
          <Tile key={t.src} {...t} />
        ))}
      </div>
    </div>
  );
}

function CenteredImageVisual({
  innerRef,
  pillar,
  src,
  width,
  height,
  alt,
}: {
  innerRef: (el: HTMLDivElement | null) => void;
  pillar: Pillar;
  src: string;
  width: number;
  height: number;
  alt: string;
}) {
  return (
    <div
      ref={innerRef}
      style={{
        ...baseVisualStyle(pillar, "101%"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        style={{ width, height, display: "block" }}
      />
    </div>
  );
}

export function EcosystemSection() {
  const copyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visualRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const slideRange = vh * 0.5;

      const progresses = PILLARS.map((_, i) => {
        if (i === 0) return 1;
        const el = copyRefs.current[i];
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const raw = (vh - rect.top) / slideRange;
        return Math.max(0, Math.min(1, raw));
      });

      visualRefs.current.forEach((el, i) => {
        if (!el) return;
        const progress = progresses[i];
        const nextProgress = i < progresses.length - 1 ? progresses[i + 1] : 0;
        el.style.transform = `translateY(${((1 - progress) * 101).toFixed(3)}%)`;
        if (nextProgress >= 1) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
        } else {
          el.style.opacity = "1";
          el.style.visibility = "visible";
        }
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="services"
      className="ecosystem"
      style={{ width: "100%", padding: "80px 0 120px", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        {/* Section header */}
        <div style={{ display: "grid", placeItems: "center", paddingBottom: 56 }}>
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
            Une méthode d&apos;apprentissage conçue pour{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              votre réussite
            </span>
          </h2>
        </div>

        {/* Desktop sticky-pin layout */}
        <div
          className="hidden lg:flex"
          style={{ flexDirection: "row", gap: 40, alignItems: "stretch" }}
        >
          {/* LEFT: pinned visual stack */}
          <div style={{ flex: "0 0 768px", position: "relative" }}>
            <div
              style={{
                position: "sticky",
                top: 80,
                width: 768,
                height: 912,
                overflow: "hidden",
                borderRadius: 29,
              }}
            >
              <div
                style={{
                  width: 640,
                  height: 760,
                  transform: "scale(1.2)",
                  transformOrigin: "0 0",
                  position: "relative",
                }}
              >
              <LearningVisual
                innerRef={(el) => {
                  visualRefs.current[0] = el;
                }}
              />
              <div
                ref={(el) => { visualRefs.current[1] = el; }}
                style={{ ...baseVisualStyle("coachings", "101%"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, overflowY: "auto" }}
              >
                <img src="/images/ecosystem/tpln-section2-1.png" alt="TPLN" loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }} />
                <img src="/images/ecosystem/tpln-section2-2.png" alt="TPLN" loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }} />
              </div>
              <div
                ref={(el) => { visualRefs.current[2] = el; }}
                style={{ ...baseVisualStyle("community", "101%"), display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
              >
                <video autoPlay loop muted playsInline style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }}>
                  <source src="/images/ecosystem/tpln-section3.mp4" type="video/mp4" />
                </video>
              </div>
              <div
                ref={(el) => { visualRefs.current[3] = el; }}
                style={{ ...baseVisualStyle("resources", "101%"), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 32, alignContent: "center", justifyItems: "center" }}
              >
                {["tpln-section4-1.png","tpln-section4-2.png","tpln-section4-3.png","tpln-section4-4.png"].map((f) => (
                  <img key={f} src={`/images/ecosystem/${f}`} alt="App TPLN" loading="lazy" style={{ width: "100%", maxWidth: 220, height: "auto", borderRadius: 10, display: "block" }} />
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* RIGHT: scrolling copy stack */}
          <div style={{ flex: "1 1 auto" }}>
            {PILLARS.map((pillar, idx) => {
              const { badge, Icon, h3, p } = COPY[pillar];
              return (
                <div
                  key={pillar}
                  ref={(el) => {
                    copyRefs.current[idx] = el;
                  }}
                  data-pillar={pillar}
                  style={{
                    height: 900,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    maxWidth: 544,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      height: 24,
                      width: "fit-content",
                      background: "oklch(0.967 0.001 286.375)",
                      color: "oklch(0.21 0.006 285.885)",
                      fontSize: 12,
                      lineHeight: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.12px",
                      borderRadius: 9999,
                    }}
                  >
                    <Icon />
                    {badge}
                  </span>
                  <h3
                    style={{
                      fontSize: 36,
                      fontWeight: 600,
                      lineHeight: "40px",
                      letterSpacing: "-0.03em",
                      color: "oklch(0.141 0.005 285.823)",
                      padding: "16px 0 40px",
                      margin: 0,
                    }}
                  >
                    {h3}
                  </h3>
                  <p
                    style={{
                      fontSize: 19,
                      fontWeight: 400,
                      lineHeight: "28.5px",
                      letterSpacing: "-0.02em",
                      color: "oklch(0.141 0.005 285.823)",
                      margin: 0,
                    }}
                  >
                    {p}
                  </p>
                  {pillar === "learning" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 12,
                        marginTop: 32,
                      }}
                    >
                      {JOURNAL_TILES.map((t) => (
                        <JournalTile key={t.title} {...t} />
                      ))}
                    </div>
                  )}
                  {pillar === "community" && (
                    <div
                      style={{
                        marginTop: 32,
                        padding: 28,
                        borderRadius: 16,
                        border: "1px solid oklch(0.92 0.004 286.32)",
                        background: "oklch(0.98 0 0)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: "24px",
                          color: "oklch(0.141 0.005 285.823)",
                          marginBottom: 20,
                        }}
                      >
                        Inclus dans le plan
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                        }}
                      >
                        {[
                          "Sessions live 5 jours / semaine",
                          "Opportunités validées et expliquées",
                          "Notification instantanée via l'application",
                          "Journal public des performances partagées",
                        ].map((item) => (
                          <li
                            key={item}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 15,
                              fontWeight: 400,
                              lineHeight: "21px",
                              color: "oklch(0.141 0.005 285.823)",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "oklch(0.5 0.15 260)",
                                flexShrink: 0,
                              }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile stacked layout */}
        <div className="flex flex-col gap-20 lg:hidden">
          {PILLARS.map((pillar) => {
            const { badge, Icon, h3, p } = COPY[pillar];
            if (pillar === "learning") {
              return (
                <div key={pillar}>
                  <div
                    style={{
                      position: "relative",
                      background: PILLAR_BG[pillar],
                      borderRadius: 24,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: 380,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 20,
                          left: -40,
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 180px)",
                          gap: 16,
                          transform: "matrix(0.92, -0.09, 0.18, 0.88, -20, 10)",
                          transformOrigin: "0 0",
                        }}
                      >
                        {MOBILE_LEARNING_TILES.map((t) => (
                          <div
                            key={t.src}
                            style={{
                              width: 180,
                              height: 101,
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "#fff",
                            }}
                          >
                            {t.kind === "img" ? (
                              <img
                                src={t.src}
                                alt=""
                                width={180}
                                height={101}
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                poster={t.poster}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              >
                                <source src={t.src} type={t.src.endsWith(".mov") ? "video/mp4" : "video/webm"} />
                                {!t.src.endsWith(".mov") && <source src={t.src.replace(".webm", ".mp4")} type="video/mp4" />}
                              </video>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: "24px 24px 32px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 8px",
                          height: 24,
                          background: "rgba(255,255,255,0.85)",
                          color: "oklch(0.21 0.006 285.885)",
                          fontSize: 12,
                          lineHeight: "12px",
                          fontWeight: 500,
                          letterSpacing: "0.12px",
                          borderRadius: 9999,
                        }}
                      >
                        <Icon />
                        {badge}
                      </span>
                      <h3
                        style={{
                          fontSize: 28,
                          fontWeight: 600,
                          lineHeight: 1.15,
                          letterSpacing: "-0.03em",
                          color: "oklch(0.141 0.005 285.823)",
                          padding: "16px 0 24px",
                          margin: 0,
                        }}
                      >
                        {h3}
                      </h3>
                      <p
                        style={{
                          fontSize: 17,
                          fontWeight: 400,
                          lineHeight: 1.5,
                          letterSpacing: "-0.02em",
                          color: "oklch(0.141 0.005 285.823)",
                          margin: 0,
                        }}
                      >
                        {p}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={pillar}>
                <div
                  style={{
                    position: "relative",
                    background: PILLAR_BG[pillar],
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      height: 380,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {pillar === "coachings" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 24px", width: "100%" }}>
                        <img src="/images/ecosystem/tpln-section2-1.png" alt="" loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }} />
                        <img src="/images/ecosystem/tpln-section2-2.png" alt="" loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }} />
                      </div>
                    ) : pillar === "community" ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", width: "100%" }}>
                        <video autoPlay loop muted playsInline style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }}>
                          <source src="/images/ecosystem/tpln-section3.mp4" type="video/mp4" />
                        </video>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px", width: "100%", justifyItems: "center" }}>
                        {["tpln-section4-1.png","tpln-section4-2.png","tpln-section4-3.png","tpln-section4-4.png"].map((f) => (
                          <img key={f} src={`/images/ecosystem/${f}`} alt="App TPLN" loading="lazy" style={{ width: "100%", maxWidth: 80, height: "auto", borderRadius: 8, display: "block" }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "24px 24px 32px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        height: 24,
                        background: "rgba(255,255,255,0.85)",
                        color: "oklch(0.21 0.006 285.885)",
                        fontSize: 12,
                        lineHeight: "12px",
                        fontWeight: 500,
                        letterSpacing: "0.12px",
                        borderRadius: 9999,
                      }}
                    >
                      <Icon />
                      {badge}
                    </span>
                    <h3
                      style={{
                        fontSize: 28,
                        fontWeight: 600,
                        lineHeight: 1.15,
                        letterSpacing: "-0.03em",
                        color: "oklch(0.141 0.005 285.823)",
                        padding: "16px 0 24px",
                        margin: 0,
                      }}
                    >
                      {h3}
                    </h3>
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        letterSpacing: "-0.02em",
                        color: "oklch(0.141 0.005 285.823)",
                        margin: 0,
                      }}
                    >
                      {p}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
