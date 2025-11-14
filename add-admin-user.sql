-- Script pour ajouter un utilisateur admin
-- À exécuter dans Supabase SQL Editor

-- 1. D'abord, vérifier si l'utilisateur existe dans auth.users
-- Récupérer l'ID de l'utilisateur depuis auth.users
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
)

-- 2. Ajouter l'utilisateur dans admin_profiles
INSERT INTO admin_profiles (id, email, name, created_at, updated_at)
SELECT 
  id, 
  'admin@gmail.com', 
  'Admin', 
  NOW(), 
  NOW()
FROM user_info
ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier que l'admin a bien été ajouté
SELECT * FROM admin_profiles WHERE email = 'admin@gmail.com';

