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
    href: "/articles/strategie-vs-execution",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop&q=80",
    alt: "Stratégie vs exécution",
    time: "5 min",
    category: "Mindset",
    title: "Pourquoi ta stratégie n'est pas ton problème",
  },
  {
    href: "/articles/journal-de-trading",
    image: "https://images.unsplash.com/photo-1770681381576-f1fdceb2ea01?w=800&h=500&fit=crop&q=80",
    alt: "Journal de trading",
    time: "6 min",
    category: "Méthode",
    title: "Journal de trading : pourquoi 95% des traders le font mal",
  },
  {
    href: "/articles/biais-cognitifs-trading",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop&q=80",
    alt: "Biais cognitifs",
    time: "5 min",
    category: "Psychologie",
    title: "Les 3 biais qui détruisent les traders disciplinés",
  },
  {
    href: "/articles/constance-et-marches",
    image: "https://images.unsplash.com/photo-1639754390580-2e7437267698?w=800&h=500&fit=crop&q=80",
    alt: "Constance trading",
    time: "4 min",
    category: "Mindset",
    title: "Constance : ce que les marchés t'apprennent vraiment",
  },
  {
    href: "/articles/checklist-pre-trade",
    image: "https://images.unsplash.com/photo-1621264448270-9ef00e88a935?w=800&h=500&fit=crop&q=80",
    alt: "Checklist pré-trade",
    time: "5 min",
    category: "Méthode",
    title: "La checklist pré-trade : l'outil que les pros utilisent",
  },
  {
    href: "/articles/gerer-ses-emotions-en-trading",
    image: "https://images.unsplash.com/photo-1645226880663-81561dcab0ae?w=800&h=500&fit=crop&q=80",
    alt: "Émotions en trading",
    time: "5 min",
    category: "Psychologie",
    title: "Gérer ses émotions : arrête de chercher le contrôle, cherche le cadre",
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
