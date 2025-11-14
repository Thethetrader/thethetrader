// Configuration Supabase
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: ''
}

// Pour développement local, vous pouvez temporairement mettre les vraies valeurs ici
// ATTENTION: Ne committez JAMAIS les vraies clés dans Git !

// Exemple une fois que vous avez les clés :
// export const supabaseConfig = {
//   url: 'https://abcdefgh.supabase.co',
//   anonKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
//   serviceRoleKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
// }