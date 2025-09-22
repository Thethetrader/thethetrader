// Configuration GetStream Chat
// Copiez ce fichier et créez .env.local avec vos vraies clés

export const getStreamConfig = {
  // Remplacez par vos vraies clés GetStream
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY || '',
  secret: process.env.NEXT_PUBLIC_STREAM_SECRET || '',
  
  // Instructions:
  // 1. Créez un fichier .env.local à la racine du projet
  // 2. Ajoutez vos clés GetStream :
  //    NEXT_PUBLIC_STREAM_API_KEY=votre_api_key
  //    NEXT_PUBLIC_STREAM_SECRET=votre_secret
  // 3. Obtenez vos clés sur https://getstream.io/dashboard/
};

// Validation de la configuration
export const validateGetStreamConfig = () => {
  if (!getStreamConfig.apiKey || !getStreamConfig.secret) {
    console.warn('⚠️ Configuration GetStream manquante');
    console.log('📝 Créez un fichier .env.local avec :');
    console.log('   NEXT_PUBLIC_STREAM_API_KEY=votre_api_key');
    console.log('   NEXT_PUBLIC_STREAM_SECRET=votre_secret');
    return false;
  }
  return true;
};
