import React from 'react';

interface RumbleTalkProps {
  chatHash?: string;
}

const RumbleTalk: React.FC<RumbleTalkProps> = () => {
  // Utiliser une page HTML locale qui charge le script RumbleTalk
  const iframeUrl = '/rumbletalk.html';

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ height: '700px', width: '100%', maxWidth: '1200px' }}>
        <iframe
          src={iframeUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', borderRadius: '8px' }}
          allow="microphone; camera"
          title="RumbleTalk Chat"
        />
      </div>
    </div>
  );
};

export default RumbleTalk;

