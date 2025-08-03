import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sbp_64b3c9feddc6a750742d9533155efd24c6614326.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicF82NGIzYzlmZWRkYzZhNzUwNzQyZDk1MzMxNTVlZmQyNGM2NjE0MzI2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NjUxNjEsImV4cCI6MjA1NDA0MTE2MX0.5_TYTQM3NXXnP3tVdQqbCJuN6OaZAGhXGnpJWaJMSus';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 