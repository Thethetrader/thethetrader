import React from 'react';

interface RumbleTalkProps {
  chatHash?: string;
}

const RumbleTalk: React.FC<RumbleTalkProps> = ({ chatHash = 'I1V9ro8' }) => {
  // URL iframe RumbleTalk
  const iframeUrl = `https://rumbletalk.com/client/?${chatHash}`;

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

