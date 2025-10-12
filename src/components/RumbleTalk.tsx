import React, { useEffect } from 'react';

interface RumbleTalkProps {
  chatId?: string;
}

const RumbleTalk: React.FC<RumbleTalkProps> = ({ chatId = '!1V9roB' }) => {
  useEffect(() => {
    // Vérifier si le script RumbleTalk est déjà chargé
    const existingScript = document.querySelector('script[src*="rumbletalk.com"]');
    
    if (!existingScript) {
      // Créer et ajouter le script RumbleTalk
      const script = document.createElement('script');
      script.src = `https://rumbletalk.com/client/?${chatId}:`;
      script.async = true;
      
      // Ajouter le script au body
      document.body.appendChild(script);
      
      console.log('✅ Script RumbleTalk chargé');
      
      // Cleanup function pour retirer le script si le composant est démonté
      return () => {
        // On garde le script car RumbleTalk gère lui-même le rechargement
        console.log('🔄 Composant RumbleTalk démonté');
      };
    } else {
      console.log('⚠️ Script RumbleTalk déjà présent');
    }
  }, [chatId]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ height: '600px', width: '100%', maxWidth: '1200px' }}>
        <div id="rt-557e982f6b67541655c3270785d365db"></div>
      </div>
    </div>
  );
};

export default RumbleTalk;

