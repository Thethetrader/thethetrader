import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email et mot de passe requis' }),
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
      };
    }

    // Trouver l'utilisateur par email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Utilisateur non trouvé' }),
      };
    }

    // Mettre à jour le mot de passe avec l'API admin
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (error) {
      console.error('❌ Erreur mise à jour mot de passe:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    console.log('✅ Mot de passe créé pour:', email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Mot de passe créé avec succès'
      }),
    };
  } catch (error) {
    console.error('❌ Erreur setup-password:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

