import React, { useEffect, useRef } from 'react';

interface RumbleTalkProps {
  chatId?: string;
}

const RumbleTalk: React.FC<RumbleTalkProps> = ({ chatId = '!1V9roB' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Éviter de charger le script plusieurs fois
    if (scriptLoadedRef.current) {
      console.log('⚠️ Script RumbleTalk déjà chargé');
      return;
    }

    // Créer et ajouter le script RumbleTalk
    const script = document.createElement('script');
    script.src = `https://rumbletalk.com/client/?${chatId}:`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script RumbleTalk chargé avec succès');
      scriptLoadedRef.current = true;
    };
    
    script.onerror = () => {
      console.error('❌ Erreur chargement script RumbleTalk');
    };
    
    // Ajouter le script au document
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
    
    // Cleanup function
    return () => {
      if (containerRef.current && script.parentNode) {
        containerRef.current.removeChild(script);
      }
      scriptLoadedRef.current = false;
      console.log('🔄 Composant RumbleTalk démonté');
    };
  }, [chatId]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ height: '600px', width: '100%', maxWidth: '1200px' }}>
        <div id="rt-557e982f6b67541655c3270785d365db" ref={containerRef}></div>
      </div>
    </div>
  );
};

export default RumbleTalk;

