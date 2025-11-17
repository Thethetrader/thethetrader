import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY) doivent être définis dans .env');
  console.log('\n💡 Pour supprimer les trades manuellement:');
  console.log('   1. Va sur https://supabase.com/dashboard');
  console.log('   2. Sélectionne ton projet');
  console.log('   3. Va dans SQL Editor');
  console.log('   4. Exécute: DELETE FROM personal_trades;');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAllTrades() {
  try {
    console.log('🔍 Récupération de tous les trades...');
    
    // D'abord, compter les trades
    const { count, error: countError } = await supabase
      .from('personal_trades')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
      return;
    }
    
    console.log(`📊 ${count || 0} trades trouvés.`);
    
    if (count === 0) {
      console.log('✅ Aucun trade à supprimer.');
      return;
    }
    
    console.log('🗑️  Suppression de tous les trades...');
    
    // Supprimer tous les trades
    const { error } = await supabase
      .from('personal_trades')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition qui match tout
    
    if (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      return;
    }
    
    console.log(`✅ ${count} trades supprimés avec succès !`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

deleteAllTrades().then(() => {
  console.log('✨ Terminé !');
  process.exit(0);
});


