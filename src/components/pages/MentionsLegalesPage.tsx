import { StaticPageLayout } from "./StaticPageLayout";

export function MentionsLegalesPage() {
  return (
    <StaticPageLayout title="Mentions légales">
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Éditeur du site</h2>
      <p>Le site TPLN (Trading Pour Les Nuls) est édité par TheTheTrader, auto-entrepreneur.</p>
      <p>Email : contact@tpln.fr</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>Hébergement</h2>
      <p>Ce site est hébergé par Netlify, Inc. — 44 Montgomery Street, Suite 300, San Francisco, California 94104.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>Propriété intellectuelle</h2>
      <p>L'ensemble des contenus présents sur ce site (textes, images, vidéos, méthodes) sont la propriété exclusive de TheTheTrader. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>Limitation de responsabilité</h2>
      <p>Les informations fournies sur ce site ont un caractère pédagogique et ne constituent pas des conseils en investissement. Le trading comporte des risques de perte en capital. TheTheTrader ne saurait être tenu responsable des pertes financières résultant de l'utilisation des contenus publiés.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 8px" }}>Loi applicable</h2>
      <p>Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux français.</p>
    </StaticPageLayout>
  );
}
