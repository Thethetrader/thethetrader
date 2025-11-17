import { supabase, getCurrentUser } from '../lib/supabase';

export interface UserProfile {
  id?: string;
  user_id: string;
  user_type: 'user' | 'admin';
  profile_image?: string;
  display_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Synchroniser la photo de profil entre localStorage et Supabase
export const syncProfileImage = async (userType: 'user' | 'admin', imageBase64: string) => {
  try {
    console.log('🔄 Synchronisation photo de profil...');
    
    // 1. Sauvegarder dans localStorage pour accès rapide
    const localKey = userType === 'admin' ? 'adminProfileImage' : 'userProfileImage';
    localStorage.setItem(localKey, imageBase64);
    console.log('💾 Sauvegardé dans localStorage');
    
    // 2. Sauvegarder dans Supabase pour synchronisation cross-device
    // Utiliser le vrai userId de l'utilisateur connecté
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return { success: false, error: 'Utilisateur non connecté' };
    }
    
    const userId = user.id;
    console.log('👤 Utilisateur ID:', userId);
    
    // Mettre à jour le profil avec upsert (crée ou met à jour)
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        avatar_url: imageBase64,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return { success: false, error };
    }
    
    console.log('✅ Profil synchronisé dans Supabase:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sync profile:', error);
    return { success: false, error };
  }
};

// Récupérer la photo de profil (localStorage d'abord, puis Supabase)
export const getProfileImage = async (userType: 'user' | 'admin'): Promise<string | null> => {
  try {
    // 1. Essayer localStorage d'abord (plus rapide)
    const localKey = userType === 'admin' ? 'adminProfileImage' : 'userProfileImage';
    const localImage = localStorage.getItem(localKey);
    
    if (localImage) {
      console.log('📱 Photo trouvée dans localStorage');
      return localImage;
    }
    
    // 2. Si pas dans localStorage, chercher dans Supabase avec le vrai userId
    const user = await getCurrentUser();
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return null;
    }
    
    const userId = user.id;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    
    if (profile?.avatar_url) {
      // Sauvegarder dans localStorage pour la prochaine fois
      localStorage.setItem(localKey, profile.avatar_url);
      console.log('☁️ Photo trouvée dans Supabase et sauvegardée localement');
      return profile.avatar_url;
    }
    
    console.log('❌ Aucune photo de profil trouvée');
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération profile:', error);
    return null;
  }
};

// Initialiser le profil au chargement
export const initializeProfile = async (userType: 'user' | 'admin') => {
  const profileImage = await getProfileImage(userType);
  return profileImage;
};