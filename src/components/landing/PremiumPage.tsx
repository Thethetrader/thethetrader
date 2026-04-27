import { useState } from "react";
import { redirectToCheckout } from "../../utils/stripe";

const GREEN = "#1a6b2a";
const GREEN_DARK = "#155722";
const GREEN_BG = "#f0fdf4";
const GREEN_BORDER = "#bbf7d0";
const TEXT = "oklch(0.141 0.005 285.823)";
const TEXT_MED = "oklch(0.442 0.017 285.786)";
const BORDER = "oklch(0.92 0.004 286.32)";

const PLANS = [
  {
    slug: "premium",
    planType: "premium" as const,
    badge: "⭐ Option la plus choisie",
    highlighted: true,
    name: "L'Environnement Complet TPLN",
    tagline: "Méthode + Exécution + Transparence totale",
    monthly: 69,
    yearly: 690,
    yearlyMonthly: 57,
    features: [
      "Accès intégral à la méthode TPLN",
      "Exécution live 5j / semaine",
      "Opportunités validées en direct",
      "Notifications immédiates via l'app",
      "Journal professionnel multi-comptes",
      "Accès direct au fondateur",
    ],
    missing: [] as string[],
    cta: "Rejoindre l'environnement TPLN",
  },
  {
    slug: "basic",
    planType: "basic" as const,
    badge: null,
    highlighted: false,
    name: "Méthode TPLN",
    tagline: "Apprends et trades en solo",
    monthly: 49,
    yearly: 418,
    yearlyMonthly: 35,
    features: [
      "Formation TPLN complète",
      "Journal (1 compte inclus)",
      "Structure + gestion du risque",
      "Exécution disciplinée",
    ],
    missing: ["Sessions live", "Opportunités en temps réel"],
    cta: "Commencer avec la méthode",
  },
  {
    slug: "journal",
    planType: "journal" as const,
    badge: null,
    highlighted: false,
    name: "Journal Pro",
    tagline: "Analyse et suivi de tes performances",
    monthly: 15,
    yearly: 132,
    yearlyMonthly: 11,
    features: [
      "Journal professionnel multi-comptes",
      "Comptes illimités",
      "Analyse avancée",
      "Comparaison de comptes",
    ],
    missing: ["Méthode TPLN", "Sessions live"],
    cta: "Accéder au Journal Pro",
  },
];

export function PremiumPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planType: "premium" | "basic" | "journal") => {
    setLoading(planType);
    try {
      await redirectToCheckout(planType, billing);
    } catch {
      alert("Une erreur est survenue. Réessaie dans un instant.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => window.history.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: TEXT }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <img src="/faviconsansfond.webp" alt="TPLN" style={{ height: 30, objectFit: "contain" }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 120px" }}>
        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, margin: "0 0 8px", lineHeight: 1.2 }}>
          Active ton accès Premium
        </h1>
        <p style={{ fontSize: 15, color: TEXT_MED, margin: "0 0 18px", lineHeight: 1.5 }}>
          Méthode structurée, exécution live et journal pro — tout ce qu'il faut pour trader avec rigueur.
        </p>

        {/* Social proof */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}`, borderRadius: 20, padding: "6px 14px", marginBottom: 24 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={GREEN}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: GREEN_DARK }}>Déjà plus de 150 traders accompagnés</span>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", background: "#f4f4f5", borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
          <button
            onClick={() => setBilling("monthly")}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: billing === "monthly" ? "#fff" : "transparent",
              color: billing === "monthly" ? TEXT : TEXT_MED,
              boxShadow: billing === "monthly" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: billing === "yearly" ? "#fff" : "transparent",
              color: billing === "yearly" ? TEXT : TEXT_MED,
              boxShadow: billing === "yearly" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            Annuel&nbsp;
            <span style={{ fontSize: 10, fontWeight: 700, background: GREEN, color: "#fff", borderRadius: 6, padding: "1px 5px" }}>
              −20%
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              billing={billing}
              loading={loading === plan.planType}
              onCheckout={() => handleCheckout(plan.planType)}
            />
          ))}
        </div>

        {/* Legal */}
        <p style={{ marginTop: 28, fontSize: 11, color: TEXT_MED, textAlign: "center", lineHeight: 1.7 }}>
          Paiement sécurisé par Stripe · Sans engagement · Annulation en 1 clic
          <br />
          Les informations partagées sont à but informatif et ne constituent pas un conseil en investissement individualisé.
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  loading,
  onCheckout,
}: {
  plan: typeof PLANS[0];
  billing: "monthly" | "yearly";
  loading: boolean;
  onCheckout: () => void;
}) {
  const price = billing === "monthly" ? plan.monthly : plan.yearlyMonthly;

  return (
    <div style={{ position: "relative" }}>
      {plan.badge && (
        <div style={{
          position: "absolute", top: -11, right: 16, zIndex: 2,
          background: GREEN, color: "#fff", fontSize: 11, fontWeight: 700,
          borderRadius: 20, padding: "3px 12px", letterSpacing: "0.01em",
        }}>
          {plan.badge}
        </div>
      )}
      <div style={{
        border: plan.highlighted ? `2px solid ${GREEN}` : `1.5px solid ${BORDER}`,
        borderRadius: 20,
        padding: "22px 20px",
        background: plan.highlighted ? GREEN_BG : "#fff",
      }}>
        {/* Name & tagline */}
        <h2 style={{ fontSize: 17, fontWeight: 800, color: TEXT, margin: "0 0 3px", letterSpacing: "-0.02em" }}>
          {plan.name}
        </h2>
        <p style={{ fontSize: 13, color: plan.highlighted ? GREEN_DARK : TEXT_MED, margin: "0 0 14px", fontWeight: 500 }}>
          {plan.tagline}
        </p>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", color: TEXT, lineHeight: 1 }}>{price}€</span>
          <span style={{ fontSize: 13, color: TEXT_MED, marginBottom: 3 }}>/mois</span>
          {billing === "yearly" && (
            <span style={{ fontSize: 12, color: TEXT_MED, marginBottom: 3, marginLeft: 4 }}>· {plan.yearly}€/an</span>
          )}
        </div>

        {/* Features */}
        <div style={{ marginBottom: 18 }}>
          {plan.features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={GREEN} style={{ flexShrink: 0 }}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{f}</span>
            </div>
          ))}
          {plan.missing.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BORDER} strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
              <span style={{ fontSize: 13, color: TEXT_MED }}>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onCheckout}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px 20px",
            borderRadius: 12,
            border: plan.highlighted ? "none" : `1.5px solid ${BORDER}`,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            background: plan.highlighted ? GREEN : "#fff",
            color: plan.highlighted ? "#fff" : TEXT,
            opacity: loading ? 0.7 : 1,
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => {
            if (!loading && plan.highlighted) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK;
          }}
          onMouseLeave={(e) => {
            if (plan.highlighted) (e.currentTarget as HTMLButtonElement).style.background = GREEN;
          }}
        >
          {loading ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Redirection...
            </>
          ) : (
            plan.cta
          )}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
