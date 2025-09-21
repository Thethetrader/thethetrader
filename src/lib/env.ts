// Configuration des variables d'environnement pour le chat Supabase
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://bamwcozzfshuozsfmjah.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbXdjb3p6ZnNodW96c2ZtamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDM0ODcsImV4cCI6MjA2NTY3OTQ4N30.NWSUKoYLl0oGS-dXf4jhtmLRiSuBSk-0lV3NRHJLvrs',
  CHAT_ENABLED: import.meta.env.VITE_CHAT_ENABLED === 'true' || true,
  CHAT_REALTIME: import.meta.env.VITE_CHAT_REALTIME === 'true' || true,
} as const;

// Validation des variables d'environnement
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase manquantes. Vérifiez votre configuration.');
}




