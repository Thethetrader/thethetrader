import { StaticPageLayout } from "./StaticPageLayout";

export function CgvPage() {
  return (
    <StaticPageLayout title="Conditions Générales de Vente">
      <p>Dernière mise à jour : avril 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>1. Objet</h2>
      <p>Les présentes CGV régissent les ventes de services proposés par TheTheTrader via le site TPLN. Tout achat implique l'acceptation pleine et entière des présentes conditions.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>2. Services proposés</h2>
      <ul style={{ paddingLeft: 20, lineHeight: "28px" }}>
        <li><strong>Accès Journal TPLN</strong> — abonnement mensuel donnant accès au journal de trading et à la méthode TPLN</li>
        <li><strong>Abonnement complet</strong> — accès journal + sessions live + application mobile</li>
        <li><strong>Session 1:1</strong> — coaching individuel d'1h à 250€/session</li>
        <li><strong>Essai gratuit 30 jours</strong> — accès journal sans engagement, sans carte bancaire</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>3. Prix et paiement</h2>
      <p>Les prix sont indiqués en euros TTC. Le paiement est sécurisé via Stripe. Les abonnements sont prélevés mensuellement à date anniversaire.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>4. Droit de rétractation</h2>
      <p>Conformément à l'article L221-18 du Code de la consommation, tu disposes d'un délai de 14 jours pour exercer ton droit de rétractation à compter de la souscription. Pour les services à accès immédiat (contenu numérique), tu renonces expressément à ce droit en validant ton achat.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>5. Résiliation</h2>
      <p>Tu peux résilier ton abonnement à tout moment depuis ton espace membre. La résiliation prend effet à la fin de la période en cours. Aucun remboursement partiel n'est effectué.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>6. Responsabilité</h2>
      <p>Les formations et contenus TPLN ont une vocation pédagogique. Ils ne constituent pas des conseils financiers. TheTheTrader ne garantit aucun résultat financier et ne saurait être tenu responsable des pertes éventuelles liées au trading.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>7. Loi applicable</h2>
      <p>Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux français seront compétents.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>8. Contact</h2>
      <p>Pour toute réclamation : <a href="/contact/" style={{ color: "oklch(0.5 0.15 260)" }}>contact@tpln.fr</a></p>
    </StaticPageLayout>
  );
}
