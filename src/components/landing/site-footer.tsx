import { InstagramIcon, TiktokIcon } from "./icons";

const NAV_GROUPS = [
  {
    title: "Formations",
    links: [
      { text: "Services", href: "#services" },
      { text: "La plateforme", href: "#section-app" },
      { text: "Prix", href: "#pricing" },
    ],
  },
  {
    title: "Accompagnement",
    links: [
      { text: "Session 1:1", href: "#pricing" },
      { text: "Réserver une session", href: "#" },
    ],
  },
  {
    title: "À propos",
    links: [
      { text: "TheTheTrader", href: "#about-thethetrader" },
      { text: "Contact", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: "#", label: "Instagram TPLN", Icon: InstagramIcon },
  { href: "#", label: "TikTok TPLN", Icon: TiktokIcon },
];

const LEGAL_LINKS = [
  { text: "Mentions légales", href: "/mentions-legales/" },
  { text: "Politique de confidentialité", href: "/confidentialite/" },
  { text: "CGV", href: "/CGV/" },
];

export function SiteFooter() {
  return (
    <footer
      id="site-footer"
      className="site-footer"
      style={{
        padding: "64px 0 32px",
        background: "oklch(0.967 0.001 286.375 / 0.5)",
        borderTop: "1px solid oklch(0.92 0.004 286.32)",
        letterSpacing: "-0.01em",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1080, padding: "0 20px" }}>

        {/* Top row: logo + tagline + social */}
        <div
          className="footer-top flex items-start justify-between"
          style={{ paddingBottom: 48, gap: 40 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href="/" aria-label="TPLN — Accueil">
              <img src="/TPLNFAVICONFINAL.png" alt="TPLN" width={40} height={40} style={{ display: "block" }} />
            </a>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: "20px",
                color: "oklch(0.55 0.01 286)",
                maxWidth: 240,
              }}
            >
              La méthode pour trader avec structure, constance et précision.
            </p>
          </div>

          {/* Nav columns */}
          <nav aria-label="Liens du pied de page" style={{ display: "flex", gap: 64 }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "oklch(0.21 0.006 285.885)",
                  }}
                >
                  {group.title}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.links.map((link) => (
                    <li key={link.text}>
                      <a
                        href={link.href}
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          color: "oklch(0.55 0.01 286)",
                          textDecoration: "none",
                        }}
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          className="footer-bottom flex items-center justify-between flex-wrap"
          style={{
            paddingTop: 24,
            borderTop: "1px solid oklch(0.92 0.004 286.32)",
            gap: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "oklch(0.55 0.01 286)" }}>
            © {new Date().getFullYear()} TPLN — Tous droits réservés.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Social */}
            <div style={{ display: "flex", gap: 8 }}>
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    border: "1px solid oklch(0.92 0.004 286.32)",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "oklch(0.21 0.006 285.885)",
                  }}
                >
                  <Icon width={15} height={15} />
                </a>
              ))}
            </div>

            {/* Legal */}
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", gap: 16 }}>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    style={{ fontSize: 13, color: "oklch(0.55 0.01 286)", textDecoration: "none" }}
                  >
                    {l.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </footer>
  );
}
