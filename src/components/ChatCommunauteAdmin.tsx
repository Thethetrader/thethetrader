import React, { useEffect, useRef } from 'react';

const ChatCommunauteAdmin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    console.log('🚀 ChatCommunauteAdmin monté');
    
    // Vérifier si le script existe déjà
    const existingScript = document.getElementById('rumbletalk-script-admin');
    if (existingScript) {
      console.log('⚠️ Script RumbleTalk déjà présent, suppression...');
      existingScript.remove();
    }

    // Vérifier si le container existe
    const container = document.getElementById('rt-557e982f6b67541655c3270785d365db');
    console.log('📦 Container RumbleTalk:', container);

    console.log('🔄 Création du script RumbleTalk...');

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
    
    console.log('📝 Ajout du script au head...');
    // Ajouter le script au head au lieu du body
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      console.log('🧹 Nettoyage du script RumbleTalk...');
      const scriptElement = document.getElementById('rumbletalk-script-admin');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
        scriptLoadedRef.current = false;
        console.log('✅ Script RumbleTalk retiré');
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

