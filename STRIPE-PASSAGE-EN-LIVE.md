# Passer Stripe en mode Live (vrais paiements)

Actuellement le site utilise les clés **test** Stripe (`pk_test_...`). Pour accepter de vrais paiements :

---

## 1. Stripe Dashboard – passer en Live

1. Va sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. En haut à droite, bascule le mode **Test** → **Live** (interrupteur).

---

## 2. Clés Live

- **Clé publique (publishable)** : Développeurs → Clés API → Clé publique (commence par `pk_live_...`).
- **Clé secrète (secret)** : même page, Clé secrète (commence par `sk_live_...`). Ne la mets **jamais** dans le code ni dans un fichier commité.

---

## 3. Produits et prix en Live

En mode **Live**, crée (ou recrée) tes produits / abonnements et récupère les **Price ID** (ex. `price_1ABC...`) pour :

- Journal : mensuel + annuel  
- Basic : mensuel + annuel  
- Premium : mensuel + annuel  

Tu peux créer les produits dans Stripe : Produits → Ajouter un produit, puis pour chaque prix noter l’**ID du prix** (pas l’ID du produit).

---

## 4. Variables d’environnement Netlify

Dans **Netlify** : Site → Paramètres → Variables d’environnement (ou “Environment variables”).  
Remplacer / ajouter **pour la production** :

| Variable | Où la trouver | Exemple (ne pas copier tel quel) |
|----------|----------------|-----------------------------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → Clés API → Clé publique **Live** | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe → Clés API → Clé secrète **Live** | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Voir étape 5 | `whsec_...` |
| `STRIPE_PRICE_ID_JOURNAL_MONTHLY` | Stripe → Produits / Prix Live | `price_...` |
| `STRIPE_PRICE_ID_JOURNAL_YEARLY` | idem | `price_...` |
| `STRIPE_PRICE_ID_BASIC_MONTHLY` | idem | `price_...` |
| `STRIPE_PRICE_ID_BASIC_YEARLY` | idem | `price_...` |
| `STRIPE_PRICE_ID_PREMIUM_MONTHLY` | idem | `price_...` |
| `STRIPE_PRICE_ID_PREMIUM_YEARLY` | idem | `price_...` |

Après modification des variables : **Redéployer** le site (Déploiements → “Trigger deploy” ou push un commit).

---

## 5. Webhook en Live

1. Stripe (en mode **Live**) → Développeurs → Webhooks → Ajouter un endpoint.
2. URL :  
   `https://TON-SITE.netlify.app/.netlify/functions/stripe-webhook`  
   (remplace `TON-SITE` par l’URL réelle de ton site Netlify).
3. Événements à écouter :  
   `checkout.session.completed`,  
   `customer.subscription.updated`,  
   `customer.subscription.deleted`.
4. Après création, ouvre le webhook et récupère le **Signing secret** (commence par `whsec_...`).
5. Mets ce secret dans Netlify : variable `STRIPE_WEBHOOK_SECRET` (voir tableau ci‑dessus).

---

## 6. En local (optionnel)

Pour tester en local avec le mode Live (attention : vrais paiements) :

- Dans ton fichier **`.env.local`** (jamais commité), mets :
  - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`  
Les fonctions Netlify (checkout, webhook) tournent sur Netlify, donc les clés secrètes et les Price ID restent dans Netlify ; en local tu ne changes que la clé publique si tu veux.

---

## Résumé

1. Passer Stripe en **Live** et noter les clés + les **Price ID** des abonnements.
2. Dans **Netlify** : mettre à jour toutes les variables listées (clé publique, clé secrète, webhook secret, 6 Price ID).
3. Créer le **webhook Live** et renseigner `STRIPE_WEBHOOK_SECRET`.
4. **Redéployer** le site.

Une fois ces étapes faites, les paiements sur le site seront réels (mode Live).
