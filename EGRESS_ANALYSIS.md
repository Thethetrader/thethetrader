# Analyse Egress – Sources potentielles de sortie de données

## 1. Appels fetch / supabase.from / supabase.storage

### fetch()
| Fichier | Ligne | Contexte |
|---------|-------|----------|
| `src/App.tsx` | 246 | `fetch(/.netlify/functions/get-checkout-email?session_id=...)` – checkout |
| `src/App.tsx` | 1018 | `fetch(/.netlify/functions/setup-password)` – setup password |
| `src/utils/stripe.ts` | 35 | `fetch(url)` – Stripe |
| `src/hooks/useStreamToken.js` | 20, 51 | `fetch(API_BASE_URL/stream-token)` – stream token |

### supabase.from()
- **`src/lib/supabase.ts`** : `user_profiles`, `chat_messages`, `personal_trades`, `fin_session_stats`, `user_accounts`, `subscriptions` – cœur des données.
- **`src/hooks/useChat.ts`** : `chat_messages`, `message_reactions`, `message_attachments` – à chaque envoi/lecture.
- **`src/hooks/useChatMessages.ts`** : `profiles`, `chat_messages`, `message_reactions`.
- **`src/hooks/useSignals.ts`** : `signals` – chargement + réabonnement à chaque changement.
- **`src/components/AdminInterface.tsx`** : `personal_trades` (update account).
- **`src/components/CompleteWhatsAppChat.jsx`** : `messages`, `typing_indicators`, `message_reactions`.
- **`src/components/WhatsAppChat.jsx`** : idem.
- **`src/components/SuperChat.jsx`** : `chat_messages`, `message_read_status`, `message_reactions`, `typing_status`.
- **`src/utils/init-database.ts`** : `messages`, `signals` – init.
- **`src/utils/supabase-setup.ts`** : `messages`, `signals`.
- **`src/utils/profile-manager.ts`** : `user_profiles`.
- **`src/components/ChatZoneSupabase.tsx`** : `chat_channels`.
- **`src/components/ChatZone.tsx`** : `chat_channels`.
- **`src/components/UserChat.tsx`** : `chat_channels`.
- **`src/components/SupabaseTest.tsx`** : `signals` – test (peut être désactivé en prod).

### supabase.storage
- **`src/lib/supabase.ts`** : `getPublicUrl`, uploads (bucket variable).
- **`src/hooks/useChat.ts`** : `chat-files` (upload + getPublicUrl).
- **`src/hooks/useFileUpload.ts`** : upload + `getPublicUrl`.
- **`src/components/SuperChat.jsx`** : `chat-files` (upload + getPublicUrl).
- **`src/components/WhatsAppChat.jsx`** : `chat-files`.
- **`src/components/CompleteWhatsAppChat.jsx`** : `chat-files` + getPublicUrl.

---

## 2. useEffect sans tableau de dépendances `[]` ou avec dépendances à risque

### Sans `[]` (exécution à chaque render si pas de tableau)
- Aucun repéré avec une absence totale de tableau de dépendances.

### Dépendances qui peuvent déclencher beaucoup d’appels
- **`src/hooks/useSignals.ts`** (ligne 49) : `useEffect(..., [channel])` – à chaque changement de `channel` : 1 fetch `signals` + 1 abonnement realtime. Si `channel` change souvent (ex. sélecteur), beaucoup de requêtes.
- **`src/components/SupabaseChat.tsx`** (ligne 47) : `useEffect(..., [currentUser, loading])` – à chaque changement appelle `supabase.auth.getSession()` (import dynamique + getSession). Peut multiplier les appels auth.
- **`src/components/ChannelUsers.tsx`** (ligne 49) : `useEffect(..., [channelId])` – 1 appel `getChannelUsers(channelId)` par changement de canal. Raisonnable si canal stable.

### useEffects avec `[]` qui font des appels coûteux
- **`src/hooks/useStatsSync.ts`** (ligne 167) : `useEffect(() => { loadAllSignalsForStats(); setInterval(loadAllSignalsForStats, 30000); }, []);` – voir section Polling.
- **`src/hooks/useCalendarSync.ts`** (ligne 284) : `useEffect(() => { loadCalendarData(); setInterval(loadCalendarData, 30000); }, []);` – idem.
- **`src/components/SupabaseChat.tsx`** (ligne 16) : `useEffect(() => { checkSession(); }, []);` – jusqu’à 5× `getSession()` (tentatives avec délai).
- **`src/components/SupabaseTest.tsx`** (ligne 9) : `useEffect(() => { testConnection(); }, []);` – 1× getSession + éventuellement 1× select signals. À désactiver en prod.

---

## 3. Polling automatique et abonnements realtime

### setInterval (polling)
| Fichier | Ligne | Période | Action |
|---------|-------|---------|--------|
| **`src/hooks/useStatsSync.ts`** | 169 | **30 s** | `loadAllSignalsForStats()` → **5 canaux × getSignals(channelId, 999)** (Firebase). Très coûteux en lecture Firebase. |
| **`src/hooks/useCalendarSync.ts`** | 287 | **30 s** | `loadCalendarData()` → **5 canaux × getSignals(channelId, 100)** (Firebase). Coûteux. |
| **`src/App.tsx`** | 502 | (animation) | setInterval pour animation chiffres – pas d’egress. |
| **`src/main.tsx`** | 44 | 1 h | `registration.update()` – PWA, pas Supabase. |
| **`src/hooks/useTypingIndicator.ts`** | 133 | (cleanup) | setInterval nettoyage typing – peu d’impact. |

### Realtime (Supabase)
| Fichier | Ligne | Table / usage |
|---------|-------|----------------|
| **`src/lib/supabase.ts`** | 1254 | `personal_trades` – à chaque INSERT/UPDATE/DELETE appelle **getPersonalTrades(1000)** (ligne 1268). **Très coûteux** : 1 requête complète (limit 1000) par événement. |
| **`src/hooks/useSignals.ts`** | 36 | `signals` – à chaque changement appelle **fetchSignals()** (rechargement total). Multiplie les lectures. |
| **`src/hooks/useChatMessages.ts`** | 258 | `chat_messages` (INSERT/UPDATE/DELETE) – pas de refetch global, seulement mise à jour locale. OK. |
| **`src/hooks/useTypingIndicator.ts`** | 85 | `typing_status` – postgres_changes + setInterval cleanup. Modéré. |
| **`src/hooks/useChat.ts`** | 412 | channel chat + presence. Modéré si peu d’utilisateurs. |
| **`src/components/SuperChat.jsx`** | 385, 416, 438 | `chat_messages`, `typing_status`, `message_reactions` – 3 abonnements par canal. |
| **`src/components/CompleteWhatsAppChat.jsx`** | 347, 373, 388 | `messages`, `typing_indicators`, presence. |
| **`src/components/WhatsAppChat.jsx`** | 442, 470 | `messages`, `typing_indicators`. |
| **`src/utils/supabase-setup.ts`** | 153, 182 | `messages`, `signals` – abonnements par canal. |

---

## 4. Requêtes qui peuvent se déclencher plusieurs fois par render

- **Realtime personal_trades** : À chaque événement sur `personal_trades`, **getPersonalTrades(1000)** est appelé (après 600 ms). Si plusieurs updates rapides (ex. admin qui édite plusieurs trades), ça multiplie les requêtes.
- **useSignals** : Chaque événement realtime sur `signals` déclenche un **fetchSignals()** complet (tous les signaux du canal). Pas de limite côté hook.
- **SupabaseChat** : Le `useEffect` avec `[currentUser, loading]` appelle **getSession()** à chaque changement. Si `currentUser`/`loading` oscillent, plusieurs getSession.
- **convertToLocalMessage** dans useChatMessages : Pour chaque nouveau message reçu en realtime, **getUserProfile(senderId)** est appelé (avec cache par userId). Premier message par utilisateur = 1 requête `profiles` par nouvel auteur.
- **TradingPlatformShell** : Rechargement manuel des trades avec **getPersonalTrades(1000)** (ligne 4003) en cas d’échec ou de “retry” – peut être déclenché plusieurs fois selon la logique de retry.

---

## 5. Images chargées depuis Supabase sans cache explicite

- **getPublicUrl** (Supabase Storage) : Utilisé dans `useChat.ts`, `useFileUpload.ts`, `SuperChat.jsx`, `WhatsAppChat.jsx`, `CompleteWhatsAppChat.jsx`. Les URLs publiques Supabase sont des URLs HTTP(S) ; le cache dépend du navigateur et des en-têtes renvoyés par Supabase (Cache-Control). Aucun cache applicatif (ex. mémoire / service worker) n’est ajouté côté code.
- **Affichage d’images** : Dans `AdminInterface.tsx` et `TradingPlatformShell.tsx`, les images sont affichées via `message.attachment_data`, `message.author_avatar`, `profileImage`, `imgUrl`, etc. Si ces URLs pointent vers Supabase Storage et qu’elles sont re-rendues souvent (listes longues, scroll), chaque affichage peut revalider voire retélécharger si les en-têtes ne sont pas bien configurés côté bucket.
- Aucun usage de `createSignedUrl` avec courte TTL repéré ; les URLs sont publiques. Le risque egress est surtout volume de requêtes (nombre d’images × nombre de re-renders ou de vues) si Cache-Control n’est pas optimisé côté Supabase.

---

## Fichiers les plus problématiques pour l’egress

### Critique
1. **`src/lib/supabase.ts`**  
   - **listenToPersonalTrades** : À chaque événement sur `personal_trades`, appel à **getPersonalTrades(1000)**. Un seul utilisateur actif qui reçoit des mises à jour (ou un admin qui édite) peut générer beaucoup de lignes lues (1000 × nombre d’événements).
   - **Recommandation** : Ne pas refetch 1000 lignes à chaque événement. Soit utiliser le payload realtime pour mettre à jour la liste localement, soit refetch avec une limite plus basse (ex. 50) ou seulement après un debounce.

2. **`src/hooks/useStatsSync.ts`**  
   - **Polling 30 s** : `loadAllSignalsForStats()` appelle **getSignals(channelId, 999)** pour **5 canaux** (Firebase). Donc 5 × 999 lectures Firebase toutes les 30 s par client ouvert.
   - **Recommandation** : Réduire la fréquence (ex. 2–5 min), réduire la limite par canal (ex. 100), ou basculer sur un backend/Supabase qui agrège les stats une fois.

3. **`src/hooks/useCalendarSync.ts`**  
   - **Polling 30 s** : `loadCalendarData()` appelle **getSignals(channelId, 100)** pour **5 canaux** (Firebase). 5 × 100 lectures toutes les 30 s.
   - **Recommandation** : Même logique que useStatsSync (fréquence + limite ou agrégation côté serveur).

4. **`src/hooks/useSignals.ts`**  
   - **Realtime** : Chaque changement sur la table `signals` déclenche un **fetchSignals()** complet (select sans limite explicite dans le hook).
   - **Recommandation** : Soit utiliser le payload realtime pour patcher la liste, soit ajouter une limite (ex. 50–100) et paginer si besoin.

### Élevé
5. **`src/components/AdminInterface.tsx`**  
   - Plusieurs **getPersonalTradesFromSupabase(1000)** : après submit trade, après édition, dans un bouton “recharger”, etc. Chaque action = 1000 lignes lues.
   - **Recommandation** : Limiter à 100–200 par défaut, ou recharger seulement la plage utile (ex. mois courant).

6. **`src/components/generated/TradingPlatformShell.tsx`**  
   - **getPersonalTrades(1000)** dans la logique de retry (ligne 4003). Si l’utilisateur a des soucis de connexion, plusieurs refetch de 1000 lignes.
   - **Recommandation** : Réduire la limite et/ou limiter le nombre de retries.

7. **`src/components/SupabaseChat.tsx`**  
   - **useEffect [currentUser, loading]** : appelle **getSession()** à chaque changement. Peut faire plusieurs appels auth inutiles.
   - **Recommandation** : Ne pas appeler getSession dans ce useEffect de debug, ou le conditionner (ex. seulement en dev).

### Modéré
8. **`src/hooks/useChatMessages.ts`**  
   - Chargement initial des messages + 1 requête **profiles** par auteur distinct (avec cache). Impact proportionnel au nombre de nouveaux auteurs dans la conversation.
9. **`src/hooks/useTypingIndicator.ts`**  
   - Realtime + setInterval de nettoyage. Faible volume si peu d’utilisateurs en typing.
10. **Chat (SuperChat, WhatsAppChat, CompleteWhatsAppChat)**  
    - Plusieurs abonnements realtime par canal + upload/storage. Impact surtout si beaucoup de canaux ouverts et beaucoup de pièces jointes.

### Images / storage
11. **Supabase Storage (getPublicUrl, uploads)**  
    - Pas de cache applicatif ; dépend du Cache-Control du bucket et du nombre de fois où les mêmes URLs sont chargées (listes, scroll). Vérifier les en-têtes de cache sur le bucket et limiter la taille des images côté upload.

---

## Résumé des actions recommandées (ordre prioritaire)

1. **Realtime personal_trades** : Ne plus appeler `getPersonalTrades(1000)` à chaque événement ; utiliser le payload ou un refetch limité / debounced.
2. **useStatsSync** : Réduire fréquence (ex. 2–5 min) et/ou limite (ex. 100 par canal) ou remplacer par une API agrégée.
3. **useCalendarSync** : Idem (fréquence + limite ou agrégation).
4. **useSignals** : Limiter le fetch (ex. 50–100) et privilégier la mise à jour via le payload realtime.
5. **getPersonalTrades(1000)** partout : Passer à 100–200 sauf cas explicite (ex. export), et éviter refetch systématique après chaque action.
6. **SupabaseChat** : Supprimer ou conditionner le `useEffect` qui appelle getSession sur [currentUser, loading].
7. **Supabase Storage** : Vérifier Cache-Control sur les buckets et, si besoin, ajouter cache côté app (ex. mémoire par URL) pour les images souvent affichées.

En appliquant ces points, tu réduis fortement le volume de données lues (Supabase + Firebase) et donc l’egress.
