import {
  AltiLogo,
  AppleIcon,
  FacebookIcon,
  GooglePlayIcon,
  InstagramIcon,
  LinkedinIcon,
  PodcastIcon,
  TiktokIcon,
  YoutubeIcon,
} from "./icons";

type FooterLink = { text: string; href: string; badge?: string };
type FooterGroup = { title: string; links: FooterLink[] };

const GROUPS: FooterGroup[] = [
  {
    title: "Nos formations",
    links: [{ text: "Consulter toutes les formations", href: "/nos-formations/" }],
  },
  {
    title: "Financements & CPF",
    links: [
      { text: "Voir les financements disponibles", href: "/financements/" },
      { text: "Offre éducation", href: "/education/" },
    ],
  },
  {
    title: "Aide et support",
    links: [
      { text: "Contacter un conseiller", href: "/reserver/" },
      { text: "Questions fréquentes", href: "/faq/" },
      { text: "Handicap", href: "/handicap/" },
    ],
  },
  {
    title: "Infos et actus",
    links: [
      { text: "Blog", href: "/articles/" },
      { text: "Guides", href: "/guides/" },
      { text: "Lexique", href: "/lexique/" },
      { text: "Podcasts", href: "https://www.podcastics.com/podcast/speaking-trading/" },
      { text: "Livre", href: "/livre-gagner-argent-marches-financiers/" },
    ],
  },
  {
    title: "Avis",
    links: [{ text: "Voir les avis des membres", href: "/avis/" }],
  },
  {
    title: "Contenus gratuits",
    links: [
      { text: "Formation offerte", href: "/formation-gratuite/" },
      { text: "Livre blanc", href: "/livre-blanc/" },
      { text: "Journal de trading", href: "/journal-trading/" },
      { text: "Tableau budgétaire", href: "/modele-gestion-budgetaire/" },
      { text: "Stock Scorer", href: "/stock-scorer/", badge: "Nouveau" },
    ],
  },
  {
    title: "À propos",
    links: [
      { text: "Nous contacter", href: "/contact/" },
      { text: "Notre histoire", href: "/notre-histoire/" },
      { text: "Nos valeurs", href: "/nos-valeurs/" },
      { text: "Notre équipe", href: "/equipe/" },
      { text: "Devenir partenaire affilié", href: "/partenaires/" },
      { text: "Carrières", href: "/recrutement/" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    href: "https://www.podcastics.com/podcast/speaking-trading/",
    label: "Podcast Speaking Trading",
    Icon: PodcastIcon,
  },
  {
    href: "https://www.youtube.com/channel/UChTKRDxzQLzi3f2msu4vPtw?sub_confirmation=1",
    label: "YouTube Alti Trading",
    Icon: YoutubeIcon,
  },
  {
    href: "https://www.facebook.com/ALTI.TRADING/",
    label: "Facebook Alti Trading",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.linkedin.com/company/altitrading/mycompany/",
    label: "LinkedIn Alti Trading",
    Icon: LinkedinIcon,
  },
  {
    href: "https://www.tiktok.com/@altitrading",
    label: "TikTok Alti Trading",
    Icon: TiktokIcon,
  },
  {
    href: "https://www.instagram.com/altitrading/",
    label: "Instagram Alti Trading",
    Icon: InstagramIcon,
  },
  {
    href: "https://apps.apple.com/fr/app/alti-trading/id6446088479?platform=iphone",
    label: "Application iOS Alti Trading sur l'App Store",
    Icon: AppleIcon,
  },
  {
    href: "https://play.google.com/store/apps/details?id=com.altitrading.app&gl=FR",
    label: "Application Android Alti Trading sur Google Play",
    Icon: GooglePlayIcon,
  },
];

const LEGAL_LINKS = [
  { text: "Mentions légales", href: "/mentions-legales/" },
  {
    text: "Politique de confidentialité",
    href: "https://cdn-01.alti-trading.fr/assets/docs/Politique_de_confidentialite-ALTI_TRADING.pdf",
  },
  { text: "CGV/CGU", href: "/CGV/" },
];

function FooterBadge({ text }: { text: string }) {
  const isPopular = text === "Le plus populaire";
  const isCPF = text === "Éligible CPF";
  const bg = isPopular
    ? "linear-gradient(90deg, rgba(10, 171, 240, 0.12), rgba(143, 102, 255, 0.12), rgba(231, 46, 235, 0.12))"
    : isCPF
      ? "oklch(0.967 0.001 286.375)"
      : "oklch(0.967 0.001 286.375)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        marginLeft: 8,
        padding: "2px 6px",
        fontSize: 11,
        fontWeight: 500,
        lineHeight: "16px",
        color: "oklch(0.141 0.005 285.823)",
        background: bg,
        border: "1px solid oklch(0.92 0.004 286.32)",
        borderRadius: 9999,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function FooterColumn({ group }: { group: FooterGroup }) {
  return (
    <div className="flex flex-col" style={{ flex: "1 1 0", minWidth: 140 }}>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "20px",
          color: "oklch(0.21 0.006 285.885)",
          margin: 0,
          paddingBottom: 16,
        }}
      >
        {group.title}
      </h3>
      <ul
        className="flex flex-col"
        style={{
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {group.links.map((link) => (
          <li key={link.href + link.text}>
            <a
              href={link.href}
              className="inline-flex items-center"
              style={{
                fontSize: 14,
                fontWeight: 400,
                lineHeight: "20px",
                color: "oklch(0.442 0.017 285.786)",
                textDecoration: "none",
              }}
            >
              {link.text}
              {link.badge ? <FooterBadge text={link.badge} /> : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="site-footer"
      className="site-footer"
      style={{
        padding: "80px 0",
        background: "oklch(0.967 0.001 286.375 / 0.5)",
        color: "oklch(0.442 0.017 285.786)",
        letterSpacing: "-0.01em",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <div
          className="footer-top flex items-center justify-between"
          style={{
            padding: "0 0 24px",
            margin: "0 0 24px",
            borderBottom: "1px solid oklch(0.92 0.004 286.32)",
          }}
        >
          <a href="/" aria-label="Alti Trading — Accueil" style={{ color: "oklch(0.141 0.005 285.823)" }}>
            <AltiLogo width={146} height={20} />
          </a>
          <a
            href="/reserver/"
            className="inline-flex items-center"
            style={{
              height: 32,
              padding: "0 10px",
              fontSize: 13,
              fontWeight: 500,
              color: "oklch(0.141 0.005 285.823)",
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.92 0.004 286.32)",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Essayer Gratuitement
          </a>
        </div>

        <nav
          className="footer-nav"
          style={{ padding: "0 0 16px" }}
          aria-label="Liens du pied de page"
        >
          <div
            className="grid footer-links-grid"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 24,
              paddingBottom: 32,
            }}
          >
            {GROUPS.slice(0, 5).map((g) => (
              <FooterColumn key={g.title} group={g} />
            ))}
          </div>
          <div
            className="grid footer-links-grid"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 24,
            }}
          >
            {GROUPS.slice(5).map((g) => (
              <FooterColumn key={g.title} group={g} />
            ))}
          </div>
        </nav>

        <div
          className="footer-share flex items-start justify-between"
          style={{
            padding: "24px 0",
            gap: 24,
            borderTop: "1px solid oklch(0.92 0.004 286.32)",
            borderBottom: "1px solid oklch(0.92 0.004 286.32)",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "20px",
              color: "oklch(0.21 0.006 285.885)",
              margin: 0,
              maxWidth: 420,
            }}
          >
            Rejoignez la plus grande communauté d&apos;investisseurs et traders francophones.
          </p>
          <ul
            className="flex items-center"
            style={{
              gap: 12,
              margin: 0,
              padding: 0,
              listStyle: "none",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9999,
                    border: "1px solid oklch(0.92 0.004 286.32)",
                    background: "oklch(1 0 0)",
                    color: "oklch(0.21 0.006 285.885)",
                  }}
                >
                  <Icon width={18} height={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="footer-bottom flex items-center justify-between flex-wrap"
          style={{
            padding: "24px 0 0",
            gap: 16,
            fontSize: 13,
            color: "oklch(0.552 0.016 285.938)",
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} TPLN — Tous droits réservés.
          </p>
          <ul
            className="flex items-center flex-wrap"
            style={{ gap: 20, margin: 0, padding: 0, listStyle: "none" }}
          >
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{
                    fontSize: 13,
                    color: "oklch(0.552 0.016 285.938)",
                    textDecoration: "none",
                  }}
                >
                  {l.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
