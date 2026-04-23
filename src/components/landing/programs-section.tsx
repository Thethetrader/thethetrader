import { redirectToCheckout } from "../../utils/stripe";
import type { PlanType } from "../../config/subscription-plans";

type Feature = { text: string; included: boolean };

type Plan = {
  slug: string;
  name: string;
  subtitle?: string;
  price: string;
  period: string;
  badges: { label: string; variant: "outline" | "important" }[];
  features: Feature[];
  cta: string;
  planType: PlanType;
  highlighted?: boolean;
  tileBg: string;
  tileShadow: string;
};

const WHITE_TOP =
  "radial-gradient(66% 66% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)";

const PLANS: Plan[] = [
  {
    slug: "ip",
    name: "L'ENVIRONNEMENT COMPLET TPLN",
    subtitle: "Méthode + Exécution + Transparence totale",
    price: "\u20AC79",
    period: "/ mois",
    badges: [{ label: "Recommandé", variant: "important" }],
    features: [
      { text: "Accès intégral à la méthode TPLN", included: true },
      { text: "Exécution live 5j / semaine", included: true },
      { text: "Opportunités validées et expliquées en direct", included: true },
      { text: "Notification immédiate via l'app", included: true },
      { text: "Journal professionnel multi-comptes", included: true },
      { text: "Accès direct au fondateur", included: true },
    ],
    cta: "Rejoindre l'environnement TPLN",
    planType: "premium",
    highlighted: true,
    tileBg: `radial-gradient(100% 40% at 50% 100%, rgba(97, 171, 255, 0.78) 0%, rgba(82, 130, 255, 0.6) 25%, rgba(28, 28, 28, 0) 100%), ${WHITE_TOP}, rgb(0, 7, 26)`,
    tileShadow: "rgba(0, 71, 214, 0.76) 0px 60px 100px -70px",
  },
  {
    slug: "tp",
    name: "MÉTHODE TPLN",
    subtitle: "Apprends en solo",
    price: "\u20AC49",
    period: "/ mois",
    badges: [],
    features: [
      { text: "Formation TPLN complète", included: true },
      { text: "Journal (1 compte inclus)", included: true },
      { text: "Structure + gestion du risque", included: true },
      { text: "Exécution disciplinée", included: true },
      { text: "Pas de live", included: false },
      { text: "Pas d'opportunités en temps réel", included: false },
    ],
    cta: "Je m'abonne",
    planType: "basic",
    tileBg: `radial-gradient(100% 40% at 50% 100%, rgba(254, 192, 67, 0.85) 0%, rgba(255, 185, 56, 0.55) 25%, rgba(28, 28, 28, 0) 100%), ${WHITE_TOP}, rgb(17, 13, 3)`,
    tileShadow: "rgba(179, 128, 0, 0.76) 0px 60px 100px -70px",
  },
  {
    slug: "starter",
    name: "JOURNAL PRO",
    price: "\u20AC29",
    period: "/ mois",
    badges: [],
    features: [
      { text: "Journal professionnel multi-comptes", included: true },
      { text: "Comptes illimités", included: true },
      { text: "Analyse avancée", included: true },
      { text: "Comparaison de comptes", included: true },
      { text: "Méthode TPLN", included: false },
      { text: "Exécutions partagées", included: false },
      { text: "Live", included: false },
    ],
    cta: "Accéder au Journal Pro",
    planType: "journal",
    tileBg: `radial-gradient(100% 40% at 50% 100%, rgba(255, 82, 165, 0.85) 0%, rgba(255, 82, 165, 0.55) 25%, rgba(28, 28, 28, 0) 100%), ${WHITE_TOP}, rgb(22, 4, 4)`,
    tileShadow: "rgba(204, 0, 109, 0.76) 0px 60px 100px -70px",
  },
];

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "outline" | "important";
}) {
  const color =
    variant === "important" ? "oklch(0.646 0.222 41.116)" : "oklch(0.985 0 0)";
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        gap: 4,
        padding: "2px 6px",
        height: 20,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: "11px",
        letterSpacing: "0.11px",
        color,
        border: "1px solid oklch(1 0 0 / 0.1)",
        borderRadius: 9999,
        background: "transparent",
      }}
    >
      {label}
    </span>
  );
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <li
      className="flex items-start"
      style={{ gap: 8, fontSize: 14, lineHeight: "20px" }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 2,
          color: feature.included ? "rgb(80, 180, 80)" : "rgb(200, 80, 80)",
        }}
      >
        {feature.included ? "\u2713" : "\u2715"}
      </span>
      <span
        style={{
          color: feature.included
            ? "oklch(0.85 0.006 286)"
            : "oklch(0.5 0.01 286)",
        }}
      >
        {feature.text}
      </span>
    </li>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className="tile relative flex shrink-0"
      style={{
        width: "100%",
        height: "100%",
        boxShadow: plan.tileShadow,
      }}
    >
      <div
        className="relative"
        style={{
          width: "100%",
          height: "100%",
          padding: 1,
          borderRadius: 24,
          boxShadow: plan.highlighted
            ? "inset 0 0 0 1px rgba(136, 136, 136, 0.2)"
            : "none",
        }}
      >
        <span
          aria-hidden
          className={`tile-ring tile-ring--${plan.slug}`}
        />
        <div
          className="relative flex flex-col"
          style={{
            width: "100%",
            height: "100%",
            padding: 28,
            borderRadius: 23,
            background: plan.tileBg,
          }}
        >
          {plan.badges.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 16 }}>
              {plan.badges.map((b) => (
                <Badge key={b.label} label={b.label} variant={b.variant} />
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: "22px",
              letterSpacing: "-0.02em",
              color: "oklch(0.985 0 0)",
              textTransform: "uppercase",
            }}
          >
            {plan.name}
          </div>

          {plan.subtitle && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                lineHeight: "18px",
                color: "oklch(0.7 0.01 286)",
                marginTop: 4,
              }}
            >
              {plan.subtitle}
            </div>
          )}

          <div className="flex items-baseline" style={{ marginTop: 20, gap: 4 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                lineHeight: "40px",
                letterSpacing: "-0.04em",
                color: "oklch(0.985 0 0)",
              }}
            >
              {plan.price}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: "oklch(0.7 0.01 286)",
              }}
            >
              {plan.period}
            </span>
          </div>

          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 28,
            }}
          >
            {plan.features.map((f) => (
              <FeatureItem key={f.text} feature={f} />
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              redirectToCheckout(plan.planType, "monthly").catch((err) => {
                console.error("Stripe checkout failed:", err);
                alert("Impossible d'ouvrir le paiement. Réessaie dans un instant.");
              });
            }}
            className="inline-flex items-center justify-center mt-auto"
            style={{
              marginTop: 28,
              padding: "12px 24px",
              borderRadius: 9999,
              fontSize: 15,
              fontWeight: 600,
              color: "oklch(0.985 0 0)",
              background: plan.highlighted
                ? "linear-gradient(135deg, rgb(60, 120, 255), rgb(100, 160, 255))"
                : "oklch(1 0 0 / 0.1)",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              transition: "opacity 0.2s ease",
            }}
          >
            {plan.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgramsSection() {
  return (
    <section
      className="programs dark"
      style={{
        background: "rgb(0, 0, 0)",
        padding: "160px 0",
        letterSpacing: "-0.01em",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
        <div style={{ display: "grid", placeItems: "center", paddingBottom: 64 }}>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 600,
              lineHeight: "52.8px",
              letterSpacing: "-0.04em",
              color: "oklch(0.985 0 0)",
              textAlign: "center",
              maxWidth: 680,
              margin: 0,
            }}
          >
            Les services de{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              TPLN
            </span>
          </h2>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: "28px",
              letterSpacing: "-0.02em",
              color: "oklch(0.985 0 0)",
              textAlign: "center",
              maxWidth: 760,
              paddingTop: 20,
              margin: 0,
            }}
          >
            Pour traders{" "}
            <span style={{ fontStyle: "italic" }}>disciplinés.</span>
          </p>
          <div
            style={{
              fontSize: 16,
              fontWeight: 400,
              lineHeight: "24px",
              color: "oklch(0.7 0.01 286)",
              textAlign: "center",
              maxWidth: 500,
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>TPLN s&apos;adresse aux traders qui privilégient :</span>
            <strong style={{ color: "oklch(0.985 0 0)" }}>La précision</strong>
            <strong style={{ color: "oklch(0.985 0 0)" }}>La structure</strong>
            <strong style={{ color: "oklch(0.985 0 0)" }}>La constance</strong>
            <strong style={{ color: "oklch(0.985 0 0)" }}>La responsabilité</strong>
            <span style={{ marginTop: 8 }}>
              Il ne s&apos;adresse pas à ceux qui recherchent des promesses rapides.
            </span>
          </div>
        </div>

        <div
          className="grid plans-grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((p) => (
            <PlanCard key={p.slug} plan={p} />
          ))}
        </div>

        {/* Accompagnement 1:1 */}
        <div
          style={{
            marginTop: 80,
            display: "grid",
            placeItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: "52px",
              letterSpacing: "-0.04em",
              textAlign: "center",
              margin: 0,
            }}
          >
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(10, 171, 240), rgb(143, 102, 255), rgb(231, 46, 235))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Accompagnement
            </span>{" "}
            <span style={{ color: "oklch(0.985 0 0)" }}>1:1</span>
          </h2>

          <div
            style={{
              marginTop: 32,
              maxWidth: 600,
              padding: 28,
              borderRadius: 20,
              border: "1px solid oklch(1 0 0 / 0.1)",
              background: "oklch(1 0 0 / 0.03)",
            }}
          >
            <p
              style={{
                fontSize: 16,
                lineHeight: "24px",
                color: "oklch(0.65 0.01 286)",
                margin: 0,
                marginBottom: 20,
              }}
            >
              Pour les traders qui veulent structurer et optimiser leur exécution.
            </p>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {[
                "Audit complet de ton journal",
                "Analyse de ta prise de décision",
                "Identification des biais récurrents",
                "Plan d'optimisation personnalisé",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center"
                  style={{
                    gap: 10,
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: "21px",
                    color: "oklch(0.985 0 0)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "oklch(0.985 0 0)",
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              marginTop: 32,
              borderTop: "1px solid oklch(1 0 0 / 0.1)",
              paddingTop: 32,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                lineHeight: "36px",
                color: "oklch(0.985 0 0)",
              }}
            >
              250\u20AC / session (1h)
            </div>
            <p
              style={{
                fontSize: 14,
                color: "oklch(0.55 0.01 286)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Places limitées.
            </p>
            <p
              style={{
                fontSize: 14,
                color: "oklch(0.55 0.01 286)",
                margin: "4px 0 0",
              }}
            >
              Accès sur demande.
            </p>
            <a
              href="#"
              className="inline-flex items-center justify-center"
              style={{
                marginTop: 20,
                padding: "12px 28px",
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 600,
                color: "oklch(0.985 0 0)",
                background:
                  "linear-gradient(135deg, rgb(255, 150, 80), rgb(255, 100, 150))",
                textDecoration: "none",
              }}
            >
              Réserver une session
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
