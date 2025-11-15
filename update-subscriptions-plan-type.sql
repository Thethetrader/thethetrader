-- Mettre à jour la contrainte CHECK pour inclure 'journal' dans plan_type
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

-- Ajouter la nouvelle contrainte CHECK avec 'journal'
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN ('basic', 'premium', 'journal'));

