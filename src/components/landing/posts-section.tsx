type Post = {
  href: string;
  image: string;
  alt: string;
  time: string;
  category: string;
  title: string;
};

const POSTS: Post[] = [
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-trading/bandes-de-bollinger-strategie-pour-utiliser-cet-indicateur",
    image: "/images/posts/businessman.webp",
    alt: "Bandes de Bollinger",
    time: "12 min",
    category: "Trading",
    title: "Bandes de Bollinger : Stratégie pour utiliser cet indicateur",
  },
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-trading/les-femmes-qui-dominent-la-finance-et-le-trading",
    image: "/images/posts/femmes-en-finance.webp",
    alt: "Femmes en finance",
    time: "10 min",
    category: "Trading",
    title: "Les femmes qui dominent la finance et le trading",
  },
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-general/comment-investir-2000e-en-2026",
    image: "/images/posts/debuter-investissement.webp",
    alt: "Débuter investissement",
    time: "9 min",
    category: "Investissement",
    title: "Comment investir 2000\u20AC en 2026 ?",
  },
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-trading/comment-trader-le-petrole",
    image: "/images/posts/petrole.webp",
    alt: "Pétrole",
    time: "12 min",
    category: "Trading",
    title: "Comment trader le pétrole et exploiter ses opportunités ?",
  },
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-general/livret-a-en-2026-plafond-taux-et-strategies-depargne-gagnantes",
    image: "/images/posts/livret-a.webp",
    alt: "Livret A",
    time: "10 min",
    category: "Investissement",
    title: "Livret A en 2026 : plafond, taux et stratégies d'\u00E9pargne gagnantes",
  },
  {
    href: "https://www.alti-trading.fr/guides/formation-investissement-marches-financiers/comprendre-lanalyse-intermarket-la-boussole-macroeconomique",
    image: "/images/posts/compass-and-chess.webp",
    alt: "Analyse intermarket",
    time: "12 min",
    category: "Marchés financiers",
    title: "Comprendre l'analyse intermarket : la boussole macroéconomique",
  },
];

function PostCard({ post }: { post: Post }) {
  return (
    <a
      href={post.href}
      className="post-card flex flex-col overflow-hidden"
      style={{
        width: "100%",
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.92 0.004 286.32)",
        borderRadius: 16,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className="post-card__thumb"
        style={{ position: "relative", aspectRatio: "400 / 250", overflow: "hidden" }}
      >
        <img
          src={post.image}
          alt={post.alt}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div className="flex flex-col" style={{ padding: 20, gap: 12 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "oklch(0.552 0.016 285.938)",
            }}
          >
            {post.time}
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "oklch(0.552 0.016 285.938)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "oklch(0.552 0.016 285.938)",
            }}
          >
            {post.category}
          </span>
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            lineHeight: "24px",
            letterSpacing: "-0.02em",
            color: "oklch(0.141 0.005 285.823)",
            margin: 0,
          }}
        >
          {post.title}
        </h3>
        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            fontWeight: 500,
            color: "oklch(0.21 0.006 285.885)",
          }}
        >
          Consulter le guide →
        </div>
      </div>
    </a>
  );
}

export function PostsSection() {
  return (
    <section
      className="posts"
      style={{ padding: "80px 0", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <div className="flex flex-col" style={{ paddingBottom: 40, gap: 8 }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 600,
              lineHeight: "40px",
              letterSpacing: "-0.03em",
              color: "oklch(0.141 0.005 285.823)",
              margin: 0,
            }}
          >
            Consultez nos guides d&apos;investissement
          </h2>
          <p
            style={{
              fontSize: 17,
              fontWeight: 400,
              lineHeight: "24px",
              color: "oklch(0.21 0.006 285.885)",
              margin: 0,
            }}
          >
            Votre dose de lecture pour apprendre à bien investir en bourse, trading & crypto.
          </p>
        </div>
        <div
          className="grid posts-grid"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          {POSTS.map((p) => (
            <PostCard key={p.href} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
