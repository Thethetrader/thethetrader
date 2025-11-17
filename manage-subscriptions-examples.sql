-- Exemples de requêtes pour gérer les abonnements dans Supabase

-- 1. Voir tous les utilisateurs avec leur email et ID
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Voir tous les abonnements actifs avec les emails des utilisateurs
SELECT 
    u.email,
    u.id as user_id,
    s.plan_type,
    s.status,
    s.created_at,
    s.updated_at
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- 3. Donner la formule PREMIUM à un utilisateur (remplace USER_ID par le vrai UUID)
-- Exemple: INSERT INTO subscriptions (user_id, plan_type, status)
-- VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'premium', 'active');

-- 4. Changer la formule d'un utilisateur (remplace USER_ID par le vrai UUID)
-- UPDATE subscriptions 
-- SET plan_type = 'journal', status = 'active', updated_at = NOW()
-- WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' AND status = 'active';

-- 5. Donner une formule à un utilisateur par son email
INSERT INTO subscriptions (user_id, plan_type, status)
SELECT id, 'premium', 'active'
FROM auth.users
WHERE email = 'exemple@email.com'
ON CONFLICT (user_id, status) WHERE status = 'active'
DO UPDATE SET 
    plan_type = EXCLUDED.plan_type,
    updated_at = NOW();

-- 6. Changer la formule d'un utilisateur par son email
UPDATE subscriptions 
SET plan_type = 'journal', status = 'active', updated_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'exemple@email.com'
) AND status = 'active';

-- 7. Voir les utilisateurs sans abonnement actif
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
WHERE s.id IS NULL;

-- 8. Supprimer un abonnement (le désactiver)
UPDATE subscriptions 
SET status = 'cancelled', updated_at = NOW()
WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' AND status = 'active';


