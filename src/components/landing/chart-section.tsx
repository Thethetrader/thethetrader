import { useEffect, useRef } from "react";

const POINTS = [
  0, 2, 1.5, 4, 3, 6, 5, 8, 7, 10, 9, 13, 11, 15, 14, 18, 16, 20, 19, 23,
  22, 26, 24, 28, 27, 31, 30, 34, 32, 36, 35, 39, 37, 41, 40, 44, 43, 47, 45, 50,
  49, 53, 51, 56, 54, 58, 57, 61, 59, 63, 62, 66, 64, 68, 67, 70, 69, 72, 71, 74,
  73, 77, 75, 80, 78, 83, 81, 86, 84, 89, 87, 91, 90, 93, 92, 95, 94, 97, 96, 100,
];

const W = 900;
const H = 260;
const PAD_L = 48;
const PAD_R = 24;
const PAD_T = 24;
const PAD_B = 40;

function toX(i: number) {
  return PAD_L + (i / (POINTS.length - 1)) * (W - PAD_L - PAD_R);
}
function toY(v: number) {
  return PAD_T + (1 - v / 100) * (H - PAD_T - PAD_B);
}

const linePath = POINTS.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(v).toFixed(2)}`).join(" ");
const areaPath = `${linePath} L${toX(POINTS.length - 1).toFixed(2)},${(H - PAD_B).toFixed(2)} L${toX(0).toFixed(2)},${(H - PAD_B).toFixed(2)} Z`;

const STATS = [
  { label: "Gain moyen / trade", value: "+2.4%" },
  { label: "Win rate", value: "67%" },
  { label: "Trades analysés", value: "1 200+" },
  { label: "Ratio Risk/Reward", value: "1 : 2.8" },
];

export function ChartSection() {
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        line.style.transition = "stroke-dashoffset 2.4s cubic-bezier(0.4,0,0.2,1)";
        line.style.strokeDashoffset = "0";
        if (areaRef.current) {
          areaRef.current.style.opacity = "1";
          areaRef.current.style.transition = "opacity 2.4s ease";
        }
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(line);
    return () => observer.disconnect();
  }, []);

  const gridYs = [0, 25, 50, 75, 100];

  return (
    <section
      style={{
        background: "oklch(0.13 0.01 260)",
        padding: "64px 0",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 9999,
              background: "rgba(10,171,240,0.12)",
              border: "1px solid rgba(10,171,240,0.25)",
              color: "rgb(10,171,240)",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgb(10,171,240)", display: "block" }} />
            Performance réelle
          </span>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              lineHeight: "1.15",
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            Une méthode qui{" "}
            <span style={{ color: "rgb(74,222,128)" }}>performe</span>
          </h2>
          <p style={{ marginTop: 12, fontSize: 16, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
            Résultats issus du journal TPLN — suivi en temps réel
          </p>
        </div>

        {/* Chart */}
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "24px 8px 8px",
            marginBottom: 40,
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="auto"
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(74,222,128)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(74,222,128)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridYs.map((v) => (
              <g key={v}>
                <line
                  x1={PAD_L}
                  y1={toY(v)}
                  x2={W - PAD_R}
                  y2={toY(v)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 8}
                  y={toY(v) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgba(255,255,255,0.3)"
                >
                  {v}%
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path
              ref={areaRef}
              d={areaPath}
              fill="url(#areaGrad)"
              style={{ opacity: 0 }}
            />

            {/* Line */}
            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke="rgb(74,222,128)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* End dot */}
            <circle
              cx={toX(POINTS.length - 1)}
              cy={toY(100)}
              r="5"
              fill="rgb(74,222,128)"
            />
            <circle
              cx={toX(POINTS.length - 1)}
              cy={toY(100)}
              r="9"
              fill="rgb(74,222,128)"
              opacity="0.2"
            />

            {/* End label */}
            <rect
              x={toX(POINTS.length - 1) - 42}
              y={toY(100) - 28}
              width={60}
              height={22}
              rx="6"
              fill="rgb(74,222,128)"
            />
            <text
              x={toX(POINTS.length - 1) - 12}
              y={toY(100) - 12}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#000"
            >
              +100%
            </text>
          </svg>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {STATS.map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "20px 24px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
                {value}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
