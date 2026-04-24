import { StaticPageLayout } from "./StaticPageLayout";

export function ConfidentialitePage() {
  return (
    <StaticPageLayout title="Politique de confidentialité">
      <p>Dernière mise à jour : avril 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>1. Données collectées</h2>
      <p>Lors de la création d'un compte, nous collectons :</p>
      <ul style={{ paddingLeft: 20, lineHeight: "28px" }}>
        <li>Ton prénom et adresse email</li>
        <li>Ton mot de passe (stocké de façon chiffrée via Supabase)</li>
        <li>Les données de ton journal de trading (trades, performances)</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>2. Utilisation des données</h2>
      <p>Les données collectées sont utilisées exclusivement pour :</p>
      <ul style={{ paddingLeft: 20, lineHeight: "28px" }}>
        <li>La gestion de ton compte et de ton accès à la plateforme</li>
        <li>L'amélioration de l'expérience utilisateur</li>
        <li>La communication relative à ton abonnement</li>
      </ul>
      <p>Nous ne vendons, ne louons et ne transmettons jamais tes données à des tiers à des fins commerciales.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>3. Cookies</h2>
      <p>Ce site utilise des cookies techniques nécessaires au bon fonctionnement de la plateforme (session, authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>4. Stockage et sécurité</h2>
      <p>Les données sont stockées sur les serveurs de Supabase (infrastructure AWS), sécurisés et conformes au RGPD. La transmission des données est chiffrée via HTTPS.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>5. Tes droits</h2>
      <p>Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, de suppression et de portabilité de tes données. Pour exercer ces droits, contacte-nous via la page <a href="/contact/" style={{ color: "oklch(0.5 0.15 260)" }}>Contact</a>.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>6. Contact</h2>
      <p>Pour toute question relative à ta vie privée : <a href="/contact/" style={{ color: "oklch(0.5 0.15 260)" }}>contact@tpln.fr</a></p>
    </StaticPageLayout>
  );
}
