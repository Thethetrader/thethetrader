// Configuration des variables d'environnement pour le chat Supabase
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  CHAT_ENABLED: import.meta.env.VITE_CHAT_ENABLED === 'true' || true,
  CHAT_REALTIME: import.meta.env.VITE_CHAT_REALTIME === 'true' || true,
} as const;

// Validation des variables d'environnement
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Vérifiez votre configuration.');
}




