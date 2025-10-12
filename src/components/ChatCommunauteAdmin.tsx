import React, { useEffect, useRef } from 'react';

const ChatCommunauteAdmin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Éviter de charger le script plusieurs fois
    if (scriptLoadedRef.current) {
      console.log('⚠️ Script RumbleTalk déjà chargé');
      return;
    }

    console.log('🔄 Chargement du script RumbleTalk...');

    // Créer et ajouter le script RumbleTalk
    const script = document.createElement('script');
    script.src = 'https://rumbletalk.com/client/?!1V9roB:';
    script.async = true;
    script.id = 'rumbletalk-script-admin';
    
    script.onload = () => {
      console.log('✅ Script RumbleTalk chargé avec succès');
      scriptLoadedRef.current = true;
    };
    
    script.onerror = (error) => {
      console.error('❌ Erreur chargement script RumbleTalk:', error);
    };
    
    // Ajouter le script au body
    document.body.appendChild(script);
    
    // Cleanup function
    return () => {
      const scriptElement = document.getElementById('rumbletalk-script-admin');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
        scriptLoadedRef.current = false;
        console.log('🔄 Script RumbleTalk retiré');
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Communauté - RumbleTalk */}
      <div className="flex-1 flex flex-col p-4 pt-16">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">💬 Chat Communauté</h1>
          <p className="text-gray-400">Discute avec la communauté en temps réel</p>
        </div>
        
        {/* Container pour RumbleTalk */}
        <div className="flex-1 flex items-center justify-center">
          <div style={{ height: '700px', width: '100%', maxWidth: '1200px' }}>
            <div id="rt-557e982f6b67541655c3270785d365db" ref={containerRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCommunauteAdmin;

