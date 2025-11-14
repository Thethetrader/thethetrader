import React, { useEffect, useRef } from 'react';

const ChatCommunauteAdmin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    console.log('🚀 ChatCommunauteAdmin monté');
    
    // Vérifier si le script Tawk.to existe déjà
    const existingScript = document.getElementById('tawkto-script-admin');
    if (existingScript) {
      console.log('⚠️ Script Tawk.to déjà présent, suppression...');
      existingScript.remove();
    }

    console.log('🔄 Chargement du script Tawk.to...');

    // Initialiser Tawk_API
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Créer et ajouter le script Tawk.to
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/68ec2d91af8498194f4f9fc1/1j7d940jh';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.id = 'tawkto-script-admin';
    
    script.onload = () => {
      console.log('✅ Script Tawk.to chargé avec succès');
      scriptLoadedRef.current = true;
    };
    
    script.onerror = (error) => {
      console.error('❌ Erreur chargement script Tawk.to:', error);
    };
    
    console.log('📝 Ajout du script Tawk.to...');
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      console.log('🧹 Nettoyage du script Tawk.to...');
      const scriptElement = document.getElementById('tawkto-script-admin');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
        scriptLoadedRef.current = false;
        console.log('✅ Script Tawk.to retiré');
      }
      
      // Nettoyer aussi Tawk_API
      if ((window as any).Tawk_API) {
        delete (window as any).Tawk_API;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Communauté - Tawk.to */}
      <div className="flex-1 flex flex-col p-4 pt-16">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">💬 Chat Communauté</h1>
          <p className="text-gray-400">Discute avec la communauté en temps réel via Tawk.to</p>
          <p className="text-gray-500 text-sm mt-2">Le widget de chat apparaîtra en bas à droite de l'écran</p>
        </div>
        
        {/* Le widget Tawk.to s'affichera automatiquement en bas à droite */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <p className="text-xl mb-2">🎯 Widget de chat actif</p>
            <p>Le chat Tawk.to est disponible en bas à droite de votre écran</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCommunauteAdmin;

