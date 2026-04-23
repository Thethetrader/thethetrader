type Review = {
  initials: string;
  name: string;
  stars: 4 | 5;
  body: string;
};

const REVIEWS: Review[] = [
  {
    initials: "CL",
    name: "Clément",
    stars: 5,
    body:
      "Débutant en trading et ayant prit la formation Starter pour découvrir ce monde, j'ai été agréablement surpris de voir à quel point il était facile d'apprendre et de progresser. Alti Trading propose des formations de qualité dont les notions sont très bien expliquées et facile à comprendre, même pour le commun des mortels. Le petit + : vous progressez à votre rythme!",
  },
  {
    initials: "AM",
    name: "Abdraman Mbodou",
    stars: 4,
    body:
      "Le Day Trading Pro est une formation de qualité, le cours est très clair, concret et formidable. J'ai commencé le cours en ayant aucune connaissance mais actuellement j'envisage ouvrir un compte et commencer à investir. Je recommande à 100% ALTI TRADING à toute personne désirant investir en bourse.",
  },
  {
    initials: "SV",
    name: "sven",
    stars: 5,
    body:
      "J'ai adoré la formation DTP! Clair et concis, les vidéos m'ont énormément appris et ouvert au monde du trading. Je dirais qu'il manque un tout petit peu de contenu en \"réel\", c'est-à-dire où l'on voit vraiment du trading qui est fait en live mais pour le reste c'est 5/5.",
  },
  {
    initials: "FT",
    name: "Fayçal Tham",
    stars: 5,
    body:
      "Bonne expérience qui reprend tout depuis les bases. Je commence et n'ai donc pas encore de retour concret sur l'application des méthodes mais tous les éléments avancés me parlent et l'accent sur le risk management nous met en confiance.",
  },
  {
    initials: "KY",
    name: "Kylian",
    stars: 5,
    body:
      "Une formation de qualité, un apprentissage complet, voilà des mots pour résumer cette formation. La formation est excellente car elle nous permet d'apprendre à notre rythme, revenir en permanence sur les différents modules. Des questionnaires nous permettent de valider nos apprentissages. De plus, les replays permettent de voir certains cas concrets directement sur un graphique.",
  },
  {
    initials: "ER",
    name: "ERIC",
    stars: 5,
    body:
      "Cette formation est claire et synthétique. J'étais novice dans le trading et cette formation DTP m'a donné les outils pour comprendre l'analyse technique des actifs. Il manque de mon point de vue davantage d'exercices sur des exemples de trade en scalping et intraday.",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: "100%",
        padding: 24,
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.92 0.004 286.32)",
        borderRadius: 12,
      }}
    >
      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "oklch(0.967 0.001 286.375 / 0.5)",
            color: "oklch(0.141 0.005 285.823)",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.2px",
          }}
        >
          {review.initials}
        </div>
        <div className="flex flex-col" style={{ gap: 4 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: "18px",
              color: "oklch(0.141 0.005 285.823)",
            }}
          >
            {review.name}
          </div>
          <img
            src={`/images/trustpilot/${review.stars}stars.svg`}
            alt={`Noté ${review.stars} étoiles sur Trustpilot`}
            width={90}
            height={16}
            loading="lazy"
            style={{ height: 16, width: "auto", display: "block" }}
          />
        </div>
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 400,
          lineHeight: "20px",
          color: "oklch(0.141 0.005 285.823)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {review.body}
      </p>
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section
      className="reviews"
      style={{ padding: "160px 0 100px", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <div style={{ display: "grid", placeItems: "center", paddingBottom: 56 }}>
          <div
            className="inline-flex items-center"
            style={{
              gap: 8,
              padding: "8px 16px",
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.92 0.004 286.32)",
              borderRadius: 9999,
              marginBottom: 24,
              boxShadow:
                "0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.04)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "oklch(0.141 0.005 285.823)",
              }}
            >
              Excellent
            </span>
            <img
              src="/images/trustpilot/5stars.svg"
              alt="Noté 5 étoiles sur Trustpilot"
              width={90}
              height={16}
              loading="lazy"
              style={{ height: 16, width: "auto", display: "block" }}
            />
            <span
              style={{
                fontSize: 13,
                color: "oklch(0.552 0.016 285.938)",
              }}
            >
              sur Trustpilot
            </span>
          </div>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: "52.8px",
              letterSpacing: "-0.04em",
              color: "oklch(0.141 0.005 285.823)",
              textAlign: "center",
              maxWidth: 760,
              margin: 0,
            }}
          >
            Des milliers d&apos;investisseurs nous{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              adorent
            </span>
          </h2>
          <p
            style={{
              fontSize: 20,
              fontWeight: 400,
              lineHeight: "28px",
              letterSpacing: "-0.02em",
              color: "oklch(0.21 0.006 285.885)",
              textAlign: "center",
              maxWidth: 760,
              paddingTop: 24,
              margin: 0,
            }}
          >
            Comme eux, passez à l&apos;action. Rejoignez plus de 150 000 investisseurs heureux pour bâtir votre
            avenir financier.
          </p>
        </div>

        <div
          className="grid reviews-grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            height: 560,
            overflow: "hidden",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%)",
          }}
        >
          {[0, 1, 2].map((colIdx) => {
            const colReviews = [REVIEWS[colIdx], REVIEWS[colIdx + 3]];
            return (
              <div key={colIdx} style={{ overflow: "hidden" }}>
                <div className={`reviews-marquee-col reviews-marquee-col--${colIdx + 1}`}>
                  {[...colReviews, ...colReviews].map((r, i) => (
                    <ReviewCard key={`${colIdx}-${i}`} review={r} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
