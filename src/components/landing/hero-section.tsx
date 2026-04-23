import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, StarIcon } from "./icons";

const WORDS = ["Trading", "Bourse", "Crypto"] as const;
const VISUALS = [
  { key: "trading", src: "/images/hero/hero-chrome-trading@2x.webp" },
  { key: "stocks", src: "/images/hero/hero-chrome-stocks@2x.webp" },
  { key: "crypto", src: "/images/hero/hero-chrome-crypto@2x.webp" },
] as const;

const GRID_ROWS = 6;
const GRID_COLS = 10;
const CELL_COUNT = GRID_ROWS * GRID_COLS;

const COLORFLOW_SRC =
  "https://colorflow.ls.graphics/embed.html#eyJjb2xvcnMiOlsiI0ZGRkZGRiIsIiNGOEY4RjgiLCIjRkNGQ0ZDIiwiI0YwRjBGMCJdLCJzcGVlZCI6MC41LCJob3Jpem9udGFsUHJlc3N1cmUiOjMsInZlcnRpY2FsUHJlc3N1cmUiOjMsIndhdmVGcmVxdWVuY3lYIjozLCJ3YXZlRnJlcXVlbmN5WSI6MywiaGlnaGxpZ2h0cyI6NSwiYW1wbGl0dWRlIjoxLCJzaGFkb3dzIjo1LCJuaXR0cyI6MX0=";

function makeInitialLights() {
  const arr = new Array(CELL_COUNT).fill(false);
  for (let i = 0; i < 12; i += 1) {
    arr[Math.floor(Math.random() * CELL_COUNT)] = true;
  }
  return arr;
}

export function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lights, setLights] = useState<boolean[]>(() => new Array(CELL_COUNT).fill(false));

  useEffect(() => {
    setLights(makeInitialLights());
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % WORDS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLights((prev) => {
        const next = prev.slice();
        const toggles = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < toggles; i += 1) {
          const idx = Math.floor(Math.random() * CELL_COUNT);
          next[idx] = !next[idx];
        }
        return next;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const cells = useMemo(() => Array.from({ length: CELL_COUNT }, (_, i) => i), []);

  return (
    <section
      className="hero relative overflow-hidden bg-white"
      style={{
        padding: "180px 0 80px",
        letterSpacing: "-0.01em",
      }}
    >
      {/* Colorflow animated gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
        style={{ zIndex: -1, clipPath: "inset(0)" }}
      >
        <div
          className="w-full h-full"
          style={{ minHeight: "100%", aspectRatio: "16 / 9", background: "rgb(252, 252, 252)" }}
        >
          <iframe
            src={COLORFLOW_SRC}
            title="hero background"
            width={800}
            height={600}
            frameBorder={0}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts"
            style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        </div>
      </div>

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1080, padding: "0 20px" }}
      >
        {/* Billie Jean grid */}
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            zIndex: -2,
            top: 275.016,
            right: -461,
            bottom: -325.977,
            left: 540,
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_COLS}, 100px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 100px)`,
            transform: "matrix(1,0,0,1,-500.5,-342.57)",
          }}
        >
          {cells.map((i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid rgb(255,255,255)",
                borderRight: "1px solid oklch(0.141 0.005 285.823)",
                borderBottom: "1px solid oklch(0.141 0.005 285.823)",
                borderLeft: "1px solid rgb(255,255,255)",
                backgroundColor: "oklch(0.141 0.005 285.823)",
                opacity: lights[i] ? 0.3 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          ))}
        </div>

        {/* Hero visuals (crossfade) */}
        {VISUALS.map((v, idx) => {
          const isActive = idx === activeIdx;
          return (
            <picture
              key={v.key}
              className="absolute"
              style={{
                top: 247.5,
                right: 20,
                left: 540,
                width: 520,
                maxWidth: 520,
                height: 519.5,
                zIndex: -1,
                opacity: isActive ? 1 : 0,
                transition: isActive
                  ? "opacity 0.8s ease-out"
                  : "opacity 0.3s ease-in",
              }}
            >
              <img
                src={v.src}
                alt=""
                width={520}
                height={520}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </picture>
          );
        })}

        {/* Hero copy */}
        <div
          className="flex flex-col items-center text-center"
          style={{ paddingBottom: 96, width: "100%" }}
        >
          <span
            className="inline-flex items-center justify-center"
            style={{
              gap: 4,
              padding: "4px 8px",
              height: 24,
              background: "oklch(0.967 0.001 286.375)",
              color: "oklch(0.21 0.006 285.885)",
              fontSize: 12,
              lineHeight: "12px",
              fontWeight: 500,
              letterSpacing: "0.12px",
              borderRadius: 9999,
              border: "1px solid transparent",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: 18,
                height: 10.195,
                borderRadius: 2,
                background:
                  "linear-gradient(to right, #000091 0% 33%, #FFFFFF 33% 66%, #E1000F 66% 100%)",
              }}
            />
            N°1 en France
          </span>

          <h1
            className="hero-headline"
            style={{
              margin: "24px 0 32px",
              maxWidth: 692,
              fontSize: 64,
              fontWeight: 600,
              lineHeight: "74.24px",
              letterSpacing: "-0.032em",
              color: "oklch(0.21 0.006 285.885)",
              textAlign: "center",
            }}
          >
            Apprenez à investir avec succès en{" "}
            <span
              style={{
                display: "inline-grid",
                gridTemplateColumns: "auto",
                gridTemplateRows: "76.8px",
                minHeight: 76.8,
                paddingRight: 1.28,
                overflow: "hidden",
                verticalAlign: "bottom",
              }}
            >
              {WORDS.map((word, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <span
                    key={word}
                    style={{
                      gridArea: "1 / 1",
                      lineHeight: "64px",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(57.6px)",
                      transition: isActive
                        ? "opacity 0.4s, transform 0.4s"
                        : "opacity 0.3s, transform 0s 0.3s",
                      color: "oklch(0.21 0.006 285.885)",
                      fontWeight: 600,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </span>
          </h1>

          <p
            style={{
              marginBottom: 56,
              maxWidth: 480,
              minHeight: 70,
              fontSize: 22,
              fontWeight: 400,
              lineHeight: "33px",
              letterSpacing: "-0.02em",
              color: "oklch(0.442 0.017 285.786)",
              textAlign: "center",
            }}
          >
            L&apos;écosystème de formation ultime pour enfin réussir sur les marchés financiers.
          </p>

          <div className="flex" style={{ gap: 16 }}>
            <a
              href="/formation-bourse-offerte2303219/"
              className="trial-button flex items-center justify-center"
              style={{
                gap: 6,
                padding: "0 10px 0 12px",
                height: 40,
                background: "oklch(0.21 0.006 285.885 / 0.85)",
                color: "oklch(0.985 0 0)",
                fontSize: 15,
                fontWeight: 500,
                lineHeight: "21.43px",
                borderRadius: 9,
                border: "1px solid transparent",
                transition: "0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.21 0.006 285.885 / 1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.21 0.006 285.885 / 0.85)";
              }}
            >
              Essayer Gratuitement
              <ArrowRightIcon width={17} height={17} />
            </a>
          </div>

          {/* Trustpilot static pill */}
          <div
            className="flex items-center justify-center"
            style={{ paddingTop: 32, width: 300, height: 52, gap: 8 }}
          >
            <div className="flex items-center" style={{ gap: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    background: "#00B67A",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  <StarIcon width={14} height={14} />
                </span>
              ))}
            </div>
            <span
              style={{
                fontSize: 13,
                color: "oklch(0.442 0.017 285.786)",
                fontWeight: 500,
              }}
            >
              Excellent · 7 000+ avis
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
