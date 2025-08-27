import { supabase } from './supabase-setup';

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
    const userId = userType === 'admin' ? 'admin_user' : 'default_user';
    
    // Vérifier si le profil existe
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .single();
    
    if (existingProfile) {
      // Mettre à jour le profil existant
      await supabase
        .from('user_profiles')
        .update({ 
          profile_image: imageBase64,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      console.log('🔄 Profil mis à jour dans Supabase');
    } else {
      // Créer un nouveau profil
      await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          user_type: userType,
          profile_image: imageBase64,
          display_name: userType === 'admin' ? 'Admin' : 'TheTheTrader'
        });
      console.log('✨ Nouveau profil créé dans Supabase');
    }
    
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
    
    // 2. Si pas dans localStorage, chercher dans Supabase
    const userId = userType === 'admin' ? 'admin_user' : 'default_user';
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('profile_image')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .single();
    
    if (profile?.profile_image) {
      // Sauvegarder dans localStorage pour la prochaine fois
      localStorage.setItem(localKey, profile.profile_image);
      console.log('☁️ Photo trouvée dans Supabase et sauvegardée localement');
      return profile.profile_image;
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