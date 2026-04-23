import { useEffect, useRef, useState } from "react";

type Stat = { value: number; label: string };

const STATS: Stat[] = [
  { value: 89.9, label: "des apprenants accomplissent intégralement leur formation." },
  { value: 98.5, label: "des apprenants affirment que la pédagogie proposée est adaptée." },
  { value: 94.9, label: "des apprenants affirment être autonomes pour investir à l'issue de leur formation." },
  {
    value: 95.1,
    label: "des apprenants affirment avoir atteint les objectifs et compétences visées à l'issue de leur formation.",
  },
  { value: 98.4, label: "des apprenants recommandent les formations ALTI TRADING." },
];

function AnimatedNumber({ value, play }: { value: number; play: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!play) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, play]);
  return <>{display.toFixed(1).replace(".", ",")}%</>;
}

function StatItem({ stat, play }: { stat: Stat; play: boolean }) {
  return (
    <li
      className="flex flex-col items-center text-center"
      style={{ flex: "1 1 0", padding: "0 16px" }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 600,
          lineHeight: "64px",
          letterSpacing: "-0.04em",
          color: "oklch(0.141 0.005 285.823)",
          backgroundImage:
            "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          paddingBottom: 16,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <AnimatedNumber value={stat.value} play={play} />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 400,
          lineHeight: "21px",
          letterSpacing: "-0.01em",
          color: "oklch(0.21 0.006 285.885)",
          margin: 0,
          maxWidth: 240,
        }}
      >
        {stat.label}
      </p>
    </li>
  );
}

function QualiopiLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={152}
      height={82}
      fill="none"
      viewBox="0 0 152 82"
      aria-label="Logo Qualiopi République Française"
    >
      <path fill="#fff" d="M0 0h152v82H0z" />
      <path
        fill="#000091"
        d="M18.12 41.234h.82v.55a2.321 2.321 0 0 1 1.75-.74 2.66 2.66 0 0 1 0 5.3 2.31 2.31 0 0 1-1.75-.74v2.95h-.82v-7.32Zm2.47 4.33a1.88 1.88 0 0 0 0-3.74 1.9 1.9 0 0 0-1.65.93v1.88a1.9 1.9 0 0 0 1.65.93Zm4.08-4.33h.83v.62a1.802 1.802 0 0 1 1.85-.66v.86a1.772 1.772 0 0 0-.48-.07 1.52 1.52 0 0 0-1.37.83v3.34h-.83v-4.92Zm8.65 2.46a2.66 2.66 0 1 1-2.66-2.65 2.602 2.602 0 0 1 2.66 2.65Zm-.88 0a1.8 1.8 0 1 0-3.595-.183 1.8 1.8 0 0 0 3.594.183Zm6.04 1.14.66.5a2.5 2.5 0 0 1-2.06 1.01 2.65 2.65 0 1 1 0-5.3 2.54 2.54 0 0 1 2.06 1l-.66.5a1.68 1.68 0 0 0-1.4-.72 1.87 1.87 0 0 0 .01 3.74 1.658 1.658 0 0 0 1.4-.73h-.01Zm3.99 1.51a2.579 2.579 0 0 1-2.68-2.65 2.462 2.462 0 0 1 2.48-2.65 2.07 2.07 0 0 1 2.2 2.13c0 .18-.02.36-.06.53h-3.76v.02a1.78 1.78 0 0 0 1.84 1.87 1.8 1.8 0 0 0 1.47-.72l.62.48a2.55 2.55 0 0 1-2.1 1l-.01-.01Zm-1.75-3.3h2.91a1.309 1.309 0 0 0-1.35-1.3 1.51 1.51 0 0 0-1.56 1.3Zm5.3 1.93a1.58 1.58 0 0 0 1.56.65.77.77 0 0 0 .54-.73c0-1.11-2.4-.7-2.4-2.46a1.442 1.442 0 0 1 1.57-1.39 2.03 2.03 0 0 1 1.67.81l-.58.5a1.3 1.3 0 0 0-1.08-.61c-.5 0-.78.27-.78.67 0 1.12 2.41.73 2.41 2.45a1.53 1.53 0 0 1-1.66 1.49 2.27 2.27 0 0 1-1.84-.88l.59-.5Zm4.39 0a1.58 1.58 0 0 0 1.57.65.77.77 0 0 0 .54-.73c0-1.11-2.4-.7-2.4-2.46a1.44 1.44 0 0 1 1.57-1.39 2.03 2.03 0 0 1 1.67.81l-.58.5a1.29 1.29 0 0 0-1.08-.61c-.5 0-.78.27-.78.67 0 1.12 2.41.73 2.41 2.45a1.53 1.53 0 0 1-1.66 1.49 2.27 2.27 0 0 1-1.84-.87l.58-.51Zm7.8-3.74h.84v2.78a2.18 2.18 0 1 1-4.36 0v-2.78h.83v2.81c0 .97.51 1.52 1.35 1.52.82 0 1.34-.55 1.34-1.52V41.234Zm2.63 3.74a1.58 1.58 0 0 0 1.57.65.77.77 0 0 0 .54-.73c0-1.11-2.41-.7-2.41-2.46a1.44 1.44 0 0 1 1.58-1.39 2.03 2.03 0 0 1 1.67.81l-.58.5a1.29 1.29 0 0 0-1.08-.61c-.5 0-.78.27-.78.67 0 1.12 2.4.73 2.4 2.45a1.53 1.53 0 0 1-1.65 1.49 2.27 2.27 0 0 1-1.84-.88l.58-.5Zm10.79-.14.66.5a2.5 2.5 0 0 1-2.07 1.01 2.65 2.65 0 1 1 0-5.3 2.54 2.54 0 0 1 2.07 1l-.66.5a1.67 1.67 0 0 0-1.4-.72 1.87 1.87 0 0 0 0 3.74 1.658 1.658 0 0 0 1.4-.73Zm3.99 1.51a2.579 2.579 0 0 1-2.68-2.65 2.462 2.462 0 0 1 2.48-2.65 2.07 2.07 0 0 1 2.2 2.13c0 .18-.03.36-.06.53H73.8v.02a1.78 1.78 0 0 0 1.84 1.87 1.799 1.799 0 0 0 1.47-.73l.62.48a2.549 2.549 0 0 1-2.11 1Zm-1.76-3.3h2.92a1.3 1.3 0 0 0-1.36-1.3 1.51 1.51 0 0 0-1.56 1.3Zm5.28-1.81h.83v.62a1.802 1.802 0 0 1 1.85-.66v.86a1.772 1.772 0 0 0-.48-.07 1.52 1.52 0 0 0-1.37.83v3.34h-.83v-4.92Zm4.5.76h-.93v-.76h.93v-1.23h.84v1.23h1.7v.76h-1.7v2.5c0 .78.39 1 .98 1 .25 0 .5-.04.73-.12v.74c-.27.1-.56.15-.84.13a1.529 1.529 0 0 1-1.71-1.74v-2.51Zm3.76-2.62a.59.59 0 0 1 1-.4.58.58 0 1 1-.82.81.59.59 0 0 1-.18-.41Zm.17 1.86h.83v4.92h-.83v-4.92Zm2.99 0v-.6a1.68 1.68 0 0 1 1.74-1.8c.47 0 .93.17 1.27.49l-.51.6a.94.94 0 0 0-.75-.33.92.92 0 0 0-.91 1.02v.62h1.7v.76h-1.7v4.16h-.84v-4.16h-.93v-.76h.93Zm3.5-1.86a.58.58 0 0 1 1-.4.58.58 0 1 1-.82.81.59.59 0 0 1-.17-.41h-.01Zm.17 1.86h.83v4.92h-.83v-4.92Zm4.97 5.11a2.578 2.578 0 0 1-2.69-2.65 2.46 2.46 0 0 1 2.48-2.65 2.07 2.07 0 0 1 2.199 2.13c0 .18-.02.36-.06.53h-3.76v.02a1.78 1.78 0 0 0 1.85 1.87 1.797 1.797 0 0 0 1.47-.73l.61.48a2.553 2.553 0 0 1-2.1 1Zm-1.76-3.3h2.919a1.316 1.316 0 0 0-.405-.938 1.311 1.311 0 0 0-.955-.362 1.51 1.51 0 0 0-1.56 1.3Zm1.18-2.6 1.02-1.61h.929l-1.14 1.62h-.8l-.01-.01Z"
      />
      <path fill="#E1000F" d="M106.369 31.505h15.15l-15.15 15.46v-15.47.01Z" />
      <path fill="#000091" d="m106.369 31.494 15.16.01-15.16-15.4v15.4-.01Z" />
      <path fill="#000091" d="M121.52 31.505h15.15l-15.16 15.46v-15.47l.01.01Z" />
      <path fill="#E1000F" d="m121.52 31.494 15.15.01-15.16-15.4v15.4l.01-.01Z" />
    </svg>
  );
}

export function QualiopiStatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPlay(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="qualiopi-stats"
      style={{ padding: "128px 0 96px", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <ul
          className="flex justify-between items-start"
          style={{ gap: 8, margin: 0, padding: 0, listStyle: "none" }}
        >
          {STATS.map((s, i) => (
            <StatItem key={i} stat={s} play={play} />
          ))}
        </ul>
        <p
          style={{
            fontSize: 13,
            fontWeight: 400,
            lineHeight: "18px",
            color: "oklch(0.552 0.016 285.938)",
            textAlign: "center",
            marginTop: 64,
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          À l&apos;issue de nos formations, nous récoltons les avis de nos membres. Ces statistiques
          correspondent à l&apos;année 2025, toutes formations confondues.
        </p>
      </div>
    </section>
  );
}

export function QualiopiPerksSection() {
  return (
    <section
      className="qualiopi-perks"
      style={{ padding: "40px 0 80px", letterSpacing: "-0.01em" }}
    >
      <div
        className="mx-auto flex items-center"
        style={{
          maxWidth: 1000,
          padding: "24px 40px",
          gap: 32,
          border: "1px solid oklch(0.92 0.004 286.32)",
          borderRadius: 16,
          background: "oklch(1 0 0)",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div className="flex flex-col" style={{ flex: "1 1 auto", gap: 8 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 500,
              lineHeight: "24px",
              color: "oklch(0.141 0.005 285.823)",
            }}
          >
            Tous nos parcours d&apos;apprentissage sont certifiés Qualiopi, gage de la qualité et du
            professionnalisme de nos actions de formation.
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 400,
              lineHeight: "18px",
              color: "oklch(0.552 0.016 285.938)",
            }}
          >
            Certification délivrée au titre de la catégorie d&apos;action suivante : Actions de formation
          </div>
        </div>
        <div style={{ flex: "0 0 152px" }}>
          <QualiopiLogo />
        </div>
      </div>
    </section>
  );
}
