import { supabase, signOut, createAdminUser, isUserAdmin } from '../lib/supabase';

/**
 * Déconnexion admin complète
 */
export const signOutAdmin = async () => {
  try {
    // Déconnexion Supabase
    await signOut();

    // Nettoyage localStorage
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUser');

    console.log('✅ Déconnexion admin réussie');
    return { error: null };
  } catch (error) {
    console.error('❌ Erreur déconnexion admin:', error);
    return { error: error instanceof Error ? error : new Error('Erreur déconnexion') };
  }
};

/**
 * Vérifie si la session admin est valide
 */
export const checkAdminSession = async (): Promise<boolean> => {
  try {
    const localAuth = localStorage.getItem('adminAuthenticated') === 'true';
    if (!localAuth) return false;

    // Vérifier la session Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Nettoyer le localStorage si pas de session
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('adminUser');
      return false;
    }

    // Vérifier le rôle admin
    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      // Nettoyer et déconnecter si plus admin
      await signOutAdmin();
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur vérification session admin:', error);
    return false;
  }
};

/**
 * Utilitaire pour créer un compte admin (à utiliser en développement)
 */
export const createAdminAccount = async (email: string, password: string, name: string = 'Admin') => {
  try {
    console.log('🔧 Création compte admin:', email);

    const { data, error } = await createAdminUser(email, password, { name });

    if (error) {
      console.error('❌ Erreur création admin:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Compte admin créé:', data?.user?.email);
    return { success: true, user: data?.user };
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur création admin'
    };
  }
};

/**
 * Obtient les informations admin depuis localStorage
 */
export const getAdminUserFromStorage = () => {
  try {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  } catch (error) {
    console.error('❌ Erreur lecture admin localStorage:', error);
    return null;
  }
};

/**
 * Fonction utilitaire pour débugger et créer un admin en développement
 * À utiliser dans la console du navigateur
 */
export const createDevAdmin = async () => {
  if (import.meta.env.PROD) {
    console.warn('❌ Cette fonction ne peut être utilisée qu\'en développement');
    return;
  }

  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';

  const result = await createAdminAccount(adminEmail, adminPassword, 'Super Admin');

  if (result.success) {
    console.log('✅ Admin créé avec succès !');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    console.log('🔗 Connectez-vous à /admin');
  } else {
    console.log('❌ Erreur création admin:', result.error);
  }

  return result;
};

// Exposer la fonction en développement dans window
if (import.meta.env.DEV) {
  (window as any).createDevAdmin = createDevAdmin;
  console.log('🔧 DEV MODE: Utilisez window.createDevAdmin() pour créer un admin');
}