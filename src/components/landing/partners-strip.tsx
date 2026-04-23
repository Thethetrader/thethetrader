type Partner = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const PARTNERS: Partner[] = [
  { src: "/images/partners/avatrade.svg", alt: "partenaire AvaTrade", width: 128, height: 20 },
  { src: "/images/partners/forbes.svg", alt: "partenaire Forbes", width: 68, height: 18 },
  { src: "/images/partners/degiro.svg", alt: "partenaire Degiro", width: 93, height: 15 },
  { src: "/images/partners/lepoint.svg", alt: "partenaire Le Point", width: 76, height: 17 },
  { src: "/images/partners/prt.svg", alt: "partenaire ProRealTime", width: 160, height: 14 },
  { src: "/images/partners/challenges.svg", alt: "partenaire Challenges", width: 111, height: 29 },
  { src: "/images/partners/xtb.svg", alt: "partenaire XTB", width: 60, height: 24 },
  { src: "/images/partners/entreprendre.svg", alt: "partenaire Entreprendre", width: 108, height: 24 },
];

function PartnersList({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex items-center shrink-0"
      style={{
        gap: 100,
        padding: "0 0 0 100px",
        listStyle: "none",
        margin: 0,
      }}
    >
      {PARTNERS.map((p) => (
        <li key={p.src} className="shrink-0">
          <img
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading="lazy"
            style={{ display: "block", width: p.width, height: p.height }}
          />
        </li>
      ))}
    </ul>
  );
}

export function PartnersStrip() {
  return (
    <section
      className="partners"
      style={{
        width: "100%",
        letterSpacing: "-0.01em",
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1080, padding: "0 20px" }}
      >
        <div
          style={{
            padding: "0 0 16px",
            margin: "0 0 24px",
            borderBottom: "1px solid oklch(0.92 0.004 286.32)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 400,
              lineHeight: "22.5px",
              color: "oklch(0.552 0.016 285.938)",
              textAlign: "center",
            }}
          >
            Ils nous font confiance.
          </div>
        </div>

        <div
          className="flex"
          style={{
            overflow: "hidden",
            height: 29,
            width: "100%",
          }}
        >
          <div
            className="flex shrink-0"
            style={{
              animation: "partners-marquee 20s linear infinite",
              width: "max-content",
            }}
          >
            <PartnersList />
            <PartnersList ariaHidden />
          </div>
        </div>
      </div>
    </section>
  );
}
