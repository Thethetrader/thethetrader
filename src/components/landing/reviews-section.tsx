import { useState } from "react";

type Review = {
  initials: string;
  name: string;
  stars: 4 | 5;
  body: string;
};

const REVIEWS: Review[] = [
  {
    initials: "TM",
    name: "Thomas M.",
    stars: 5,
    body:
      "L'Environnement Complet TPLN a tout changé pour moi. Suivre les sessions live 5j/semaine et voir chaque opportunité expliquée en temps réel, ça n'a rien à voir avec une formation classique. En 6 semaines j'ai enfin une routine de trading structurée. Les notifications via l'app sont ultra pratiques.",
  },
  {
    initials: "SB",
    name: "Sarah B.",
    stars: 5,
    body:
      "J'avais essayé plusieurs formations avant TPLN. Aucune ne montrait l'exécution réelle. Ici, chaque trade est expliqué en direct, avec le raisonnement derrière. Le journal multi-comptes est un vrai outil pro. Et l'accès direct au fondateur fait vraiment la différence — les réponses sont rapides et concrètes.",
  },
  {
    initials: "KD",
    name: "Kevin D.",
    stars: 5,
    body:
      "J'ai commencé par la formule Méthode TPLN à 49€/mois pour apprendre à mon rythme. La structure est claire, le risk management est bien expliqué et j'ai rapidement compris comment construire une exécution disciplinée. Exactement ce qu'il me fallait avant de passer aux lives.",
  },
  {
    initials: "ML",
    name: "Marie L.",
    stars: 4,
    body:
      "La méthode TPLN m'a donné un cadre que je n'avais jamais eu. Avant j'ouvrais des positions au feeling. Maintenant j'ai des règles claires, une gestion du risque précise et je sais quoi chercher sur le graphique. Le journal inclus m'a permis de suivre mes progrès dès le premier mois.",
  },
  {
    initials: "RN",
    name: "Romain N.",
    stars: 5,
    body:
      "Le Journal Pro à 29€/mois est un outil indispensable. Je gère 3 comptes différents et la comparaison des performances m'a permis d'identifier exactement où je perdais de l'argent. L'analyse avancée est vraiment au niveau professionnel. Rapport qualité/prix imbattable.",
  },
  {
    initials: "AC",
    name: "Alexia C.",
    stars: 5,
    body:
      "Grâce au Journal Pro TPLN j'ai arrêté de me mentir sur mes résultats. Les données sont là, claires, sans filtre. Comptes illimités, analyse poussée — en 2 mois j'ai identifié mes patterns perdants et commencé à vraiment progresser. Je recommande à tous les traders qui veulent se voir évoluer.",
  },
];

function ReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: "50%",
            border: "1px solid oklch(0.92 0.004 286.32)",
            background: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "oklch(0.552 0.016 285.938)",
          }}
        >×</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "oklch(0.967 0.001 286.375 / 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 600, color: "oklch(0.141 0.005 285.823)",
          }}>
            {review.initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>{review.name}</div>
            <img src={`/images/trustpilot/${review.stars}stars.svg`} alt={`${review.stars} étoiles`} style={{ height: 16, width: "auto" }} />
          </div>
        </div>
        <p style={{ fontSize: 15, lineHeight: "22px", color: "oklch(0.141 0.005 285.823)", margin: 0 }}>
          {review.body}
        </p>
      </div>
    </div>
  );
}

function ReviewCard({ review, onOpen }: { review: Review; onOpen: () => void }) {
  return (
    <div
      className="flex flex-col"
      onClick={onOpen}
      style={{
        width: "100%",
        padding: 24,
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.92 0.004 286.32)",
        borderRadius: 12,
        cursor: "pointer",
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
  const [selected, setSelected] = useState<Review | null>(null);
  return (
    <>
    {selected && <ReviewModal review={selected} onClose={() => setSelected(null)} />}
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
            150 traders formés nous font{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              confiance
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
            Comme eux, rejoins la communauté TPLN et commence à trader avec méthode, structure et discipline.
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
                    <ReviewCard key={`${colIdx}-${i}`} review={r} onOpen={() => setSelected(r)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
