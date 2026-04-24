import { useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, StarIcon } from "./icons";

const WORDS = ["Trading", "Bourse", "Crypto"] as const;
const VISUALS = [
  { key: "trading", src: "/images/hero/hero-tpln-1.png", type: "img" },
  { key: "stocks", src: "/images/hero/hero-tpln-2.png", type: "img" },
  { key: "crypto", src: "/images/hero/hero-tpln-3.png", type: "img" },
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
      {/* Floating finance icons */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ zIndex: 0, pointerEvents: "none" }}>
        <style>{`
          @keyframes floatA { 0%,100%{transform:translateY(0px) rotate(-8deg)} 50%{transform:translateY(-18px) rotate(-8deg)} }
          @keyframes floatB { 0%,100%{transform:translateY(0px) rotate(6deg)} 50%{transform:translateY(-14px) rotate(6deg)} }
          @keyframes floatC { 0%,100%{transform:translateY(0px) rotate(12deg)} 50%{transform:translateY(-22px) rotate(12deg)} }
          @keyframes floatD { 0%,100%{transform:translateY(0px) rotate(-4deg)} 50%{transform:translateY(-16px) rotate(-4deg)} }
          @keyframes floatE { 0%,100%{transform:translateY(0px) rotate(9deg)} 50%{transform:translateY(-12px) rotate(9deg)} }
        `}</style>
        {/* Bitcoin - left */}
        <div style={{ position:"absolute", left:"3%", top:"18%", width:72, height:72, opacity:0.13, animation:"floatA 5s ease-in-out infinite" }}>
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#F7931A"/><path d="M44.5 27.7c.6-4-2.5-6.2-6.7-7.6l1.4-5.5-3.3-.8-1.3 5.3-2.7-.7 1.3-5.3-3.3-.8-1.4 5.5-2.1-.5-4.5-1.1-.9 3.6s2.4.6 2.4.6c1.3.3 1.5 1.2 1.5 1.9l-1.5 6.1c.1 0 .2.1.4.1-.1 0-.3-.1-.4-.1l-2.1 8.5c-.2.4-.6 1.1-1.6.8 0 .1-2.4-.6-2.4-.6l-1.7 3.8 4.3 1.1 2.3.6-1.4 5.6 3.3.8 1.4-5.5 2.7.7-1.4 5.5 3.3.8 1.4-5.5c5.6 1.1 9.8.6 11.6-4.4 1.4-4-.1-6.4-3-7.9 2.2-.5 3.8-1.9 4.2-4.8zm-7.5 10.5c-1 4-7.7 1.8-9.9 1.3l1.8-7c2.2.5 9.2 1.6 8.1 5.7zm1-10.6c-.9 3.6-6.5 1.8-8.3 1.3l1.6-6.4c1.8.5 7.7 1.3 6.7 5.1z" fill="#fff"/></svg>
        </div>
        {/* Ethereum - right top */}
        <div style={{ position:"absolute", right:"5%", top:"12%", width:60, height:60, opacity:0.11, animation:"floatB 6.5s ease-in-out infinite" }}>
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#627EEA"/><path d="M32 10v16.5l13.9 6.2L32 10z" fill="#fff" fillOpacity=".6"/><path d="M32 10L18.1 32.7l13.9-6.2V10z" fill="#fff"/><path d="M32 44.1v9.9l14-19.4L32 44.1z" fill="#fff" fillOpacity=".6"/><path d="M32 54V44.1l-13.9-9.5L32 54z" fill="#fff"/><path d="M32 41.5l13.9-8.8L32 26.5v15z" fill="#fff" fillOpacity=".2"/><path d="M18.1 32.7L32 41.5V26.5L18.1 32.7z" fill="#fff" fillOpacity=".6"/></svg>
        </div>
        {/* Chart icon - left bottom */}
        <div style={{ position:"absolute", left:"8%", bottom:"22%", width:54, height:54, opacity:0.09, animation:"floatC 7s ease-in-out infinite 1s" }}>
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#0A9EF3"/><rect x="14" y="38" width="8" height="12" rx="2" fill="#fff"/><rect x="28" y="28" width="8" height="22" rx="2" fill="#fff" fillOpacity=".8"/><rect x="42" y="18" width="8" height="32" rx="2" fill="#fff" fillOpacity=".6"/></svg>
        </div>
        {/* Dollar coin - right bottom */}
        <div style={{ position:"absolute", right:"4%", bottom:"28%", width:64, height:64, opacity:0.10, animation:"floatD 5.5s ease-in-out infinite 0.5s" }}>
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#22C55E"/><text x="32" y="43" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#fff">$</text></svg>
        </div>
        {/* Small BTC - far right mid */}
        <div style={{ position:"absolute", right:"14%", top:"55%", width:40, height:40, opacity:0.07, animation:"floatE 8s ease-in-out infinite 2s" }}>
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="#F7931A"/><path d="M44.5 27.7c.6-4-2.5-6.2-6.7-7.6l1.4-5.5-3.3-.8-1.3 5.3-2.7-.7 1.3-5.3-3.3-.8-1.4 5.5-2.1-.5-4.5-1.1-.9 3.6s2.4.6 2.4.6c1.3.3 1.5 1.2 1.5 1.9l-1.5 6.1c.1 0 .2.1.4.1-.1 0-.3-.1-.4-.1l-2.1 8.5c-.2.4-.6 1.1-1.6.8 0 .1-2.4-.6-2.4-.6l-1.7 3.8 4.3 1.1 2.3.6-1.4 5.6 3.3.8 1.4-5.5 2.7.7-1.4 5.5 3.3.8 1.4-5.5c5.6 1.1 9.8.6 11.6-4.4 1.4-4-.1-6.4-3-7.9 2.2-.5 3.8-1.9 4.2-4.8zm-7.5 10.5c-1 4-7.7 1.8-9.9 1.3l1.8-7c2.2.5 9.2 1.6 8.1 5.7zm1-10.6c-.9 3.6-6.5 1.8-8.3 1.3l1.6-6.4c1.8.5 7.7 1.3 6.7 5.1z" fill="#fff"/></svg>
        </div>
      </div>

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
            <div
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
            </div>
          );
        })}

        {/* Vidéo TPLN en fond à droite */}
        <div
          className="absolute"
          style={{
            top: 0,
            right: -20,
            left: 540,
            bottom: 0,
            zIndex: -2,
            opacity: 0.12,
            overflow: "hidden",
            borderRadius: 16,
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src="/images/hero/hero-tpln.mov" type="video/mp4" />
          </video>
        </div>

      </div>

      {/* Hero copy - positioned absolutely over entire hero background */}
      <div
        className="flex flex-col items-center text-center"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          paddingBottom: 96,
        }}
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
            href="#trial"
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
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "oklch(0.21 0.006 285.885)",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "oklch(0.442 0.017 285.786)",
            }}
          >
            Excellent · +150 avis
          </span>
        </div>
      </div>
    </section>
  );
}
