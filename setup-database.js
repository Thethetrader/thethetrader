// Script pour configurer la base de données Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bamwcozzfshuozsfmajah.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbXdjb3p6ZnNodW96c2ZtamFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwMzQ4NywiZXhwIjoyMDY1Njc5NDg3fQ.oh90uSpCLIpg9nJ5RkTejg0s2WSf4aZqz5D798WpZ4Q'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Configuration de la base de données Supabase...')
  
  try {
    // Test de connexion
    const { data, error } = await supabase.from('auth.users').select('count').limit(1)
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      return
    }
    
    console.log('✅ Connexion à Supabase réussie!')
    
    // Créer les tables
    const createTablesSQL = `
      -- Activer les extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Table des signaux
      CREATE TABLE IF NOT EXISTS signals (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        symbol VARCHAR(20) NOT NULL,
        type VARCHAR(10) CHECK (type IN ('buy', 'sell')) NOT NULL,
        entry_price DECIMAL(20, 8) NOT NULL,
        stop_loss DECIMAL(20, 8),
        take_profit DECIMAL(20, 8),
        risk_reward DECIMAL(10, 2),
        status VARCHAR(20) CHECK (status IN ('active', 'closed', 'cancelled')) DEFAULT 'active',
        outcome VARCHAR(20) CHECK (outcome IN ('win', 'loss', 'breakeven')),
        channel VARCHAR(20) CHECK (channel IN ('crypto', 'forex', 'futures')) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
      );
    `
    
    console.log('📊 Création des tables...')
    
    // Exécuter le SQL avec rpc
    const { data: result, error: sqlError } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    })
    
    if (sqlError) {
      console.error('❌ Erreur SQL:', sqlError.message)
    } else {
      console.log('✅ Tables créées avec succès!')
    }
    
  } catch (err) {
    console.error('❌ Erreur:', err.message)
  }
}

setupDatabase()