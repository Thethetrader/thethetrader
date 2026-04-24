import { useState } from "react";
import { StaticPageLayout } from "./StaticPageLayout";

const FAQS = [
  {
    q: "C'est quoi la méthode TPLN ?",
    a: "TPLN (Trading Pour Les Nuls) est une méthode de trading structurée basée sur 3 piliers : un modèle d'analyse clair, un journal de suivi des performances, et des sessions live quotidiennes. L'objectif est de trader avec constance et précision, sans indicateurs inutiles.",
  },
  {
    q: "À qui s'adresse TPLN ?",
    a: "TPLN s'adresse aux traders débutants et intermédiaires qui veulent sortir de l'amateurisme. Que tu aies déjà quelques bases ou que tu commences de zéro, la méthode est conçue pour être accessible et directement applicable.",
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "L'essai gratuit te donne accès au journal TPLN pendant 30 jours, sans carte bancaire requise. Il te suffit de créer un compte avec ton email et un mot de passe. Aucun engagement, aucune surprise.",
  },
  {
    q: "Qu'est-ce que le journal TPLN ?",
    a: "Le journal TPLN est un outil de suivi de tes trades. Il te permet de mesurer ta performance réelle (win rate, ratio risk/reward, discipline par session), de détecter tes erreurs comportementales, et de progresser de façon structurée.",
  },
  {
    q: "Les sessions live ont lieu quand ?",
    a: "Les sessions live se déroulent 5 jours par semaine, en temps réel sur les marchés. Tu reçois une notification via l'application dès qu'une opportunité est validée. Tout est transparent grâce au journal public des performances.",
  },
  {
    q: "Quelle est la différence entre les formules ?",
    a: "Le journal seul te donne accès à l'outil de suivi et à la méthode de base. La formule complète inclut en plus les sessions live, les coachings et l'accès à l'application mobile TPLN. Consulte la section Prix pour le détail.",
  },
  {
    q: "Est-ce que je peux annuler à tout moment ?",
    a: "Oui. Il n'y a aucun engagement. Tu peux annuler ton abonnement à tout moment depuis ton espace membre, sans frais ni justification.",
  },
  {
    q: "Comment réserver une session 1:1 ?",
    a: "Tu peux réserver une session individuelle directement depuis la page Contact ou la section Prix. Les sessions durent 1h et sont facturées 250€. Elles sont disponibles pour les membres actifs.",
  },
  {
    q: "L'application est disponible sur iPhone et Android ?",
    a: "L'application mobile TPLN est disponible sur iOS (iPhone) et Android. Elle centralise l'exécution, les sessions live, le journal et l'historique dans un seul environnement.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Tu peux nous contacter via le formulaire sur la page Contact. Nous répondons sous 24h en jours ouvrés.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid oklch(0.92 0.004 286.32)",
        padding: "20px 0",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          padding: 0,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 600, color: "oklch(0.141 0.005 285.823)", lineHeight: "1.4" }}>{q}</span>
        <span style={{ fontSize: 22, color: "oklch(0.442 0.017 285.786)", flexShrink: 0, transform: open ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>+</span>
      </button>
      {open && (
        <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: "26px", color: "oklch(0.442 0.017 285.786)" }}>
          {a}
        </p>
      )}
    </div>
  );
}

export function FaqPage() {
  return (
    <StaticPageLayout title="Questions fréquentes">
      <div>
        {FAQS.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </div>
      <div style={{ marginTop: 64, padding: 32, borderRadius: 16, background: "oklch(0.967 0.001 286.375)", textAlign: "center" }}>
        <p style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "oklch(0.141 0.005 285.823)" }}>
          Encore des questions ?
        </p>
        <a
          href="/contact/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "oklch(0.21 0.006 285.885)",
            color: "#fff",
            borderRadius: 9,
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Nous contacter
        </a>
      </div>
    </StaticPageLayout>
  );
}
